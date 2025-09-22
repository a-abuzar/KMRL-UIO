import React from 'react';
import './Navbar.css';

const Navbar = ({ currentView, setCurrentView }) => {
  return (
    <nav className="navbar">
      <div className="navbar-header">
        <h2>A-Star Railway Analytics v2</h2>
      </div>
      <ul className="navbar-links">
        <li 
          className={`app-button ${currentView === 'master' ? 'active' : ''}`} 
          onClick={() => setCurrentView('master')}
        >
          <i className="fas fa-train"></i> Master Data
        </li>
        <li 
          className={`app-button ${currentView === 'data' ? 'active' : ''}`} 
          onClick={() => setCurrentView('data')}
        >
          <i className="fas fa-database"></i> Data Tables
        </li>
        <li 
          className={`app-button ${currentView === 'analytics' ? 'active' : ''}`} 
          onClick={() => setCurrentView('analytics')}
        >
          <i className="fas fa-chart-line"></i> Analytics
        </li>
        <li 
          className={`app-button ${currentView === 'scenarios' ? 'active' : ''}`} 
          onClick={() => setCurrentView('scenarios')}
        >
          <i className="fas fa-flask"></i> What-If
        </li>
        <li 
          className={`app-button ${currentView === 'plan' ? 'active' : ''}`} 
          onClick={() => setCurrentView('plan')}
        >
          <i className="fas fa-chart-pie"></i> Induction Plan
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
