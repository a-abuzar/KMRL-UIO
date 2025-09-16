import pandas as pd
from ortools.sat.python import cp_model
from dataclasses import dataclass, field
from typing import List, Dict, Any

# --- Configuration Class ---
@dataclass
class InductionPlannerConfig:
    """Holds all business rules and tunable parameters for the optimization."""
    # Fleet size constraints
    required_service_fleet: int = 8  # Default, will be overridden by API call
    min_standby_fleet: int = 3

    # Resource capacity constraints
    max_maintenance_trains: int = 4
    max_cleaning_trains: int = 7

    # Objective function weights (tunable priorities)
    w_sla: int = 50
    w_cleaning: int = 20
    w_mileage: int = 10
    w_shunting: int = 5

# --- Optimization Model Class ---
class InductionDecisionModel:
    """Encapsulates the entire optimization model logic."""
    def __init__(self, master_data: pd.DataFrame, config: InductionPlannerConfig):
        self.df = master_data
        self.config = config
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()
        # The index is already TrainSet_ID from load_master_data
        self.trains = self.df.index.tolist()
        self.decisions: Dict[str, Any] = {}
        self.status = None

    def _create_decision_variables(self):
        """Creates boolean variables for each possible train assignment."""
        for train_id in self.trains:
            self.decisions[train_id] = {
                'is_in_service': self.model.NewBoolVar(f"{train_id}_service"),
                'is_on_standby': self.model.NewBoolVar(f"{train_id}_standby"),
                'is_in_maintenance': self.model.NewBoolVar(f"{train_id}_maint"),
                'is_being_cleaned': self.model.NewBoolVar(f"{train_id}_clean"),
            }

    def _apply_hard_constraints(self):
        """Applies all non-negotiable operational rules to the model."""
        num_service = sum(d['is_in_service'] for d in self.decisions.values())
        num_standby = sum(d['is_on_standby'] for d in self.decisions.values())
        num_maint = sum(d['is_in_maintenance'] for d in self.decisions.values())
        num_clean = sum(d['is_being_cleaned'] for d in self.decisions.values())

        # 1. Fleet size constraints
        self.model.Add(num_service == self.config.required_service_fleet)
        self.model.Add(num_standby >= self.config.min_standby_fleet)

        # 2. Resource capacity constraints
        self.model.Add(num_maint <= self.config.max_maintenance_trains)
        self.model.Add(num_clean <= self.config.max_cleaning_trains)

        for train_id in self.trains:
            train_data = self.df.loc[train_id]
            d = self.decisions[train_id]
            
            # 3. State exclusivity: A train can only be in one state
            self.model.Add(sum(d.values()) == 1)

            # 4. Safety lockouts
            is_unsafe = (
                train_data['Rolling-Stock_Status'] == 'Expired' or
                train_data['Signalling_Status'] == 'Expired' or
                train_data['Telecom_Status'] == 'Expired' or
                train_data['Highest_Open_Job_Priority'] == 'Critical'
            )
            if is_unsafe:
                self.model.Add(d['is_in_service'] == 0)
                self.model.Add(d['is_on_standby'] == 0)

    def _define_objective_function(self):
        """Defines the weighted objective to be maximized."""
        objective_terms = []
        for train_id in self.trains:
            train_data = self.df.loc[train_id]
            d = self.decisions[train_id]

            # 1. SLA Revenue Score (Higher is better)
            sla_score = 0
            if train_data['Penalty_Risk_Level'] == 'Critical': sla_score = 3
            elif train_data['Penalty_Risk_Level'] == 'High': sla_score = 1
            objective_terms.append(self.config.w_sla * sla_score * d['is_in_service'])

            # 2. Cleaning Compliance Score (Higher is better)
            cleaning_score = 1 if train_data['Compliance_Status'] == 'Overdue' else 0
            objective_terms.append(self.config.w_cleaning * cleaning_score * d['is_being_cleaned'])
            
            # 3. Mileage Penalty (Lower is better, so we subtract)
            mileage_penalty = 0
            if train_data['Urgency_Level'] == 'Critical': mileage_penalty = 3
            elif train_data['Urgency_Level'] == 'High': mileage_penalty = 1
            objective_terms.append(-self.config.w_mileage * mileage_penalty * d['is_in_service'])

            # 4. Shunting Penalty (Lower is better, so we subtract)
            shunting_penalty = train_data['Estimated_Shunting_Time_Minutes']
            objective_terms.append(-self.config.w_shunting * shunting_penalty * d['is_in_service'])
        
        self.model.Maximize(sum(objective_terms))

    def solve(self):
        """Runs the optimization process."""
        self._create_decision_variables()
        self._apply_hard_constraints()
        self._define_objective_function()
        self.status = self.solver.Solve(self.model)
        return self.status

# --- Explainability Layer Class ---
class SolutionAnalyzer:
    """Analyzes the solver's output and generates human-readable justifications."""
    def __init__(self, master_data, decisions, solver):
        self.df = master_data
        self.decisions = decisions
        self.solver = solver

    def generate_plan_with_justifications(self) -> List[Dict[str, Any]]:
        plan = []
        for train_id, decision_vars in self.decisions.items():
            train_data = self.df.loc[train_id]
            assigned_status = "UNKNOWN"
            justification = "No specific assignment priority."

            if self.solver.Value(decision_vars['is_in_service']):
                assigned_status = "SERVICE"
                if train_data['Penalty_Risk_Level'] in ['Critical', 'High']:
                    justification = f"Prioritized for service to mitigate a '{train_data['Penalty_Risk_Level']}' branding SLA penalty risk."
                elif train_data['Estimated_Shunting_Time_Minutes'] == 0:
                    justification = "Selected for service due to optimal depot position (zero shunting time)."
                else:
                    justification = "Assigned to meet daily service fleet requirement."

            elif self.solver.Value(decision_vars['is_on_standby']):
                assigned_status = "STANDBY"
                justification = "Healthy and available; assigned to meet standby fleet requirement."

            elif self.solver.Value(decision_vars['is_in_maintenance']):
                assigned_status = "MAINTENANCE"
                if train_data['Highest_Open_Job_Priority'] == 'Critical':
                    justification = f"Mandatory maintenance due to a 'Critical' open job card."
                elif train_data['Rolling-Stock_Status'] == 'Expired' or train_data['Signalling_Status'] == 'Expired' or train_data['Telecom_Status'] == 'Expired':
                    justification = f"Mandatory maintenance due to an expired fitness certificate."
                else:
                    justification = "Assigned to maintenance based on model's cost-benefit analysis."

            elif self.solver.Value(decision_vars['is_being_cleaned']):
                assigned_status = "CLEANING"
                if train_data['Compliance_Status'] == 'Overdue':
                    justification = f"Prioritized for cleaning as it is {train_data['Days_Since_Last_Clean'] - 15} day(s) overdue for its 15-day deep clean."
                else:
                    justification = "Assigned to a cleaning slot to maintain schedule."

            plan.append({
                'TrainSet_ID': train_id,
                'Assigned_Status': assigned_status,
                'Justification': justification,
            })
        return plan
