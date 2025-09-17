import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './App.css';

// --- Main App Component ---
function App() {
  const [currentView, setCurrentView] = useState('plan'); // Default to plan view
  const [masterData, setMasterData] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isControlPanelVisible, setIsControlPanelVisible] = useState(false);
  const [alerts, setAlerts] = useState([]); // New state for alerts
  
  // New state for all CSV data
  const [csvData, setCsvData] = useState({
    brandingPriorities: [],
    cleaningDetailing: [],
    fitnessCertificates: [],
    jobcardStatus: [],
    mileageBalancing: [],
    stablingGeometry: []
  });
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState(null);

  // --- CONFIGURATION STATE ---
  const [config, setConfig] = useState({
    required_service_fleet: 8,
    min_standby_fleet: 3,
    max_maintenance_trains: 4,
    max_cleaning_trains: 7,
    w_sla: 50,
    w_cleaning: 20,
    w_mileage: 10,
    w_shunting: 5,
  });

  // Function to load all CSV data
  const loadCsvData = async () => {
    setCsvLoading(true);
    setCsvError(null);
    
    const endpoints = [
      { key: 'brandingPriorities', url: 'http://127.0.0.1:8000/api/branding-priorities/' },
      { key: 'cleaningDetailing', url: 'http://127.0.0.1:8000/api/cleaning-detailing/' },
      { key: 'fitnessCertificates', url: 'http://127.0.0.1:8000/api/fitness-certificates/' },
      { key: 'jobcardStatus', url: 'http://127.0.0.1:8000/api/jobcard-status/' },
      { key: 'mileageBalancing', url: 'http://127.0.0.1:8000/api/mileage-balancing/' },
      { key: 'stablingGeometry', url: 'http://127.0.0.1:8000/api/stabling-geometry/' }
    ];

    try {
      const promises = endpoints.map(async ({ key, url }) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        return { key, data };
      });

      const results = await Promise.all(promises);
      const newCsvData = {};
      results.forEach(({ key, data }) => {
        newCsvData[key] = data;
      });
      setCsvData(newCsvData);
    } catch (error) {
      setCsvError(error.message);
    } finally {
      setCsvLoading(false);
    }
  };

  // Fetch master data on component mount
  useEffect(() => {
    setLoading(true);
    fetch('http://127.0.0.1:8000/api/master-data/')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setMasterData(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Load CSV data when switching to data view
  useEffect(() => {
    if (currentView === 'data' && csvData.brandingPriorities.length === 0) {
      loadCsvData();
    }
  }, [currentView]);

  // Function to generate the optimization plan
  const generatePlan = () => {
    setLoading(true);
    setError(null);
    fetch('http://127.0.0.1:8000/api/generate-plan/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setPlan(data.plan);
        setAlerts(data.alerts || []); // Store alerts
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
        setAlerts([]); // Clear alerts on error
      });
  };

  return (
    <div className="app-container">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="content-container">
        <header className="content-header">
          <h1>
            {currentView === 'data' ? 'Railway Data Management System' : 'Induction Plan Optimizer'}
            {currentView === 'data' && <span className="logo-text">🚂 A-Star Railway Analytics</span>}
          </h1>
        </header>
        <main className="content-main">
          {error && <div className="error-message">Error: {error}</div>}
          {loading && !masterData.length && <p>Loading...</p>}
          
          {!loading && !error && currentView === 'data' && (
            <DataView 
              masterData={masterData}
              csvData={csvData}
              csvLoading={csvLoading}
              csvError={csvError}
              loadCsvData={loadCsvData}
            />
          )}

          {!loading && !error && currentView === 'plan' && (
            <PlanView 
              config={config}
              setConfig={setConfig}
              generatePlan={generatePlan}
              plan={plan}
              loading={loading}
              isControlPanelVisible={isControlPanelVisible}
              setIsControlPanelVisible={setIsControlPanelVisible}
              alerts={alerts} // Pass alerts to PlanView
            />
          )}
        </main>
      </div>
    </div>
  );
}

// --- Rebuilt Plan View ---
const PlanView = ({ config, setConfig, generatePlan, plan, loading, isControlPanelVisible, setIsControlPanelVisible, alerts }) => {
  const handleConfigChange = (key, value) => {
    // Ensure value is within a reasonable range and is a number
    const numValue = Math.max(0, parseInt(value, 10) || 0);
    setConfig(prevConfig => ({ ...prevConfig, [key]: numValue }));
  };

  return (
    <div>
      <div className="plan-container">
        <div className="plan-container-header">
          <h2>Generated Induction Plan</h2>
          <div className="plan-header-actions">
            <button 
              className="tune-parameters-btn app-button"
              onClick={() => setIsControlPanelVisible(!isControlPanelVisible)}
            >
              {isControlPanelVisible ? 'Hide' : 'Tune'} Parameters
            </button>
            <button onClick={generatePlan} disabled={loading} className="generate-plan-btn app-button">
              {loading ? 'Optimizing...' : 'Generate Plan'}
            </button>
          </div>
        </div>
        {/* The control panel is always rendered, its visibility is controlled by CSS */}
        <div className="control-panel-enhanced card" data-visible={isControlPanelVisible}>
          <div className="panel-section">
            <h3>Fleet & Resources</h3>
            <NumberInput
              label="Required Service Fleet"
              value={config.required_service_fleet}
              onChange={val => handleConfigChange('required_service_fleet', val)}
            />
            <NumberInput
              label="Min Standby Fleet"
              value={config.min_standby_fleet}
              onChange={val => handleConfigChange('min_standby_fleet', val)}
            />
            <NumberInput
              label="Max Maintenance Trains"
              value={config.max_maintenance_trains}
              onChange={val => handleConfigChange('max_maintenance_trains', val)}
            />
            <NumberInput
              label="Max Cleaning Trains"
              value={config.max_cleaning_trains}
              onChange={val => handleConfigChange('max_cleaning_trains', val)}
            />
          </div>
          <div className="panel-section">
            <h3>Objective Weights</h3>
            <NumberInput
              label="SLA Penalty Weight"
              value={config.w_sla}
              onChange={val => handleConfigChange('w_sla', val)}
            />
            <NumberInput
              label="Cleaning Weight"
              value={config.w_cleaning}
              onChange={val => handleConfigChange('w_cleaning', val)}
            />
            <NumberInput
              label="Mileage Weight"
              value={config.w_mileage}
              onChange={val => handleConfigChange('w_mileage', val)}
            />
            <NumberInput
              label="Shunting Weight"
              value={config.w_shunting}
              onChange={val => handleConfigChange('w_shunting', val)}
            />
          </div>
        </div>

        {alerts.length > 0 && <AlertsDisplay alerts={alerts} />} {/* Alerts Display */}

        {loading && !plan ? (
          <p>Generating plan...</p>
        ) : plan ? (
          <PlanDashboard plan={plan} />
        ) : (
          <p>Adjust the parameters and click the button to generate a new plan.</p>
        )}
      </div>
    </div>
  );
};

// --- Alerts Display Component (New) ---
const AlertsDisplay = ({ alerts }) => (
  <div className="alerts-container card">
    <h3><i className="fas fa-exclamation-triangle"></i> Alerts</h3>
    <ul>
      {alerts.map((alert, index) => (
        <li key={index}>{alert}</li>
      ))}
    </ul>
  </div>
);

// --- Number Input Component (New) ---
const NumberInput = ({ label, value, onChange }) => (
  <div className="number-input-container">
    <label>{label}</label>
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="number-input"
    />
  </div>
);


// --- Train Table Component (Restored and Enhanced) ---
const TrainTable = ({ trains }) => (
  <div className="card">
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>TrainSet ID</th>
            <th>Urgency</th>
            <th>Penalty Risk</th>
            <th>Cleaning</th>
            <th>Maintenance (km)</th>
            <th>Location</th>
            <th>Advertiser</th>
          </tr>
        </thead>
        <tbody>
          {trains.map(train => (
            <tr key={train.TrainSet_ID}>
              <td><strong>{train.TrainSet_ID}</strong></td>
              <td><span className={`urgency-pill urgency-${train.Urgency_Level?.toLowerCase()}`}>{train.Urgency_Level}</span></td>
              <td>{train.Penalty_Risk_Level || 'N/A'}</td>
              <td>{train.Compliance_Status}</td>
              <td>{train.Kilometers_Since_Last_Maintenance} / {train.Maintenance_Threshold}</td>
              <td>{train.Track_ID}, Pos {train.Position}</td>
              <td>{train.Advertiser_Name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Plan Dashboard Component ---
const PlanDashboard = ({ plan }) => {
  const statuses = ['SERVICE', 'STANDBY', 'MAINTENANCE', 'CLEANING'];
  
  const groupedPlan = statuses.reduce((acc, status) => {
    acc[status] = plan.filter(item => item.Assigned_Status === status);
    return acc;
  }, {});

  return (
    <div className="plan-dashboard">
      {statuses.map(status => (
        <StatusCanvas 
          key={status}
          title={status}
          trains={groupedPlan[status]}
        />
      ))}
    </div>
  );
};

// --- Status Canvas Component (New) ---
const StatusCanvas = ({ title, trains }) => (
  <div className={`status-canvas card status-card-${title.toLowerCase()}`}>
    <div className="canvas-header">
      <h3>{title} ({trains.length})</h3>
    </div>
    <div className="canvas-body">
      {trains.length > 0 ? (
        <ul>
          {trains.map(train => (
            <li key={train.TrainSet_ID}>
              <strong>{train.TrainSet_ID}</strong>
              <span>{train.Justification}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-trains-message">No trains assigned.</p>
      )}
    </div>
  </div>
);


export default App;