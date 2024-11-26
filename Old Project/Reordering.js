import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Simulated data and services
const initialInventory = [
  { 
    id: 1, 
    name: 'Raw Material A', 
    currentStock: 150, 
    reorderPoint: 200, 
    leadTime: 14, 
    predictedDemand: 180,
    status: 'warning'
  },
  { 
    id: 2, 
    name: 'Raw Material B', 
    currentStock: 300, 
    reorderPoint: 250, 
    leadTime: 10, 
    predictedDemand: 220,
    status: 'safe'
  },
  { 
    id: 3, 
    name: 'Raw Material C', 
    currentStock: 50, 
    reorderPoint: 100, 
    leadTime: 7, 
    predictedDemand: 120,
    status: 'critical'
  }
];

const supplierPerformance = [
  { 
    name: 'Supplier X', 
    leadTimeAccuracy: 92, 
    recentOnTimeDeliveries: 8, 
    totalDeliveries: 10 
  },
  { 
    name: 'Supplier Y', 
    leadTimeAccuracy: 85, 
    recentOnTimeDeliveries: 6, 
    totalDeliveries: 10 
  }
];

const supplierPerformanceData = {
  'Supplier X': [
    { month: 'Jan', accuracy: 90, onTimeDeliveries: 7 },
    { month: 'Feb', accuracy: 92, onTimeDeliveries: 8 },
    { month: 'Mar', accuracy: 95, onTimeDeliveries: 9 }
  ],
  'Supplier Y': [
    { month: 'Jan', accuracy: 80, onTimeDeliveries: 6 },
    { month: 'Feb', accuracy: 85, onTimeDeliveries: 7 },
    { month: 'Mar', accuracy: 88, onTimeDeliveries: 8 }
  ]
};

const AutomatedReorderingApp = () => {
  const [inventory, setInventory] = useState(initialInventory);
  const [alerts, setAlerts] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    // Simulate alerts generation
    const newAlerts = inventory
      .filter(item => item.status === 'critical')
      .map(item => ({
        type: 'warning',
        message: `Low stock alert for ${item.name}. Current stock: ${item.currentStock}`,
        icon: <AlertCircle className="h-4 w-4" />
      }));
    setAlerts(newAlerts);
  }, [inventory]);

  const handleReorder = (itemId) => {
    const itemToReorder = inventory.find(item => item.id === itemId);
    if (itemToReorder) {
      // Simulate automated purchase order
      console.log(`Generating purchase order for ${itemToReorder.name}`);
      // In a real system, this would trigger supplier API integration
    }
  };

  const handleSupplierSelect = (supplierName) => {
    setSelectedSupplier(selectedSupplier === supplierName ? null : supplierName);
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Automated Reordering System</h1>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div 
              key={index} 
              className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center"
            >
              <div className="mr-4">{alert.icon}</div>
              <div>
                <div className="font-bold">Inventory Alert</div>
                <div>{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Management */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Inventory Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Point</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicted Demand</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`
                      ${item.status === 'critical' ? 'text-red-600' : 
                        item.status === 'warning' ? 'text-yellow-600' : 'text-green-600'}
                    `}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.reorderPoint}</td>
                  <td className="px-4 py-3">{item.predictedDemand}</td>
                  <td className="px-4 py-3">
                    <button 
                      className={`
                        px-3 py-1 rounded text-sm 
                        ${item.status === 'critical' ? 'bg-red-500 text-white hover:bg-red-600' : 
                          item.status === 'warning' ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 
                          'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                        ${item.status === 'safe' ? 'cursor-not-allowed opacity-50' : ''}
                      `}
                      onClick={() => handleReorder(item.id)}
                      disabled={item.status === 'safe'}
                    >
                      {item.status === 'critical' ? 'Urgent Reorder' : 
                       item.status === 'warning' ? 'Reorder Soon' : 'Stock Sufficient'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Performance */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Supplier Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Time Accuracy</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time Deliveries</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supplierPerformance.map((supplier, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td className="px-4 py-3">{supplier.name}</td>
                    <td className="px-4 py-3">
                      {supplier.leadTimeAccuracy >= 90 ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {supplier.leadTimeAccuracy}%
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-600">
                          <TrendingDown className="mr-2 h-4 w-4" />
                          {supplier.leadTimeAccuracy}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        {supplier.recentOnTimeDeliveries}/{supplier.totalDeliveries}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleSupplierSelect(supplier.name)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        {selectedSupplier === supplier.name ? 'Hide Details' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                  {selectedSupplier === supplier.name && (
                    <tr>
                      <td colSpan="4" className="p-4">
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={supplierPerformanceData[supplier.name]}>
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy" />
                              <Line type="monotone" dataKey="onTimeDeliveries" stroke="#82ca9d" name="On-Time Deliveries" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AutomatedReorderingApp;

