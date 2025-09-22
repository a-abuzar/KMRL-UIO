import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar';
import './App.css';
import './DataView.css';

// --- Main App Component ---
function App() {
  const [currentView, setCurrentView] = useState('plan'); // Default to plan view
  const [masterData, setMasterData] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isControlPanelVisible, setIsControlPanelVisible] = useState(false);
  const [alerts, setAlerts] = useState([]); // New state for alerts
  const [analytics, setAnalytics] = useState(null); // New state for analytics
  const [historicalData, setHistoricalData] = useState([]); // New state for historical data
  const [selectedScenario, setSelectedScenario] = useState(null); // For what-if scenarios
  const [conflicts, setConflicts] = useState([]); // New state for conflicts
  const [notifications, setNotifications] = useState([]); // New state for notifications
  const [exportLoading, setExportLoading] = useState(false); // New state for export loading
  const [filters, setFilters] = useState({}); // New state for filters
  const [searchTerm, setSearchTerm] = useState(''); // New state for search
  
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
  const loadCsvData = useCallback(async () => {
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
  }, []);

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
  }, [currentView, csvData.brandingPriorities.length, loadCsvData]);

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
        setAnalytics(data.analytics || null); // Store analytics
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
        setAlerts([]); // Clear alerts on error
      });
  };

  // Function to generate analytics
  const generateAnalytics = useCallback(() => {
    if (!masterData.length) return null;
    
    const analytics = {
      fleetHealth: calculateFleetHealth(),
      complianceMetrics: calculateComplianceMetrics(),
      riskAssessment: calculateRiskAssessment(),
      efficiencyMetrics: calculateEfficiencyMetrics(),
      trends: calculateTrends()
    };
    setAnalytics(analytics);
    return analytics;
  }, [masterData, csvData]);

  // Analytics calculation functions
  const calculateFleetHealth = () => {
    const totalTrains = masterData.length;
    const serviceReady = masterData.filter(train => 
      train.Rolling_Stock_Status === 'Valid' && 
      train.Signalling_Status === 'Valid' && 
      train.Telecom_Status === 'Valid'
    ).length;
    
    return {
      totalTrains,
      serviceReady,
      healthPercentage: Math.round((serviceReady / totalTrains) * 100),
      criticalIssues: masterData.filter(train => train.Urgency_Level === 'Critical').length,
      maintenanceDue: masterData.filter(train => train.Urgency_Level === 'High').length
    };
  };

  const calculateComplianceMetrics = () => {
    const cleaningData = csvData.cleaningDetailing || [];
    const brandingData = csvData.brandingPriorities || [];
    
    const cleaningOverdue = cleaningData.filter(item => 
      item.Compliance_Status === 'Overdue'
    ).length;
    
    const totalContracts = brandingData.length;
    const atRiskContracts = brandingData.filter(item => 
      item.Penalty_Risk_Level === 'High' || item.Penalty_Risk_Level === 'Critical'
    ).length;
    
    // Calculate cleaning compliance with proper handling of edge cases
    const totalCleaning = cleaningData.length;
    const cleaningCompliance = totalCleaning > 0 
      ? Math.round(((totalCleaning - cleaningOverdue) / totalCleaning) * 100)
      : 0;
    
    // Calculate contract compliance with proper handling of edge cases
    const contractCompliance = totalContracts > 0 
      ? Math.round(((totalContracts - atRiskContracts) / totalContracts) * 100)
      : 0;
    
    return {
      cleaningCompliance,
      contractCompliance,
      overdueCleaning: cleaningOverdue,
      atRiskContracts
    };
  };

  const calculateRiskAssessment = () => {
    const criticalRisks = masterData.filter(train => 
      train.Urgency_Level === 'Critical' || 
      train.Penalty_Risk_Level === 'Critical'
    ).length;
    
    const highRisks = masterData.filter(train => 
      train.Urgency_Level === 'High' || 
      train.Penalty_Risk_Level === 'High'
    ).length;
    
    return {
      criticalRisks,
      highRisks,
      totalRisks: criticalRisks + highRisks,
      riskScore: Math.min(100, (criticalRisks * 10 + highRisks * 5))
    };
  };

  const calculateEfficiencyMetrics = () => {
    const avgShuntingTime = masterData.reduce((sum, train) => 
      sum + (parseInt(train.Estimated_Shunting_Time_Minutes) || 0), 0) / masterData.length;
    
    const optimalPositioned = masterData.filter(train => 
      parseInt(train.Estimated_Shunting_Time_Minutes) === 0
    ).length;
    
    return {
      avgShuntingTime: Math.round(avgShuntingTime * 10) / 10,
      optimalPositioned,
      positioningEfficiency: Math.round((optimalPositioned / masterData.length) * 100)
    };
  };


  const calculateTrends = () => {
    // This would typically come from historical data
    return {
      fleetUtilization: 85,
      maintenanceEfficiency: 92,
      complianceTrend: 'improving',
      costTrend: 'stable'
    };
  };

  // Conflict detection and resolution functions
  const detectConflicts = useCallback(() => {
    const detectedConflicts = [];
    
    // Check for resource conflicts
    const serviceTrains = plan?.filter(item => item.Assigned_Status === 'SERVICE').length || 0;
    const standbyTrains = plan?.filter(item => item.Assigned_Status === 'STANDBY').length || 0;
    const maintenanceTrains = plan?.filter(item => item.Assigned_Status === 'MAINTENANCE').length || 0;
    const cleaningTrains = plan?.filter(item => item.Assigned_Status === 'CLEANING').length || 0;
    
    // Check if service fleet meets requirements
    if (serviceTrains < config.required_service_fleet) {
      detectedConflicts.push({
        id: 'insufficient_service_fleet',
        type: 'resource_conflict',
        severity: 'critical',
        title: 'Insufficient Service Fleet',
        description: `Only ${serviceTrains} trains assigned to service, but ${config.required_service_fleet} required`,
        suggestion: 'Increase service fleet allocation or reduce requirements',
        affectedTrains: plan?.filter(item => item.Assigned_Status === 'SERVICE').map(item => item.TrainSet_ID) || []
      });
    }
    
    // Check if standby fleet meets minimum requirements
    if (standbyTrains < config.min_standby_fleet) {
      detectedConflicts.push({
        id: 'insufficient_standby_fleet',
        type: 'resource_conflict',
        severity: 'high',
        title: 'Insufficient Standby Fleet',
        description: `Only ${standbyTrains} trains on standby, but minimum ${config.min_standby_fleet} required`,
        suggestion: 'Reassign trains from other categories to standby',
        affectedTrains: plan?.filter(item => item.Assigned_Status === 'STANDBY').map(item => item.TrainSet_ID) || []
      });
    }
    
    // Check for maintenance capacity conflicts
    if (maintenanceTrains > config.max_maintenance_trains) {
      detectedConflicts.push({
        id: 'maintenance_capacity_exceeded',
        type: 'capacity_conflict',
        severity: 'high',
        title: 'Maintenance Capacity Exceeded',
        description: `${maintenanceTrains} trains assigned to maintenance, but maximum ${config.max_maintenance_trains} allowed`,
        suggestion: 'Reduce maintenance assignments or increase capacity',
        affectedTrains: plan?.filter(item => item.Assigned_Status === 'MAINTENANCE').map(item => item.TrainSet_ID) || []
      });
    }
    
    // Check for cleaning capacity conflicts
    if (cleaningTrains > config.max_cleaning_trains) {
      detectedConflicts.push({
        id: 'cleaning_capacity_exceeded',
        type: 'capacity_conflict',
        severity: 'medium',
        title: 'Cleaning Capacity Exceeded',
        description: `${cleaningTrains} trains assigned to cleaning, but maximum ${config.max_cleaning_trains} allowed`,
        suggestion: 'Reduce cleaning assignments or increase capacity',
        affectedTrains: plan?.filter(item => item.Assigned_Status === 'CLEANING').map(item => item.TrainSet_ID) || []
      });
    }
    
    // Check for critical train assignments
    const criticalTrainsInService = masterData.filter(train => 
      train.Urgency_Level === 'Critical' && 
      plan?.find(p => p.TrainSet_ID === train.TrainSet_ID && p.Assigned_Status === 'SERVICE')
    );
    
    if (criticalTrainsInService.length > 0) {
      detectedConflicts.push({
        id: 'critical_trains_in_service',
        type: 'safety_conflict',
        severity: 'critical',
        title: 'Critical Trains in Service',
        description: `${criticalTrainsInService.length} trains with critical issues assigned to service`,
        suggestion: 'Immediately reassign critical trains to maintenance',
        affectedTrains: criticalTrainsInService.map(train => train.TrainSet_ID)
      });
    }
    
    // Check for expired certificate conflicts
    const expiredCertTrains = masterData.filter(train => 
      train.Rolling_Stock_Status === 'Expired' || 
      train.Signalling_Status === 'Expired' || 
      train.Telecom_Status === 'Expired'
    );
    
    const expiredInService = plan?.filter(item => 
      item.Assigned_Status === 'SERVICE' && 
      expiredCertTrains.some(train => train.TrainSet_ID === item.TrainSet_ID)
    ) || [];
    
    if (expiredInService.length > 0) {
      detectedConflicts.push({
        id: 'expired_certificates_in_service',
        type: 'compliance_conflict',
        severity: 'critical',
        title: 'Expired Certificates in Service',
        description: `${expiredInService.length} trains with expired certificates assigned to service`,
        suggestion: 'Immediately reassign to maintenance for certificate renewal',
        affectedTrains: expiredInService.map(item => item.TrainSet_ID)
      });
    }
    
    setConflicts(detectedConflicts);
    return detectedConflicts;
  }, [plan, config, masterData]);

  // Enhanced notification system
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50 notifications
  };

  // Auto-detect conflicts when plan changes
  useEffect(() => {
    if (plan) {
      const detectedConflicts = detectConflicts();
      if (detectedConflicts.length > 0) {
        addNotification({
          type: 'conflict_detected',
          severity: 'warning',
          title: 'Conflicts Detected',
          message: `${detectedConflicts.length} conflicts found in the current plan`
        });
      }
    }
  }, [plan, detectConflicts]);

  // Export and reporting functions
  const exportToCSV = (data, filename) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ];
    return csvRows.join('\n');
  };

  const exportPlanReport = () => {
    setExportLoading(true);
    
    const reportData = {
      timestamp: new Date().toISOString(),
      config: config,
      plan: plan,
      analytics: analytics,
      conflicts: conflicts,
      alerts: alerts,
      summary: {
        totalTrains: masterData.length,
        serviceTrains: plan?.filter(item => item.Assigned_Status === 'SERVICE').length || 0,
        standbyTrains: plan?.filter(item => item.Assigned_Status === 'STANDBY').length || 0,
        maintenanceTrains: plan?.filter(item => item.Assigned_Status === 'MAINTENANCE').length || 0,
        cleaningTrains: plan?.filter(item => item.Assigned_Status === 'CLEANING').length || 0,
        conflictsDetected: conflicts.length,
        alertsGenerated: alerts.length
      }
    };

    // Export as JSON
    const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const jsonLink = document.createElement('a');
    jsonLink.href = URL.createObjectURL(jsonBlob);
    jsonLink.download = `induction_plan_report_${new Date().toISOString().split('T')[0]}.json`;
    jsonLink.click();

    // Export plan as CSV
    if (plan) {
      exportToCSV(plan, `induction_plan_${new Date().toISOString().split('T')[0]}.csv`);
    }

    setExportLoading(false);
    addNotification({
      type: 'export_completed',
      severity: 'info',
      title: 'Export Completed',
      message: 'Plan report and data exported successfully'
    });
  };

  const exportAnalyticsReport = () => {
    if (!analytics) return;
    
    setExportLoading(true);
    
    const analyticsData = [
      {
        Metric: 'Fleet Health',
        Value: `${analytics.fleetHealth.healthPercentage}%`,
        Details: `${analytics.fleetHealth.serviceReady}/${analytics.fleetHealth.totalTrains} trains ready`
      },
      {
        Metric: 'Critical Issues',
        Value: analytics.fleetHealth.criticalIssues,
        Details: 'Trains requiring immediate attention'
      },
      {
        Metric: 'Maintenance Due',
        Value: analytics.fleetHealth.maintenanceDue,
        Details: 'Trains scheduled for maintenance'
      },
      {
        Metric: 'Risk Score',
        Value: `${analytics.riskAssessment.riskScore}/100`,
        Details: `${analytics.riskAssessment.criticalRisks} critical, ${analytics.riskAssessment.highRisks} high risks`
      },
      {
        Metric: 'Positioning Efficiency',
        Value: `${analytics.efficiencyMetrics.positioningEfficiency}%`,
        Details: `Average shunting time: ${analytics.efficiencyMetrics.avgShuntingTime} minutes`
      },
    ];

    exportToCSV(analyticsData, `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    
    setExportLoading(false);
    addNotification({
      type: 'export_completed',
      severity: 'info',
      title: 'Analytics Export Completed',
      message: 'Analytics report exported successfully'
    });
  };

  const generatePDFReport = () => {
    setExportLoading(true);
    
    // Create a comprehensive PDF report
    const reportContent = generateReportContent();
    
    // For now, we'll create a simple text-based report
    // In a real implementation, you would use a library like jsPDF or Puppeteer
    const textReport = `
INDUCTION PLAN REPORT
Generated: ${new Date().toLocaleString()}

CONFIGURATION:
- Required Service Fleet: ${config.required_service_fleet}
- Minimum Standby Fleet: ${config.min_standby_fleet}
- Max Maintenance Trains: ${config.max_maintenance_trains}
- Max Cleaning Trains: ${config.max_cleaning_trains}

PLAN SUMMARY:
${plan ? plan.map(item => `- ${item.TrainSet_ID}: ${item.Assigned_Status} - ${item.Justification}`).join('\n') : 'No plan generated'}

ANALYTICS:
${analytics ? `
- Fleet Health: ${analytics.fleetHealth.healthPercentage}%
- Risk Score: ${analytics.riskAssessment.riskScore}/100
- Critical Issues: ${analytics.fleetHealth.criticalIssues}
- Maintenance Due: ${analytics.fleetHealth.maintenanceDue}
` : 'No analytics available'}

CONFLICTS:
${conflicts.length > 0 ? conflicts.map(conflict => `- ${conflict.title}: ${conflict.description}`).join('\n') : 'No conflicts detected'}

ALERTS:
${alerts.length > 0 ? alerts.map(alert => `- ${alert}`).join('\n') : 'No alerts generated'}
    `;

    const blob = new Blob([textReport], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `induction_plan_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();

    setExportLoading(false);
    addNotification({
      type: 'export_completed',
      severity: 'info',
      title: 'PDF Report Generated',
      message: 'Comprehensive report generated successfully'
    });
  };

  const generateReportContent = () => {
    return {
      title: 'Induction Plan Report',
      timestamp: new Date().toISOString(),
      config,
      plan,
      analytics,
      conflicts,
      alerts,
      masterData: masterData.slice(0, 10) // Include sample of master data
    };
  };

  // Advanced filtering and search functions
  const filterData = (data, filters, searchTerm) => {
    if (!data || data.length === 0) return data;

    let filteredData = [...data];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply specific filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filteredData = filteredData.filter(item => {
          const itemValue = item[key];
          if (typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(value.toLowerCase());
          }
          return itemValue === value;
        });
      }
    });

    return filteredData;
  };

  const getUniqueValues = (data, key) => {
    if (!data || data.length === 0) return [];
    const values = data.map(item => item[key]).filter(Boolean);
    return [...new Set(values)].sort();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const applyFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="app-container">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="content-container">
        <header className="content-header">
          <h1>
            {currentView === 'master' ? 'Master Train Data' : 
             currentView === 'data' ? 'Railway Data Management System' : 
             currentView === 'analytics' ? 'Analytics Dashboard' :
             currentView === 'scenarios' ? 'What-If Scenarios' :
             'Induction Plan Optimizer'}
            {currentView === 'data' && <span className="logo-text">A-Star Railway Analytics</span>}
          </h1>
        </header>
        <main className="content-main">
          {error && <div className="error-message">Error: {error}</div>}
          {loading && !masterData.length && <p>Loading...</p>}
          
          {!loading && !error && currentView === 'master' && (
            <MasterDataView masterData={masterData} />
          )}

          {!loading && !error && currentView === 'data' && (
            <DataView 
              masterData={masterData}
              csvData={csvData}
              csvLoading={csvLoading}
              csvError={csvError}
              loadCsvData={loadCsvData}
              filters={filters}
              searchTerm={searchTerm}
              setFilters={setFilters}
              setSearchTerm={setSearchTerm}
              filterData={filterData}
              getUniqueValues={getUniqueValues}
              clearFilters={clearFilters}
              applyFilter={applyFilter}
            />
          )}

          {!loading && !error && currentView === 'analytics' && (
            <AnalyticsDashboard 
              analytics={analytics}
              generateAnalytics={generateAnalytics}
              masterData={masterData}
              csvData={csvData}
            />
          )}

          {!loading && !error && currentView === 'scenarios' && (
            <WhatIfSimulator 
              config={config}
              setConfig={setConfig}
              masterData={masterData}
              csvData={csvData}
              selectedScenario={selectedScenario}
              setSelectedScenario={setSelectedScenario}
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
              analytics={analytics}
              conflicts={conflicts}
              detectConflicts={detectConflicts}
              notifications={notifications}
              addNotification={addNotification}
              exportPlanReport={exportPlanReport}
              exportAnalyticsReport={exportAnalyticsReport}
              generatePDFReport={generatePDFReport}
              exportLoading={exportLoading}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// --- Data View Component ---
const DataView = ({ masterData, csvData, csvLoading, csvError, loadCsvData, filters, searchTerm, setFilters, setSearchTerm, filterData, getUniqueValues, clearFilters, applyFilter }) => {
  const [activeTab, setActiveTab] = useState('branding');

  const tabs = [
    { id: 'branding', label: 'Branding Priorities', icon: '', data: csvData.brandingPriorities },
    { id: 'cleaning', label: 'Cleaning & Detailing', icon: '', data: csvData.cleaningDetailing },
    { id: 'fitness', label: 'Fitness Certificates', icon: '', data: csvData.fitnessCertificates },
    { id: 'jobcard', label: 'Job Card Status', icon: '', data: csvData.jobcardStatus },
    { id: 'mileage', label: 'Mileage Balancing', icon: '', data: csvData.mileageBalancing },
    { id: 'stabling', label: 'Stabling Geometry', icon: '', data: csvData.stablingGeometry }
  ];

  const currentData = tabs.find(tab => tab.id === activeTab)?.data || [];
  const filteredData = filterData(currentData, filters, searchTerm);

  return (
    <div className="data-view">
      <div className="data-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`data-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="data-filters">
        <div className="search-container">
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Search across all fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="clear-search-btn"
              title="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <div className="filter-controls">
          <FilterDropdown
            label="Status"
            data={currentData}
            filterKey="Compliance_Status"
            value={filters.Compliance_Status || 'all'}
            onChange={(value) => applyFilter('Compliance_Status', value)}
            getUniqueValues={getUniqueValues}
          />
          <FilterDropdown
            label="Risk Level"
            data={currentData}
            filterKey="Penalty_Risk_Level"
            value={filters.Penalty_Risk_Level || 'all'}
            onChange={(value) => applyFilter('Penalty_Risk_Level', value)}
            getUniqueValues={getUniqueValues}
          />
          <FilterDropdown
            label="Urgency"
            data={currentData}
            filterKey="Urgency_Level"
            value={filters.Urgency_Level || 'all'}
            onChange={(value) => applyFilter('Urgency_Level', value)}
            getUniqueValues={getUniqueValues}
          />
          
          <button 
            onClick={clearFilters}
            className="clear-filters-btn app-button"
            disabled={Object.keys(filters).length === 0 && !searchTerm}
          >
            <i className="fas fa-times"></i> Clear Filters
          </button>
        </div>
        
        <div className="filter-results">
          <span className="results-count">
            Showing {filteredData.length} of {currentData.length} records
          </span>
        </div>
      </div>

      <div className="data-content">
        {csvError && (
          <div className="error-message">
            <p>Error loading data: {csvError}</p>
            <button onClick={loadCsvData} className="retry-btn">Retry</button>
          </div>
        )}
        
        {csvLoading && (
          <div className="loading-message">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        )}

        {!csvLoading && !csvError && (
          <>
            {activeTab === 'branding' && <BrandingPrioritiesTable data={filteredData} />}
            {activeTab === 'cleaning' && <CleaningDetailingTable data={filteredData} />}
            {activeTab === 'fitness' && <FitnessCertificatesTable data={filteredData} />}
            {activeTab === 'jobcard' && <JobcardStatusTable data={filteredData} />}
            {activeTab === 'mileage' && <MileageBalancingTable data={filteredData} />}
            {activeTab === 'stabling' && <StablingGeometryTable data={filteredData} />}
          </>
        )}
      </div>
    </div>
  );
};

// --- Master Data View Component ---
const MasterDataView = ({ masterData }) => (
  <div className="data-view">
    <div className="data-content">
      <MasterDataTable data={masterData} />
    </div>
  </div>
);

// --- Individual Table Components ---
const MasterDataTable = ({ data }) => (
  <div className="data-table-container">
    <div className="table-header">
      <h3>Master Train Data</h3>
      <p>Comprehensive train fleet information and status</p>
    </div>
    <div className="table-wrapper">
      <table className="data-table">
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
          {data.map(train => (
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

const BrandingPrioritiesTable = ({ data }) => (
  <div className="data-table-container">
    <div className="table-header">
      <h3>Branding Priorities</h3>
      <p>Advertising contracts and exposure tracking</p>
    </div>
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Contract ID</th>
            <th>TrainSet ID</th>
            <th>Advertiser</th>
            <th>Required Hours</th>
            <th>Accumulated Hours</th>
            <th>SLA Compliance %</th>
            <th>Penalty Risk</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td><strong>{item.Contract_ID}</strong></td>
              <td>{item.TrainSet_ID}</td>
              <td>{item.Advertiser_Name}</td>
              <td>{item.Required_Exposure_Hours}</td>
              <td>{item.Accumulated_Exposure_Hours}</td>
              <td>{item.Projected_SLA_Compliance_Percentage}%</td>
              <td><span className={`risk-pill risk-${item.Penalty_Risk_Level?.toLowerCase()}`}>{item.Penalty_Risk_Level}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CleaningDetailingTable = ({ data }) => (
  <div className="data-table-container">
    <div className="table-header">
      <h3>Cleaning & Detailing</h3>
      <p>Train cleaning schedules and compliance status</p>
    </div>
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>TrainSet ID</th>
            <th>Last Deep Clean</th>
            <th>Days Since Clean</th>
            <th>Compliance Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td><strong>{item.TrainSet_ID}</strong></td>
              <td>{item.Last_Deep_Clean_Date}</td>
              <td>{item.Days_Since_Last_Clean}</td>
              <td><span className={`compliance-pill compliance-${item.Compliance_Status?.toLowerCase()}`}>{item.Compliance_Status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const FitnessCertificatesTable = ({ data }) => (
  <div className="data-table-container">
    <div className="table-header">
      <h3>Fitness Certificates</h3>
      <p>Train certification status and validity tracking</p>
    </div>
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>TrainSet ID</th>
            <th>Certificate Type</th>
            <th>Certificate ID</th>
            <th>Issue Date</th>
            <th>Expiry Date</th>
            <th>Validity Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td><strong>{item.TrainSet_ID}</strong></td>
              <td>{item.Certificate_Type}</td>
              <td>{item.Certificate_ID}</td>
              <td>{item.Issue_Date}</td>
              <td>{item.Expiry_Date}</td>
              <td><span className={`validity-pill validity-${item.Validity_Status?.toLowerCase()}`}>{item.Validity_Status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const JobcardStatusTable = ({ data }) => (
  <div className="data-table-container">
    <div className="table-header">
      <h3>Job Card Status</h3>
      <p>Maintenance work orders and progress tracking</p>
    </div>
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Work Order ID</th>
            <th>TrainSet ID</th>
            <th>Description</th>
            <th>Status</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td><strong>{item.Work_Order_ID}</strong></td>
              <td>{item.TrainSet_ID}</td>
              <td>{item.Maintenance_Description}</td>
              <td><span className={`status-pill status-${item.Work_Status?.toLowerCase().replace(' ', '-')}`}>{item.Work_Status}</span></td>
              <td><span className={`priority-pill priority-${item.Priority_Level?.toLowerCase()}`}>{item.Priority_Level}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MileageBalancingTable = ({ data }) => (
  <div className="data-table-container">
    <div className="table-header">
      <h3>Mileage Balancing</h3>
      <p>Train mileage tracking and maintenance scheduling</p>
    </div>
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>TrainSet ID</th>
            <th>Total Kilometers</th>
            <th>Since Last Maintenance</th>
            <th>Maintenance Threshold</th>
            <th>Urgency Level</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td><strong>{item.TrainSet_ID}</strong></td>
              <td>{item.Total_Kilometers?.toLocaleString()}</td>
              <td>{item.Kilometers_Since_Last_Maintenance?.toLocaleString()}</td>
              <td>{item.Maintenance_Threshold?.toLocaleString()}</td>
              <td><span className={`urgency-pill urgency-${item.Urgency_Level?.toLowerCase()}`}>{item.Urgency_Level}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const StablingGeometryTable = ({ data }) => (
  <div className="data-table-container">
    <div className="table-header">
      <h3>Stabling Geometry</h3>
      <p>Train positioning and shunting requirements</p>
    </div>
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>TrainSet ID</th>
            <th>Track ID</th>
            <th>Position</th>
            <th>Shunting Required</th>
            <th>Est. Shunting Time (min)</th>
            <th>Accessibility Score</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td><strong>{item.TrainSet_ID}</strong></td>
              <td>{item.Track_ID}</td>
              <td>{item.Position}</td>
              <td><span className={`shunting-pill shunting-${item.Shunting_Required?.toLowerCase()}`}>{item.Shunting_Required}</span></td>
              <td>{item.Estimated_Shunting_Time_Minutes}</td>
              <td><span className="accessibility-score">{item.Accessibility_Score}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Analytics Dashboard Component ---
const AnalyticsDashboard = ({ analytics, generateAnalytics, masterData, csvData }) => {
  useEffect(() => {
    if (!analytics && masterData.length > 0) {
      generateAnalytics();
    }
  }, [analytics, generateAnalytics, masterData.length]);

  if (!analytics || !masterData.length) {
    return <div className="loading-message">Generating analytics...</div>;
  }

  // Add null checks for analytics properties
  const safeAnalytics = {
    fleetHealth: analytics.fleetHealth || { healthPercentage: 0, serviceReady: 0, totalTrains: 0, criticalIssues: 0, maintenanceDue: 0 },
    complianceMetrics: analytics.complianceMetrics || { cleaningCompliance: 0, contractCompliance: 0, overdueCleaning: 0, atRiskContracts: 0 },
    riskAssessment: analytics.riskAssessment || { criticalRisks: 0, highRisks: 0, totalRisks: 0, riskScore: 0 },
    efficiencyMetrics: analytics.efficiencyMetrics || { avgShuntingTime: 0, optimalPositioned: 0, positioningEfficiency: 0 },
    trends: analytics.trends || { fleetUtilization: 0, maintenanceEfficiency: 0, complianceTrend: 'stable', costTrend: 'stable' }
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>Fleet Operations Analytics</h2>
        <button onClick={generateAnalytics} className="refresh-analytics-btn app-button">
          <i className="fas fa-sync-alt"></i> Refresh Analytics
        </button>
      </div>
      
      <div className="metrics-grid">
        <MetricCard
          title="Fleet Health"
          value={`${safeAnalytics.fleetHealth.healthPercentage}%`}
          subtitle={`${safeAnalytics.fleetHealth.serviceReady}/${safeAnalytics.fleetHealth.totalTrains} trains ready`}
          color="success"
          icon="fas fa-heartbeat"
        />
        <MetricCard
          title="Compliance Rate"
          value={`${safeAnalytics.complianceMetrics.cleaningCompliance}%`}
          subtitle={`Cleaning: ${safeAnalytics.complianceMetrics.cleaningCompliance}% | Contracts: ${safeAnalytics.complianceMetrics.contractCompliance}%`}
          color="info"
          icon="fas fa-check-circle"
        />
        <MetricCard
          title="Risk Score"
          value={`${safeAnalytics.riskAssessment.riskScore}/100`}
          subtitle={`${safeAnalytics.riskAssessment.criticalRisks} critical, ${safeAnalytics.riskAssessment.highRisks} high risks`}
          color={safeAnalytics.riskAssessment.riskScore > 50 ? "danger" : "warning"}
          icon="fas fa-exclamation-triangle"
        />
        <MetricCard
          title="Efficiency"
          value={`${safeAnalytics.efficiencyMetrics.positioningEfficiency}%`}
          subtitle={`Avg shunting: ${safeAnalytics.efficiencyMetrics.avgShuntingTime} min`}
          color="primary"
          icon="fas fa-tachometer-alt"
        />
      </div>

      <div className="analytics-charts">
        <div className="chart-container">
          <h3>Fleet Status Distribution</h3>
          <FleetStatusChart masterData={masterData} />
        </div>
        <div className="chart-container">
          <h3>Risk Assessment</h3>
          <RiskAssessmentChart analytics={safeAnalytics} />
        </div>
        <div className="chart-container">
          <h3>Compliance Trends</h3>
          <ComplianceTrendsChart analytics={safeAnalytics} />
        </div>
      </div>
    </div>
  );
};

// --- What-If Simulator Component ---
const WhatIfSimulator = ({ config, setConfig, masterData, csvData, selectedScenario, setSelectedScenario }) => {
  const [scenarios, setScenarios] = useState([]);
  const [simulationResults, setSimulationResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const predefinedScenarios = [
    {
      id: 'peak_demand',
      name: 'Peak Demand Scenario',
      description: 'Simulate increased service requirements during peak hours',
      config: { ...config, required_service_fleet: 12, min_standby_fleet: 2 }
    },
    {
      id: 'maintenance_heavy',
      name: 'Heavy Maintenance Period',
      description: 'Simulate when multiple trains require maintenance',
      config: { ...config, max_maintenance_trains: 8, max_cleaning_trains: 5 }
    },
    {
      id: 'emergency_mode',
      name: 'Emergency Operations',
      description: 'Minimal service with maximum standby for emergencies',
      config: { ...config, required_service_fleet: 6, min_standby_fleet: 8 }
    },
    {
      id: 'cost_optimized',
      name: 'Cost Optimization',
      description: 'Prioritize cost reduction over service levels',
      config: { ...config, w_sla: 30, w_cleaning: 40, w_mileage: 20, w_shunting: 10 }
    }
  ];

  const runSimulation = async (scenarioConfig) => {
    setIsSimulating(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/generate-plan/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenarioConfig),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setSimulationResults({ scenario: scenarioConfig, results: data });
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="what-if-simulator">
      <div className="simulator-header">
        <h2>What-If Scenario Simulator</h2>
        <p>Test different operational scenarios and constraints to optimize fleet planning</p>
      </div>

      <div className="simulator-content">
        <div className="scenarios-panel">
          <h3>Predefined Scenarios</h3>
          <div className="scenarios-grid">
            {predefinedScenarios.map(scenario => (
              <div key={scenario.id} className="scenario-card">
                <h4>{scenario.name}</h4>
                <p>{scenario.description}</p>
                <button 
                  onClick={() => runSimulation(scenario.config)}
                  disabled={isSimulating}
                  className="simulate-btn app-button"
                >
                  {isSimulating ? 'Simulating...' : 'Run Simulation'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="custom-scenario">
          <h3>Custom Scenario</h3>
          <CustomScenarioBuilder 
            config={config} 
            setConfig={setConfig}
            onRunSimulation={runSimulation}
            isSimulating={isSimulating}
          />
        </div>

        {simulationResults && (
          <div className="simulation-results">
            <h3>Simulation Results</h3>
            <SimulationResultsView results={simulationResults} />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Rebuilt Plan View ---
const PlanView = ({ config, setConfig, generatePlan, plan, loading, isControlPanelVisible, setIsControlPanelVisible, alerts, analytics, conflicts, detectConflicts, notifications, addNotification, exportPlanReport, exportAnalyticsReport, generatePDFReport, exportLoading }) => {
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
            <div className="action-group">
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
            
            {plan && (
              <div className="export-group">
                <button 
                  onClick={exportPlanReport} 
                  disabled={exportLoading}
                  className="export-btn app-button"
                  title="Export Plan Report (JSON + CSV)"
                >
                  <i className="fas fa-download"></i> Export Plan
                </button>
                <button 
                  onClick={exportAnalyticsReport} 
                  disabled={exportLoading || !analytics}
                  className="export-btn app-button"
                  title="Export Analytics Report (CSV)"
                >
                  <i className="fas fa-chart-line"></i> Export Analytics
                </button>
                <button 
                  onClick={generatePDFReport} 
                  disabled={exportLoading}
                  className="export-btn app-button"
                  title="Generate PDF Report"
                >
                  <i className="fas fa-file-pdf"></i> PDF Report
                </button>
              </div>
            )}
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
        
        {conflicts.length > 0 && <ConflictResolution conflicts={conflicts} detectConflicts={detectConflicts} />} {/* Conflict Resolution */}
        
        {notifications.length > 0 && <NotificationCenter notifications={notifications} />} {/* Notification Center */}

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

// --- Supporting Components for Analytics Dashboard ---
const MetricCard = ({ title, value, subtitle, color, icon }) => (
  <div className={`metric-card card metric-${color}`}>
    <div className="metric-header">
      <i className={icon}></i>
      <h4>{title}</h4>
    </div>
    <div className="metric-value">{value}</div>
    <div className="metric-subtitle">{subtitle}</div>
  </div>
);

const FleetStatusChart = ({ masterData }) => {
  const statusCounts = masterData.reduce((acc, train) => {
    const status = train.Urgency_Level || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="chart">
      <div className="chart-bars">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="chart-bar">
            <div className="bar-label">{status}</div>
            <div className="bar-container">
              <div 
                className={`bar bar-${status.toLowerCase()}`}
                style={{ width: `${(count / masterData.length) * 100}%` }}
              ></div>
            </div>
            <div className="bar-value">{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RiskAssessmentChart = ({ analytics }) => (
  <div className="chart">
    <div className="risk-metrics">
      <div className="risk-item critical">
        <span className="risk-label">Critical Risks</span>
        <span className="risk-count">{analytics.riskAssessment.criticalRisks}</span>
      </div>
      <div className="risk-item high">
        <span className="risk-label">High Risks</span>
        <span className="risk-count">{analytics.riskAssessment.highRisks}</span>
      </div>
      <div className="risk-item total">
        <span className="risk-label">Total Risks</span>
        <span className="risk-count">{analytics.riskAssessment.totalRisks}</span>
      </div>
    </div>
  </div>
);


const ComplianceTrendsChart = ({ analytics }) => (
  <div className="chart">
    <div className="compliance-metrics">
      <div className="compliance-item">
        <span className="compliance-label">Cleaning Compliance</span>
        <div className="compliance-bar">
          <div 
            className="compliance-fill"
            style={{ width: `${analytics.complianceMetrics.cleaningCompliance}%` }}
          ></div>
        </div>
        <span className="compliance-value">{analytics.complianceMetrics.cleaningCompliance}%</span>
      </div>
      <div className="compliance-item">
        <span className="compliance-label">Contract Compliance</span>
        <div className="compliance-bar">
          <div 
            className="compliance-fill"
            style={{ width: `${analytics.complianceMetrics.contractCompliance}%` }}
          ></div>
        </div>
        <span className="compliance-value">{analytics.complianceMetrics.contractCompliance}%</span>
      </div>
    </div>
  </div>
);

// --- Supporting Components for What-If Simulator ---
const CustomScenarioBuilder = ({ config, setConfig, onRunSimulation, isSimulating }) => {
  const [customConfig, setCustomConfig] = useState(config);

  const handleConfigChange = (key, value) => {
    const numValue = Math.max(0, parseInt(value, 10) || 0);
    setCustomConfig(prev => ({ ...prev, [key]: numValue }));
  };

  const runCustomSimulation = () => {
    onRunSimulation(customConfig);
  };

  return (
    <div className="custom-scenario-builder">
      <div className="config-grid">
        <div className="config-section">
          <h4>Fleet Configuration</h4>
          <NumberInput
            label="Required Service Fleet"
            value={customConfig.required_service_fleet}
            onChange={val => handleConfigChange('required_service_fleet', val)}
          />
          <NumberInput
            label="Min Standby Fleet"
            value={customConfig.min_standby_fleet}
            onChange={val => handleConfigChange('min_standby_fleet', val)}
          />
          <NumberInput
            label="Max Maintenance Trains"
            value={customConfig.max_maintenance_trains}
            onChange={val => handleConfigChange('max_maintenance_trains', val)}
          />
          <NumberInput
            label="Max Cleaning Trains"
            value={customConfig.max_cleaning_trains}
            onChange={val => handleConfigChange('max_cleaning_trains', val)}
          />
        </div>
        <div className="config-section">
          <h4>Objective Weights</h4>
          <NumberInput
            label="SLA Penalty Weight"
            value={customConfig.w_sla}
            onChange={val => handleConfigChange('w_sla', val)}
          />
          <NumberInput
            label="Cleaning Weight"
            value={customConfig.w_cleaning}
            onChange={val => handleConfigChange('w_cleaning', val)}
          />
          <NumberInput
            label="Mileage Weight"
            value={customConfig.w_mileage}
            onChange={val => handleConfigChange('w_mileage', val)}
          />
          <NumberInput
            label="Shunting Weight"
            value={customConfig.w_shunting}
            onChange={val => handleConfigChange('w_shunting', val)}
          />
        </div>
      </div>
      <button 
        onClick={runCustomSimulation}
        disabled={isSimulating}
        className="run-custom-simulation-btn app-button"
      >
        {isSimulating ? 'Simulating...' : 'Run Custom Simulation'}
      </button>
    </div>
  );
};

const SimulationResultsView = ({ results }) => {
  const { scenario, results: simulationData } = results;
  
  return (
    <div className="simulation-results-view">
      <div className="results-summary">
        <h4>Simulation Summary</h4>
        <div className="summary-metrics">
          <div className="summary-item">
            <span>Service Fleet:</span>
            <span>{scenario.required_service_fleet}</span>
          </div>
          <div className="summary-item">
            <span>Standby Fleet:</span>
            <span>{scenario.min_standby_fleet}</span>
          </div>
          <div className="summary-item">
            <span>Status:</span>
            <span className="status-success">Success</span>
          </div>
        </div>
      </div>
      
      <div className="results-plan">
        <h4>Generated Plan</h4>
        <PlanDashboard plan={simulationData.plan} />
      </div>
      
      {simulationData.alerts && simulationData.alerts.length > 0 && (
        <div className="results-alerts">
          <h4>Alerts</h4>
          <AlertsDisplay alerts={simulationData.alerts} />
        </div>
      )}
    </div>
  );
};

// --- Conflict Resolution Component ---
const ConflictResolution = ({ conflicts, detectConflicts }) => {
  const [expandedConflicts, setExpandedConflicts] = useState(new Set());

  const toggleConflict = (conflictId) => {
    const newExpanded = new Set(expandedConflicts);
    if (newExpanded.has(conflictId)) {
      newExpanded.delete(conflictId);
    } else {
      newExpanded.add(conflictId);
    }
    setExpandedConflicts(newExpanded);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return 'fas fa-exclamation-circle';
      case 'high': return 'fas fa-exclamation-triangle';
      case 'medium': return 'fas fa-info-circle';
      default: return 'fas fa-info';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'conflict-critical';
      case 'high': return 'conflict-high';
      case 'medium': return 'conflict-medium';
      default: return 'conflict-low';
    }
  };

  return (
    <div className="conflict-resolution card">
      <div className="conflict-header">
        <h3><i className="fas fa-exclamation-triangle"></i> Conflict Resolution</h3>
        <span className="conflict-count">{conflicts.length} conflicts detected</span>
      </div>
      
      <div className="conflicts-list">
        {conflicts.map(conflict => (
          <div key={conflict.id} className={`conflict-item ${getSeverityColor(conflict.severity)}`}>
            <div className="conflict-summary" onClick={() => toggleConflict(conflict.id)}>
              <div className="conflict-info">
                <i className={getSeverityIcon(conflict.severity)}></i>
                <div className="conflict-details">
                  <h4>{conflict.title}</h4>
                  <p>{conflict.description}</p>
                </div>
              </div>
              <div className="conflict-actions">
                <span className="conflict-type">{conflict.type.replace('_', ' ')}</span>
                <i className={`fas fa-chevron-${expandedConflicts.has(conflict.id) ? 'up' : 'down'}`}></i>
              </div>
            </div>
            
            {expandedConflicts.has(conflict.id) && (
              <div className="conflict-details-expanded">
                <div className="conflict-suggestion">
                  <h5><i className="fas fa-lightbulb"></i> Suggested Resolution</h5>
                  <p>{conflict.suggestion}</p>
                </div>
                
                {conflict.affectedTrains.length > 0 && (
                  <div className="affected-trains">
                    <h5><i className="fas fa-train"></i> Affected Trains</h5>
                    <div className="train-tags">
                      {conflict.affectedTrains.map(trainId => (
                        <span key={trainId} className="train-tag">{trainId}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="conflict-actions-buttons">
                  <button className="resolve-btn app-button">
                    <i className="fas fa-check"></i> Mark as Resolved
                  </button>
                  <button className="ignore-btn app-button">
                    <i className="fas fa-times"></i> Ignore
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Notification Center Component ---
const NotificationCenter = ({ notifications }) => {
  const [expandedNotifications, setExpandedNotifications] = useState(new Set());

  const toggleNotification = (notificationId) => {
    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId);
    } else {
      newExpanded.add(notificationId);
    }
    setExpandedNotifications(newExpanded);
  };

  const getNotificationIcon = (type, severity) => {
    if (type === 'conflict_detected') return 'fas fa-exclamation-triangle';
    if (severity === 'critical') return 'fas fa-exclamation-circle';
    if (severity === 'warning') return 'fas fa-exclamation-triangle';
    if (severity === 'info') return 'fas fa-info-circle';
    return 'fas fa-bell';
  };

  const getNotificationColor = (severity) => {
    switch (severity) {
      case 'critical': return 'notification-critical';
      case 'warning': return 'notification-warning';
      case 'info': return 'notification-info';
      default: return 'notification-default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="notification-center card">
      <div className="notification-header">
        <h3><i className="fas fa-bell"></i> Notifications</h3>
        <span className="notification-count">{notifications.length} notifications</span>
      </div>
      
      <div className="notifications-list">
        {notifications.slice(0, 10).map(notification => (
          <div key={notification.id} className={`notification-item ${getNotificationColor(notification.severity)}`}>
            <div className="notification-summary" onClick={() => toggleNotification(notification.id)}>
              <div className="notification-info">
                <i className={getNotificationIcon(notification.type, notification.severity)}></i>
                <div className="notification-details">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="notification-time">{formatTimestamp(notification.timestamp)}</span>
                </div>
              </div>
              <i className={`fas fa-chevron-${expandedNotifications.has(notification.id) ? 'up' : 'down'}`}></i>
            </div>
            
            {expandedNotifications.has(notification.id) && (
              <div className="notification-details-expanded">
                <div className="notification-actions">
                  <button className="dismiss-btn app-button">
                    <i className="fas fa-times"></i> Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Filter Dropdown Component ---
const FilterDropdown = ({ label, data, filterKey, value, onChange, getUniqueValues }) => {
  const uniqueValues = getUniqueValues(data, filterKey);
  
  return (
    <div className="filter-dropdown">
      <label className="filter-label">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="filter-select"
      >
        <option value="all">All {label}s</option>
        {uniqueValues.map(val => (
          <option key={val} value={val}>{val}</option>
        ))}
      </select>
    </div>
  );
};

export default App;