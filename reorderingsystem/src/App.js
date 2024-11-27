import React from 'react';
import InventoryDashboard from './ForecastDashboard';
import InventoryChart from './InteractiveInventoryChart';

function App() {
  return (
    <div className="App">
      <InventoryDashboard />
      <InventoryChart />
    </div>
  );
}

export default App;
