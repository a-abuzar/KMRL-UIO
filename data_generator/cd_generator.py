import pandas as pd
import numpy as np
from datetime import date, timedelta

# --- Configuration & Constants ---
TODAY = date(2025, 9, 12)
NUM_TRAINS = 25
TRAIN_IDS = [f"TS-{i:02}" for i in range(1, NUM_TRAINS + 1)]
DEEP_CLEAN_CYCLE_DAYS = 15

def generate_cleaning_data():
    """
    Generates a realistic cleaning_detailing.csv based on compliance status.
    """
    print("Generating 'new_cleaning_detailing.csv'...")

    cleaning_records = []
    
    # Use a seed for consistent random results
    np.random.seed(303)

    for train_id in TRAIN_IDS:
        # Randomize the last clean date to create a realistic spread
        # A range up to 20 days ensures some trains will be overdue
        days_ago = np.random.randint(1, 21)
        last_clean_date = TODAY - timedelta(days=days_ago)
        
        days_since_clean = (TODAY - last_clean_date).days

        # Derive the Compliance Status based on the 15-day rule
        if days_since_clean > DEEP_CLEAN_CYCLE_DAYS:
            status = 'Overdue'
        elif DEEP_CLEAN_CYCLE_DAYS - 1 <= days_since_clean <= DEEP_CLEAN_CYCLE_DAYS:
            status = 'Due Soon'
        else:
            status = 'Compliant'

        cleaning_records.append({
            'TrainSet_ID': train_id,
            'Last_Deep_Clean_Date': last_clean_date.strftime('%Y-%m-%d'),
            'Days_Since_Last_Clean': days_since_clean,
            'Compliance_Status': status
        })

    df = pd.DataFrame(cleaning_records)
    df.to_csv('cleaning_detailing.csv', index=False)
    print("✅ Successfully generated 'cleaning_detailing.csv'")

if __name__ == '__main__':
    generate_cleaning_data()
