import pandas as pd
import numpy as np

# --- Configuration & Constants ---
NUM_TRAINS = 25
TRAIN_IDS = [f"TS-{i:02}" for i in range(1, NUM_TRAINS + 1)]

def generate_jobcard_status():
    """
    Generates a realistic jobcard_status.csv with a dynamic mix of tasks.
    """
    print("Generating 'new_jobcard_status.csv'...")

    tasks = {
        'Critical': ["Unscheduled brake system inspection", "Signalling antenna malfunction", "Door mechanism fault on coach B"],
        'High': ["Traction motor overheating diagnosis", "Pantograph arcing and carbon deposit cleaning", "20000 km major bogie overhaul"],
        'Medium': ["HVAC compressor check", "5000 km minor inspection and lubrication", "Brake pad replacement and calibration"],
        'Low': ["Cosmetic scratch on exterior wrap", "One interior light out in coach C", "Non-essential passenger display flickering"]
    }
    
    work_orders = []
    total_jobs = 40
    
    statuses = np.random.choice(
        ['Completed', 'Scheduled', 'In Progress', 'Open'], 
        total_jobs, 
        p=[0.60, 0.20, 0.10, 0.10]
    )

    np.random.seed(101) # Use a different seed for variety

    for i, status in enumerate(statuses):
        if status in ['Open', 'In Progress']:
            priority = np.random.choice(['Critical', 'High', 'Medium', 'Low'], p=[0.15, 0.25, 0.40, 0.20])
        else:
            priority = np.random.choice(['High', 'Medium', 'Low'], p=[0.10, 0.50, 0.40])
        
        description = np.random.choice(tasks[priority])
        
        work_orders.append({
            'Work_Order_ID': f"WO-{20250912 + i}",
            'TrainSet_ID': np.random.choice(TRAIN_IDS),
            'Maintenance_Description': description,
            'Work_Status': status,
            'Priority_Level': priority
        })

    df = pd.DataFrame(work_orders)
    df.to_csv('jobcard_status.csv', index=False)
    print("✅ Successfully generated 'jobcard_status.csv'")

if __name__ == '__main__':
    generate_jobcard_status()
