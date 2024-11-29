import React from 'react';
import InventoryDashboard from './ForecastDashboard.js';
import InventoryChart from './InteractiveInventoryChart.js';


function App() {
  return (
    <div className="App">
      <InventoryDashboard />
      <InventoryChart />
    </div>
  );
}

export default App;
