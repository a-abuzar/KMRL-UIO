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
        service_fleet = request.data.get('service_fleet')
        if not service_fleet or not isinstance(service_fleet, int) or not (7 <= service_fleet <= 22):
            logging.warning(f"GeneratePlanView: Invalid 'service_fleet' parameter: {service_fleet}")
            return Response(
                {"error": "A valid 'service_fleet' integer between 7 and 22 is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        master_data = load_master_data()
        if master_data is None:
            logging.error("GeneratePlanView: load_master_data returned None.")
            return Response(
                {"error": "'master_train_data.csv' not found."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        config = InductionPlannerConfig(required_service_fleet=service_fleet)
        model = InductionDecisionModel(master_data, config)
        
        logging.info("GeneratePlanView: Starting optimization solver.")
        solver_status = model.solve()
        if solver_status == cp_model.OPTIMAL or solver_status == cp_model.FEASIBLE:
            analyzer = SolutionAnalyzer(master_data, model.decisions, model.solver)
            final_plan = analyzer.generate_plan_with_justifications()
            logging.info("GeneratePlanView: Optimization successful, sending plan.")
            return Response({"status": "success", "plan": final_plan})
        else:
            logging.error("GeneratePlanView: Optimization failed.")
            return Response(
                {"error": "Optimization failed. Could not find a feasible solution. Check constraints and input data."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
