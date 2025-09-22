from django.conf import settings
import pandas as pd
import os
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ortools.sat.python import cp_model

from .optimizer import (
    InductionPlannerConfig,
    InductionDecisionModel,
    SolutionAnalyzer,
)

# Configure logging
log_file_path = os.path.join(settings.BASE_DIR.parent, 'debug.log')
logging.basicConfig(filename=log_file_path, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def load_master_data():
    """Helper function to load and prepare the master data file."""
    logging.info("Attempting to load master_train_data.csv")
    try:
        data_file_path = os.path.join(settings.BASE_DIR.parent, "data", "master_train_data.csv")
        logging.info(f"Looking for file at: {data_file_path}")
        df = pd.read_csv(data_file_path)
        df.set_index('TrainSet_ID', inplace=True)
        logging.info("Successfully loaded and prepared master_train_data.csv")
        return df
    except FileNotFoundError as e:
        logging.error(f"FileNotFoundError in load_master_data: {e}")
        return None
    except Exception as e:
        logging.error(f"An unexpected error occurred in load_master_data: {e}")
        return None

import numpy as np

def generate_analytics_data(master_data, plan):
    """Generate analytics data for the frontend dashboard."""
    try:
        # Calculate fleet health metrics
        total_trains = len(master_data)
        service_ready = len(master_data[
            (master_data['Rolling-Stock_Status'] == 'Valid') & 
            (master_data['Signalling_Status'] == 'Valid') & 
            (master_data['Telecom_Status'] == 'Valid')
        ])
        
        critical_issues = len(master_data[master_data['Urgency_Level'] == 'Critical'])
        maintenance_due = len(master_data[master_data['Urgency_Level'] == 'High'])
        
        # Calculate plan distribution
        plan_distribution = {}
        for item in plan:
            status = item['Assigned_Status']
            plan_distribution[status] = plan_distribution.get(status, 0) + 1
        
        # Calculate efficiency metrics
        avg_shunting_time = master_data['Estimated_Shunting_Time_Minutes'].mean()
        optimal_positioned = len(master_data[master_data['Estimated_Shunting_Time_Minutes'] == 0])
        
        # Calculate risk assessment
        critical_risks = len(master_data[
            (master_data['Urgency_Level'] == 'Critical') | 
            (master_data['Penalty_Risk_Level'] == 'Critical')
        ])
        high_risks = len(master_data[
            (master_data['Urgency_Level'] == 'High') | 
            (master_data['Penalty_Risk_Level'] == 'High')
        ])
        
        analytics = {
            "fleetHealth": {
                "totalTrains": int(total_trains),
                "serviceReady": int(service_ready),
                "healthPercentage": round((service_ready / total_trains) * 100, 1),
                "criticalIssues": int(critical_issues),
                "maintenanceDue": int(maintenance_due)
            },
            "complianceMetrics": {
                "cleaningCompliance": 85,  # Placeholder - would need cleaning data
                "contractCompliance": 90,  # Placeholder - would need contract data
                "overdueCleaning": 0,     # Placeholder
                "atRiskContracts": 0      # Placeholder
            },
            "planDistribution": plan_distribution,
            "efficiencyMetrics": {
                "avgShuntingTime": round(avg_shunting_time, 1),
                "optimalPositioned": int(optimal_positioned),
                "positioningEfficiency": round((optimal_positioned / total_trains) * 100, 1)
            },
            "riskAssessment": {
                "criticalRisks": int(critical_risks),
                "highRisks": int(high_risks),
                "totalRisks": int(critical_risks + high_risks),
                "riskScore": min(100, critical_risks * 10 + high_risks * 5)
            },
            "trends": {
                "fleetUtilization": 85,
                "maintenanceEfficiency": 92,
                "complianceTrend": "stable",
                "costTrend": "stable"
            }
        }
        
        return analytics
    except Exception as e:
        logging.error(f"Error generating analytics data: {e}")
        return None

def load_csv_data(filename):
    """Helper function to load any CSV file from the data directory."""
    try:
        data_file_path = os.path.join(settings.BASE_DIR.parent, "data", filename)
        df = pd.read_csv(data_file_path)
        # Replace NaN with None for JSON compatibility
        df.replace({np.nan: None}, inplace=True)
        return df.to_dict(orient='records')
    except FileNotFoundError as e:
        logging.error(f"FileNotFoundError loading {filename}: {e}")
        return None
    except Exception as e:
        logging.error(f"Error loading {filename}: {e}")
        return None

class MasterDataView(APIView):
    """Endpoint to provide the frontend with all train data for the detail modals."""
    def get(self, request, *args, **kwargs):
        logging.info("MasterDataView: GET request received.")
        df = load_master_data()
        if df is None:
            logging.error("MasterDataView: load_master_data returned None.")
            return Response(
                {"error": "'master_train_data.csv' not found. Please run the data generation and consolidation scripts first."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Replace NaN with None for JSON compatibility
        df.replace({np.nan: None}, inplace=True)

        records = df.reset_index().to_dict(orient='records')
        logging.info("MasterDataView: Successfully processed data, sending response.")
        return Response(records)

class GeneratePlanView(APIView):
    """The main endpoint to run the optimization and return the plan."""
    def post(self, request, *args, **kwargs):
        logging.info("GeneratePlanView: POST request received.")
        
        # Extract config from request, with defaults
        data = request.data
        try:
            config = InductionPlannerConfig(
                required_service_fleet=int(data.get('required_service_fleet', 8)),
                min_standby_fleet=int(data.get('min_standby_fleet', 3)),
                max_maintenance_trains=int(data.get('max_maintenance_trains', 4)),
                max_cleaning_trains=int(data.get('max_cleaning_trains', 7)),
                w_sla=int(data.get('w_sla', 50)),
                w_cleaning=int(data.get('w_cleaning', 20)),
                w_mileage=int(data.get('w_mileage', 10)),
                w_shunting=int(data.get('w_shunting', 5)),
            )
        except (ValueError, TypeError) as e:
            logging.warning(f"GeneratePlanView: Invalid parameter type: {e}")
            return Response(
                {"error": "Invalid parameter type. All configuration values must be integers."},
                status=status.HTTP_400_BAD_REQUEST
            )

        master_data = load_master_data()
        if master_data is None:
            logging.error("GeneratePlanView: load_master_data returned None.")
            return Response(
                {"error": "'master_train_data.csv' not found."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        model = InductionDecisionModel(master_data, config)
        
        logging.info(f"GeneratePlanView: Starting optimization with config: {config}")
        solver_status = model.solve()
        
        alerts = []
        if solver_status == cp_model.FEASIBLE and solver_status != cp_model.OPTIMAL:
            alerts.append("Optimization found a feasible solution, but it's not optimal. Consider adjusting parameters.")

        if solver_status == cp_model.OPTIMAL or solver_status == cp_model.FEASIBLE:
            analyzer = SolutionAnalyzer(master_data, model.decisions, model.solver)
            final_plan = analyzer.generate_plan_with_justifications()
            
            # Generate analytics data
            analytics = generate_analytics_data(master_data, final_plan)
            
            logging.info("GeneratePlanView: Optimization successful, sending plan.")
            return Response({
                "status": "success", 
                "plan": final_plan, 
                "alerts": alerts,
                "analytics": analytics
            })
        else:
            logging.error("GeneratePlanView: Optimization failed.")
            return Response(
                {"error": "Optimization failed. Could not find a feasible solution. Check constraints and input data.", "alerts": alerts},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# New CSV Data Views
class BrandingPrioritiesView(APIView):
    def get(self, request, *args, **kwargs):
        data = load_csv_data("branding_priorities.csv")
        if data is None:
            return Response({"error": "Failed to load branding priorities data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(data)

class CleaningDetailingView(APIView):
    def get(self, request, *args, **kwargs):
        data = load_csv_data("cleaning_detailing.csv")
        if data is None:
            return Response({"error": "Failed to load cleaning detailing data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(data)

class FitnessCertificatesView(APIView):
    def get(self, request, *args, **kwargs):
        data = load_csv_data("fitness_certificates.csv")
        if data is None:
            return Response({"error": "Failed to load fitness certificates data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(data)

class JobcardStatusView(APIView):
    def get(self, request, *args, **kwargs):
        data = load_csv_data("jobcard_status.csv")
        if data is None:
            return Response({"error": "Failed to load jobcard status data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(data)

class MileageBalancingView(APIView):
    def get(self, request, *args, **kwargs):
        data = load_csv_data("mileage_balancing.csv")
        if data is None:
            return Response({"error": "Failed to load mileage balancing data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(data)

class StablingGeometryView(APIView):
    def get(self, request, *args, **kwargs):
        data = load_csv_data("stabling_geometry.csv")
        if data is None:
            return Response({"error": "Failed to load stabling geometry data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(data)
