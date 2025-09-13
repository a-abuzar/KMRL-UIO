import pandas as pd
import numpy as np
from datetime import date

# --- Configuration & Constants ---
TODAY = date(2025, 9, 12)
NUM_TRAINS = 25
TRAIN_IDS = [f"TS-{i:02}" for i in range(1, NUM_TRAINS + 1)]
CONTRACT_START_DAY = 1 # Assuming contracts run from the 1st of the month
DAYS_INTO_MONTH = TODAY.day - CONTRACT_START_DAY
DAYS_IN_CONTRACT_MONTH = 30 # Assuming 30-day contract cycle for simplicity

def generate_branding_data():
    """
    Generates a realistic branding_priorities.csv with dynamically calculated risk levels.
    """
    print("Generating 'new_branding_priorities.csv'...")

    branding_records = []
    
    advertisers = [
        "Lulu Mall", "Federal Bank", "Muthoot Finance", "Apollo Tyres",
        "Malayala Manorama", "VKC Pride", "Eastern Condiments", "MyG"
    ]
    
    # Let's assume not all trains have wraps. ~80% of the fleet.
    trains_with_wraps = np.random.choice(TRAIN_IDS, size=int(NUM_TRAINS * 0.8), replace=False)
    
    np.random.seed(99)

    for i, train_id in enumerate(trains_with_wraps):
        required_hours = np.random.randint(180, 221) # e.g., 180-220 hours/month
        avg_daily_exposure = np.random.uniform(8.5, 10.5) # Avg hours in service per day
        
        # Simulate how many days the train was actually in service this month
        # This creates the performance variance
        days_in_service_so_far = np.random.randint(int(DAYS_INTO_MONTH * 0.5), DAYS_INTO_MONTH + 1)
        
        accumulated_hours = round(days_in_service_so_far * avg_daily_exposure, 1)

        # --- Projection Logic to Determine Risk ---
        # This is the core of the simulation
        if days_in_service_so_far > 0:
            daily_run_rate = accumulated_hours / days_in_service_so_far
            days_remaining = DAYS_IN_CONTRACT_MONTH - DAYS_INTO_MONTH
            projected_final_hours = accumulated_hours + (daily_run_rate * days_remaining)
            projected_sla_compliance = (projected_final_hours / required_hours) * 100
        else: # Train has not run at all this month
            projected_sla_compliance = 0

        # Derive the Penalty Risk Level based on the projection
        if projected_sla_compliance < 95:
            risk_level = 'Critical'
        elif 95 <= projected_sla_compliance < 100:
            risk_level = 'High'
        elif 100 <= projected_sla_compliance < 105:
            risk_level = 'Medium'
        else:
            risk_level = 'Low'

        branding_records.append({
            'Contract_ID': f"CON-{TODAY.year}-{i+1:02}",
            'TrainSet_ID': train_id,
            'Advertiser_Name': np.random.choice(advertisers),
            'Required_Exposure_Hours': required_hours,
            'Accumulated_Exposure_Hours': accumulated_hours,
            'Projected_SLA_Compliance_Percentage': round(projected_sla_compliance, 2),
            'Penalty_Risk_Level': risk_level
        })

    df = pd.DataFrame(branding_records)
    df.to_csv('branding_priorities.csv', index=False)
    print("✅ Successfully generated 'branding_priorities.csv'")

if __name__ == '__main__':
    generate_branding_data()
