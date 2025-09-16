import React, { useState, useEffect } from 'react';
import './App.css';

// --- Main App Component ---
function App() {
  const [masterData, setMasterData] = useState([]);
  const [plan, setPlan] = useState(null);
  const [serviceFleet, setServiceFleet] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch master data on component mount
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/master-data/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setMasterData(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Function to generate the optimization plan
  const generatePlan = () => {
    setLoading(true);
    setError(null);
    fetch('http://127.0.0.1:8000/api/generate-plan/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service_fleet: serviceFleet }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setPlan(data.plan);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>A-Star v2</h1>
        <p>Train Induction Optimizer</p>
      </header>
      <main className="App-main">
        <div className="control-panel">
          <h2>Control Panel</h2>
          <div className="fleet-input">
            <label htmlFor="service-fleet">Required Service Fleet:</label>
            <input
              type="number"
              id="service-fleet"
              value={serviceFleet}
              onChange={e => setServiceFleet(parseInt(e.target.value, 10))}
              min="7"
              max="22"
            />
          </div>
          <button onClick={generatePlan} disabled={loading}>
            {loading ? 'Optimizing...' : 'Generate Induction Plan'}
          </button>
        </div>

        {error && <div className="error-message">Error: {error}</div>}
        
        <div className="results-container">
          <div className="master-data-container">
            <h2>Master Train Data</h2>
            {loading && !masterData.length ? (
              <p>Loading data...</p>
            ) : (
              <TrainTable trains={masterData} />
            )}
          </div>
          <div className="plan-container">
            <h2>Generated Induction Plan</h2>
            {plan ? (
              <PlanTable plan={plan} />
            ) : (
              <p>Click the button to generate a plan.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Train Table Component ---
const TrainTable = ({ trains }) => (
  <div className="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>TrainSet ID</th>
          <th>Penalty Risk</th>
          <th>Cleaning Status</th>
          <th>Mileage Urgency</th>
        </tr>
      </thead>
      <tbody>
        {trains.map(train => (
          <tr key={train.TrainSet_ID}>
            <td>{train.TrainSet_ID}</td>
            <td>{train.Penalty_Risk_Level}</td>
            <td>{train.Compliance_Status}</td>
            <td>{train.Urgency_Level}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Plan Table Component ---
const PlanTable = ({ plan }) => (
  <div className="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>TrainSet ID</th>
          <th>Assigned Status</th>
          <th>Justification</th>
        </tr>
      </thead>
      <tbody>
        {plan.map(item => (
          <tr key={item.TrainSet_ID}>
            <td>{item.TrainSet_ID}</td>
            <td><span className={`status-badge status-${item.Assigned_Status.toLowerCase()}`}>{item.Assigned_Status}</span></td>
            <td>{item.Justification}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default App;
