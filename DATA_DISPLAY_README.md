# Railway Data Management System

## Overview
This web application displays all CSV data from the `data` folder as neat and clean tables with proper logos and branding. The system provides a comprehensive view of railway operations data through an intuitive tabbed interface.

## Features

### Data Tables
- **Master Train Data**: Comprehensive train fleet information and status
- **Branding Priorities**: Advertising contracts and exposure tracking
- **Cleaning & Detailing**: Train cleaning schedules and compliance status
- **Fitness Certificates**: Train certification status and validity tracking
- **Job Card Status**: Maintenance work orders and progress tracking
- **Mileage Balancing**: Train mileage tracking and maintenance scheduling
- **Stabling Geometry**: Train positioning and shunting requirements

### Design Features
- **Modern UI**: Clean, professional interface with gradient headers
- **Responsive Design**: Works on desktop and mobile devices
- **Color-coded Status**: Visual indicators for different status levels
- **Interactive Tabs**: Easy navigation between different data views
- **Loading States**: Smooth loading animations and error handling
- **Professional Branding**: Railway-themed logos and styling

### Technical Features
- **RESTful API**: Django backend with dedicated endpoints for each CSV file
- **Real-time Data**: Live data loading from CSV files
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **Performance**: Optimized table rendering with sticky headers
- **Scalability**: Easy to add new data sources

## API Endpoints

| Endpoint | Description | Data Source |
|----------|-------------|-------------|
| `/api/master-data/` | Master train data | `master_train_data.csv` |
| `/api/branding-priorities/` | Branding contracts | `branding_priorities.csv` |
| `/api/cleaning-detailing/` | Cleaning schedules | `cleaning_detailing.csv` |
| `/api/fitness-certificates/` | Certificate status | `fitness_certificates.csv` |
| `/api/jobcard-status/` | Work orders | `jobcard_status.csv` |
| `/api/mileage-balancing/` | Mileage tracking | `mileage_balancing.csv` |
| `/api/stabling-geometry/` | Train positioning | `stabling_geometry.csv` |

## Status Indicators

### Urgency Levels
- 🔴 **Critical**: High priority maintenance required
- 🟠 **High**: Elevated attention needed
- 🟡 **Medium**: Moderate priority
- 🟢 **Low**: Normal operation

### Compliance Status
- 🟢 **Compliant**: Meeting all requirements
- 🔴 **Overdue**: Past due for maintenance/cleaning

### Validity Status
- 🟢 **Valid**: Certificate is current
- 🟡 **Expiring**: Certificate expires soon
- 🔴 **Expired**: Certificate has expired

### Work Status
- 🟢 **Completed**: Work finished
- 🔵 **In Progress**: Currently being worked on
- 🟡 **Scheduled**: Planned for future

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- Django 5.2+
- React 19+

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
- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000

## File Structure
```
astar_v2/
├── backend/
│   ├── api/
│   │   ├── views.py          # API endpoints
│   │   └── urls.py           # URL routing
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main application
│   │   ├── App.css           # Main styles
│   │   ├── DataView.css      # Data table styles
│   │   └── Navbar.js         # Navigation component
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

## Usage

1. **Navigate to Data Tables**: Click on "Data Tables" in the navigation
2. **Select Data View**: Use the tabbed interface to switch between different data sources
3. **View Data**: Each table displays relevant information with proper formatting
4. **Status Indicators**: Color-coded pills show status at a glance
5. **Responsive Design**: Tables adapt to different screen sizes

## Customization

### Adding New Data Sources
1. Add CSV file to `data/` folder
2. Create new API endpoint in `backend/api/views.py`
3. Add URL pattern in `backend/api/urls.py`
4. Create new table component in `frontend/src/App.js`
5. Add tab configuration in DataView component

### Styling
- Main styles: `frontend/src/App.css`
- Data table styles: `frontend/src/DataView.css`
- Component styles: Individual component files

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance
- Lazy loading of data
- Optimized table rendering
- Responsive design
- Efficient API calls

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
This project is licensed under the MIT License.
