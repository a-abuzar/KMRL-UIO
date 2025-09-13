import pandas as pd
import numpy as np

# --- Configuration & Constants ---
NUM_TRAINS = 25
TRAIN_IDS = [f"TS-{i:02}" for i in range(1, NUM_TRAINS + 1)]

def generate_stabling_data():
    """
    Generates a realistic stabling_geometry.csv based on a simulated depot layout.
    """
    print("Generating 'new_stabling_geometry.csv'...")

    stabling_records = []
    
    # Simulate a depot layout: e.g., 3 tracks, with 8-9 positions each
    tracks = ['STB-A', 'STB-B', 'STB-C']
    positions_per_track = {'STB-A': 8, 'STB-B': 9, 'STB-C': 8}
    
    depot_slots = []
    for track, num_pos in positions_per_track.items():
        for pos in range(1, num_pos + 1):
            depot_slots.append({'track': track, 'position': pos})

    # Use a seed for consistent random results and shuffle train assignments
    np.random.seed(777)
    shuffled_trains = list(TRAIN_IDS)
    np.random.shuffle(shuffled_trains)

    for i, slot in enumerate(depot_slots):
        train_id = shuffled_trains[i]
        position = slot['position']

        # Logic to determine accessibility based on position
        if position <= 2:
            shunting_required = "No"
            shunting_time = 0
            accessibility_score = 100
        else:
            shunting_required = "Yes"
            # Increase shunting time and decrease score for deeper positions
            shunting_time = 2 + (position - 2) * 3
            accessibility_score = max(10, 100 - (position - 2) * 15)

        stabling_records.append({
            'TrainSet_ID': train_id,
            'Track_ID': slot['track'],
            'Position': position,
            'Shunting_Required': shunting_required,
            'Estimated_Shunting_Time_Minutes': shunting_time,
            'Accessibility_Score': accessibility_score
        })

    df = pd.DataFrame(stabling_records)
    df.to_csv('stabling_geometry.csv', index=False)
    print("✅ Successfully generated 'stabling_geometry.csv'")

if __name__ == '__main__':
    generate_stabling_data()
