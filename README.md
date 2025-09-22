# AI-Driven Train Induction Planning & Scheduling for KMRL

## Overview

This project is a decision-support platform for Kochi Metro Rail Limited (KMRL) to optimize daily train induction planning and scheduling. The system automates the complex process of deciding which trainsets to deploy for revenue service, which to keep on standby, and which to schedule for maintenance. It replaces a manual, error-prone process with a data-driven, algorithmic approach, ensuring higher fleet availability, lower lifecycle costs, and improved operational efficiency.

The platform ingests data from various sources, including fitness certificates, maintenance job cards, branding commitments, mileage logs, cleaning schedules, and depot stabling geometry. It uses a multi-objective optimization algorithm to generate a ranked induction list with explainable reasoning, conflict alerts, and "what-if" simulation capabilities.

## Features

*   **Automated Induction Planning**: Generates an optimized daily induction plan based on configurable constraints and priorities.
*   **Data-Driven Decisions**: Ingests and processes data from multiple sources to provide a holistic view of the fleet's operational readiness.
*   **Multi-Objective Optimization**: Balances competing objectives such as service readiness, reliability, maintenance costs, and branding exposure.
*   **What-If Scenario Simulation**: Allows operators to simulate the impact of different decisions and constraints on the induction plan.
*   **Conflict Detection & Alerts**: Identifies and flags potential conflicts, such as scheduling a train with an expired fitness certificate for service.
*   **Comprehensive Analytics**: Provides a dashboard with key performance indicators (KPIs) on fleet health, compliance, and efficiency.
*   **Data Visualization**: Presents complex operational data in an intuitive and easy-to-understand format.
*   **Reporting**: Exports induction plans, analytics, and reports in various formats (JSON, CSV, PDF).

## Tech Stack

### Frontend

*   **Framework**: React.js
*   **Styling**: Custom CSS
*   **Dependencies**:
    *   `react`
    *   `react-dom`
    *   `react-scripts`

### Backend

*   **Framework**: Django
*   **API**: Django REST Framework
*   **Data Processing**:
    *   `pandas`
    *   `numpy`
*   **Optimization**:
    *   `ortools`
*   **Database**: SQLite (for development)

## Project Structure

```
astar_v2/
├── backend/
│   ├── api/
│   │   ├── optimizer.py      # Core optimization logic
│   │   ├── views.py          # API endpoints
│   │   └── urls.py           # URL routing
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main application component
│   │   ├── Navbar.js         # Navigation component
│   │   └── DataView.css      # Styles for data tables
│   └── package.json
└── data/
    ├── master_train_data.csv
    ├── branding_priorities.csv
    ├── cleaning_detailing.csv
    ├── fitness_certificates.csv
    ├── jobcard_status.csv
    ├── mileage_balancing.csv
    └── stabling_geometry.csv
```

## Getting Started

### Prerequisites

*   Python 3.8+
*   Node.js 14+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Access the Application

*   **Frontend**: `http://localhost:3000`
*   **Backend API**: `http://127.0.0.1:8000`

## API Endpoints

| Endpoint                  | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `/api/master-data/`         | Master train data                                 |
| `/api/branding-priorities/` | Branding contracts                                |
| `/api/cleaning-detailing/`  | Cleaning schedules                                |
| `/api/fitness-certificates/`| Certificate status                                |
| `/api/jobcard-status/`      | Work orders                                       |
| `/api/mileage-balancing/`   | Mileage tracking                                  |
| `/api/stabling-geometry/`   | Train positioning                                 |
| `/api/optimize/`            | Triggers the A* optimization                      |
| `/api/generate-plan/`       | Generates the train induction plan                |

## Usage

1.  **Navigate to Data Tables**: Click on "Data Tables" in the navigation to view the raw operational data.
2.  **Configure Induction Plan**: Go to the "Induction Plan" view to set the parameters for the optimization, such as the required number of trains for service and maintenance constraints.
3.  **Generate Plan**: Click the "Generate Plan" button to run the optimization algorithm and generate the daily induction plan.
4.  **Review Plan**: The generated plan will be displayed, categorized by status (SERVICE, STANDBY, MAINTENANCE, CLEANING). Any conflicts or alerts will be highlighted.
5.  **Simulate Scenarios**: Use the "What-If Scenarios" view to test different operational parameters and see their impact on the plan.
6.  **View Analytics**: The "Analytics" dashboard provides a high-level overview of the fleet's performance and readiness.
