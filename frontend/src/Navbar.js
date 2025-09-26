import React from 'react';
import logo from './assets/logo.png'; // Import the logo
import './Navbar.css';

// The component now correctly receives currentView and setCurrentView as props
const AppNavbar = ({ currentView, setCurrentView }) => {
  return (
    <nav className="navbar">
      <div className="navbar-header">
        {/* The h2 text is replaced with your logo */}
        <img src={logo} alt="KMRL Unified Intelligence Operator Logo" className="navbar-logo" />
      </div>
      <ul className="navbar-links">
        {/* Corrected className to apply 'active' style properly */}
        <li 
          className={currentView === 'master' ? 'active' : ''} 
          onClick={() => setCurrentView('master')}
        >
          <i className="fas fa-train"></i> MASTER DATA
        </li>
        <li 
          className={currentView === 'data' ? 'active' : ''} 
          onClick={() => setCurrentView('data')}
        >
          <i className="fas fa-database"></i> DATA TABLES
        </li>
        <li 
          className={currentView === 'analytics' ? 'active' : ''} 
          onClick={() => setCurrentView('analytics')}
        >
          <i className="fas fa-chart-line"></i> ANALYTICS
        </li>
        <li 
          className={currentView === 'scenarios' ? 'active' : ''} 
          onClick={() => setCurrentView('scenarios')}
        >
          <i className="fas fa-flask"></i> What-If
        </li>
        <li 
          className={currentView === 'plan' ? 'active' : ''} 
          onClick={() => setCurrentView('plan')}
        >
          <i className="fas fa-chart-pie"></i> INDUCTION PLAN
        </li>
      </ul>
    </nav>
  );
};

// Corrected the export to match the component name
export default AppNavbar;