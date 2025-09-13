import pandas as pd
import numpy as np
from datetime import date, timedelta

# --- Configuration & Constants ---
TODAY = date(2025, 9, 12)
NUM_TRAINS = 25
TRAIN_IDS = [f"TS-{i:02}" for i in range(1, NUM_TRAINS + 1)]

def generate_fitness_certificates():
    """
    Generates a realistic fitness_certificates.csv based on dynamic dates.
    """
    print("Generating 'new_fitness_certificates.csv'...")
    
    certificates = []
    
    validity_periods = {
        'Rolling-Stock': 90,
        'Signalling': 180,
        'Telecom': 120
    }

    np.random.seed(42) # Use a seed for consistent random results

    for train_id in TRAIN_IDS:
        for cert_type, validity_days in validity_periods.items():
            issue_date = TODAY - timedelta(days=np.random.randint(1, 90))
            expiry_date = issue_date + timedelta(days=validity_days)

            if expiry_date < TODAY:
                status = 'Expired'
            elif TODAY <= expiry_date < TODAY + timedelta(days=30):
                status = 'Expiring'
            else:
                status = 'Valid'
            
            certificates.append({
                'TrainSet_ID': train_id,
                'Certificate_Type': cert_type,
                'Certificate_ID': f"CERT-{np.random.randint(10000, 99999)}",
                'Issue_Date': issue_date.strftime('%Y-%m-%d'),
                'Expiry_Date': expiry_date.strftime('%Y-%m-%d'),
                'Validity_Status': status
            })

    df = pd.DataFrame(certificates)
    df.to_csv('fitness_certificates.csv', index=False)
    print("✅ Successfully generated 'fitness_certificates.csv'")

if __name__ == '__main__':
    generate_fitness_certificates()
