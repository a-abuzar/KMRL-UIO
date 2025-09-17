import React from 'react';
import './Navbar.css';

const Navbar = ({ currentView, setCurrentView }) => {
  return (
    <nav className="navbar">
      <div className="navbar-header">
        <h2>A-Star v2</h2>
      </div>
      <ul className="navbar-links">
        <li 
          className={`app-button ${currentView === 'data' ? 'active' : ''}`} 
          onClick={() => setCurrentView('data')}
        >
          <i className="fas fa-database"></i> Master Data
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
