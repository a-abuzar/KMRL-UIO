import pandas as pd
import numpy as np

# --- Configuration & Constants ---
NUM_TRAINS = 25
TRAIN_IDS = [f"TS-{i:02}" for i in range(1, NUM_TRAINS + 1)]

def generate_mileage_data():
    """
    Generates a realistic mileage_balancing.csv with derived urgency levels.
    """
    print("Generating 'new_mileage_balancing.csv'...")

    mileage_records = []
    
    # Use a seed for consistent random results
    np.random.seed(555)

    for train_id in TRAIN_IDS:
        # Assign a maintenance cycle. Assume minor services are more frequent.
        maintenance_threshold = np.random.choice([5000, 20000], p=[0.7, 0.3])
        
        # Simulate a realistic total mileage for the train
        total_kilometers = np.random.randint(40000, 65000)
        
        # Generate a realistic value for kilometers run since the last service
        # This value should be less than the threshold
        km_since_last_maintenance = np.random.randint(100, maintenance_threshold * 1.05) # Allow for slight overruns
        # Ensure it doesn't exceed the threshold in a strange way
        km_since_last_maintenance = min(km_since_last_maintenance, maintenance_threshold + 500)


        # Calculate the percentage of the maintenance cycle consumed
        percentage_used = (km_since_last_maintenance / maintenance_threshold) * 100

        # Derive the Urgency Level based on the percentage
        if percentage_used > 98:
            urgency_level = 'Critical'
        elif 90 <= percentage_used <= 98:
            urgency_level = 'High'
        elif 75 <= percentage_used < 90:
            urgency_level = 'Medium'
        else:
            urgency_level = 'Low'
            
        mileage_records.append({
            'TrainSet_ID': train_id,
            'Total_Kilometers': total_kilometers,
            'Kilometers_Since_Last_Maintenance': km_since_last_maintenance,
            'Maintenance_Threshold': maintenance_threshold,
            'Urgency_Level': urgency_level
        })

    df = pd.DataFrame(mileage_records)
    df.to_csv('mileage_balancing.csv', index=False)
    print("✅ Successfully generated 'mileage_balancing.csv'")

if __name__ == '__main__':
    generate_mileage_data()
