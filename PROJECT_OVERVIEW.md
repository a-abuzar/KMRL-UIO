# Project Overview: KMRL Unified Intelligence Operator

This document outlines the technical stack and the overall workflow of the KMRL Unified Intelligence Operator project.

## Tech Stack

### Frontend
*   **Framework:** React.js
*   **Build Tool:** Create React App
*   **Routing:** React Router DOM
*   **Styling:** Custom CSS (with a focus on modern UI/UX, likely inspired by Material Design principles given the component structure)
*   **Dependencies:** `react`, `react-dom`, `react-scripts`, `react-router-dom`, `web-vitals`

### Backend
*   **Framework:** Django
*   **API Framework:** Django REST Framework
*   **Database:** SQLite (development), potentially PostgreSQL (production, indicated by `psycopg2-binary`)
*   **Data Processing:** `numpy`, `pandas`, `scipy` (for numerical operations and data manipulation, especially for the A* algorithm)
*   **Environment Management:** `python-dotenv`
*   **CORS Handling:** `django-cors-headers`
*   **Dependencies:** `Django`, `djangorestframework`, `numpy`, `pandas`, `scipy`, `python-dotenv`, `django-cors-headers`, `psycopg2-binary`

## Project Workflow

The application is a full-stack web application designed to optimize railway fleet induction plans using an A* pathfinding algorithm and provide comprehensive analytics.

### 1. Data Ingestion and Management
*   **Data Sources:** Various operational data (branding priorities, cleaning, fitness certificates, job card status, mileage balancing, stabling geometry) are stored in `.csv` files within the `data/` directory.
*   **Backend Model:** The `api/models.py` defines a `Data` model, likely used to manage metadata about these data files or allow for user uploads.
*   **API Endpoints:** The backend exposes API endpoints (`/api/data/`, `/api/data/<int:pk>/`) to list, create, retrieve, update, and delete these data entries.

### 2. A* Pathfinding Optimization (Backend)
*   **Core Logic:** The `backend/api/optimizer.py` module contains the implementation of the A* pathfinding algorithm.
*   **Data Loading:** The `optimizer.load_data(data_type)` function reads specific `.csv` files based on the `data_type` parameter (e.g., `mileage_balancing.csv`).
*   **Graph Creation:** `optimizer.create_graph(data)` constructs a graph representation from the loaded data, typically using `node1`, `node2`, and `weight` to define edges.
*   **Heuristic Function:** A `heuristic` function is defined, though currently it returns 0, effectively making the A* algorithm behave like Dijkstra's algorithm (shortest path without heuristic guidance).
*   **A* Algorithm:** The `optimizer.astar(graph, start, goal, heuristic)` function executes the A* search to find the optimal path and its cost.
*   **Optimization Endpoint:** The `/api/optimize/` endpoint (handled by `views.optimize_view`) receives `start_node`, `end_node`, and `data_type` from the frontend, triggers the A* optimization, and returns the calculated `path` and `cost`.

### 3. Frontend Interaction and Visualization
*   **User Interface:** The React frontend (`frontend/src/App.js`) provides a multi-view interface:
    *   **Master Data:** Displays comprehensive train fleet information.
    *   **Data Tables:** Presents various operational data from CSV files in tabular format, with filtering and searching capabilities.
    *   **Analytics:** Offers a dashboard with metrics (fleet health, compliance, risk, efficiency) and charts to visualize operational performance.
    *   **What-If Scenarios:** Allows users to define and simulate different operational parameters and constraints to observe their impact on the induction plan.
    *   **Induction Plan:** The primary view where users can:
        *   Configure optimization parameters (e.g., required service fleet, maintenance limits, objective weights).
        *   Generate an induction plan by making a POST request to the `/api/generate-plan/` endpoint (which internally calls the A* optimization).
        *   Visualize the generated plan, categorized by status (SERVICE, STANDBY, MAINTENANCE, CLEANING).
        *   View alerts and detected conflicts within the plan.
        *   Export reports (JSON, CSV, PDF) of the plan and analytics.
*   **API Communication:** The frontend communicates with the Django backend using `fetch` API calls to retrieve data, generate plans, and perform simulations.
*   **State Management:** React's `useState` and `useEffect` hooks are used for managing application state, data loading, and side effects.
*   **Components:** The application is structured into various React components for modularity (e.g., `Navbar`, `DataView`, `AnalyticsDashboard`, `WhatIfSimulator`, `PlanView`, and several table/chart components).

### 4. Reporting and Conflict Resolution
*   **Alerts & Conflicts:** The frontend includes logic to detect and display alerts and conflicts within the generated plan (e.g., insufficient fleet, capacity exceeded, critical trains in service).
*   **Export Functionality:** Users can export the generated plan, analytics, and comprehensive reports in various formats (CSV, JSON, and a basic text-based PDF).

## Overall Goal

The project aims to provide a robust tool for railway operators to make informed decisions regarding fleet allocation, maintenance scheduling, and operational planning by leveraging data-driven insights and optimization algorithms.