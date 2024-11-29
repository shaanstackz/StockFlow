import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.tsx";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert.tsx";
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Truck, 
  Bell, 
  RefreshCcw, 
  AlertCircle,
  XCircle,
  Plus
} from 'lucide-react';
import { Button } from "./components/ui/button.tsx";
import { Input } from "./components/ui/input.tsx";
import { Badge } from "./components/ui/badge.tsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './InventoryDashboard.css';
const InventoryDashboard = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [reorderRules, setReorderRules] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([
    { id: 1, name: 'Widget A', currentStock: 50, minStock: 10, reorderPoint: 20, supplier: 'Supplier X' },
    { id: 2, name: 'Widget B', currentStock: 30, minStock: 5, reorderPoint: 10, supplier: 'Supplier Y' }
  ]);
  const [alerts, setAlerts] = useState([]);
  
  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/inventory/check-alerts');
      const data = await response.json();
      
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };
  const forceAddAlert = () => {
    const newAlert = {
      id: Date.now(), // Use timestamp as unique id
      type: 'critical',
      title: '🚨 Butter Shortage Alert',
      description: `Projected shortage of 25.5 kg by ${new Date(Date.now() + 12096e5).toLocaleDateString()}`, // 14 days from now
      timestamp: new Date()
    };
    setAlerts([newAlert, ...alerts]);
  };
  const getStockStatus = (current, min) => {
    if (current <= min) return 'critical';
    if (current <= min * 1.5) return 'warning';
    return 'good';
  };

  const getStockBadge = (status) => {
    const variants = {
      critical: "bg-red-100 text-red-800 border-red-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      good: "bg-green-100 text-green-800 border-green-200"
    };
    
    const labels = {
      critical: "Low Stock",
      warning: "Warning",
      good: "In Stock"
    };

    return <Badge className={`${variants[status]} px-2 py-1`}>{labels[status]}</Badge>;
  };
  const [newProduct, setNewProduct] = useState({
    name: '',
    currentStock: '',
    minStock: '',
    reorderPoint: '',
    supplier: ''
  });
  const fetchAllData = async () => {
    try {
      const [summary, chart, forecast, rules, orderData] = await Promise.all([
        fetch('http://localhost:8000/api/inventory/summary').then(res => res.json()),
        fetch('http://localhost:8000/api/inventory/chart-data').then(res => res.json()),
        fetch('http://localhost:8000/api/inventory/forecast').then(res => res.json()),
        fetch('http://localhost:8000/api/inventory/reorder-rules').then(res => res.json()),
        fetch('http://localhost:8000/api/inventory/orders').then(res => res.json())
      ]);

      setSummaryData(summary);
      setChartData(chart);
      setForecastData(forecast);
      setReorderRules(rules);
      setOrders(orderData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later.');
    }
  };
  useEffect(() => {
    

    fetchAllData();
  }, []);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.name.endsWith('.csv')) {
      setFile(uploadedFile);
      console.log('CSV file uploaded:', uploadedFile);
    } else {
      alert('Please upload a valid CSV file.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      console.log('CSV file dropped:', droppedFile);
    } else {
      alert('Please drop a valid CSV file.');
    }
  };

  const handleReorder = async (productId) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/inventory/check-reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId })
      });
      const data = await response.json();
      // Refresh orders after reordering
      const updatedOrders = await fetch('http://localhost:8000/api/inventory/orders').then(res => res.json());
      setOrders(updatedOrders);
    } catch (err) {
      setError('Failed to create reorder');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/add_product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProduct,
          currentStock: Number(newProduct.currentStock),
          minStock: Number(newProduct.minStock),
          reorderPoint: Number(newProduct.reorderPoint)
        })
      });
      
      const data = await response.json();
      // Add the new product to the products array with id
      const newProductWithId = {
        id: products.length + 1, // Generate a local id if server doesn't provide one
        name: newProduct.name,
        currentStock: Number(newProduct.currentStock),
        minStock: Number(newProduct.minStock),
        reorderPoint: Number(newProduct.reorderPoint),
        supplier: newProduct.supplier
      };
      
      setProducts([...products, newProductWithId]);
      
      // Reset form
      setNewProduct({
        name: '',
        currentStock: '',
        minStock: '',
        reorderPoint: '',
        supplier: ''
      });
    } catch (err) {
      setError('Failed to add product');
      console.error('Error adding product:', err);
    }
  };

  const metrics = summaryData ? [
    {
      title: "Current Stock Level",
      value: summaryData.currentStock?.toLocaleString() || '0',
      trend: `${summaryData.stockChange?.toFixed(1) || '0'}%`,
      Icon: Package
    },
    {
      title: "Forecast Accuracy",
      value: `${summaryData.forecastAccuracy?.toFixed(1) || '0'}%`,
      trend: "+1.2%",
      Icon: TrendingUp
    },
    {
      title: "Active Orders",
      value: summaryData.activeOrders || 0,
      trend: "-3",
      Icon: Truck
    },
    {
      title: "Alert Count",
      value: summaryData.alertCount || 0,
      trend: `${alerts.length > 3 ? '+' : ''}${alerts.length - 3}`,
      Icon: Bell
    }
  ] : [];

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Test Button */}
      <Button 
        onClick={forceAddAlert}
        className="mb-4"
        variant="outline"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Test Alert
      </Button>
      {/* Alerts Section */}
      <div className="mb-6 space-y-4">
        {alerts.map((alert) => (
          <Alert 
            key={alert.id} 
            variant={alert.type === 'critical' ? 'destructive' : alert.type === 'warning' ? 'warning' : 'default'}
          >
            <div className="flex justify-between items-start">
              <div>
                <AlertTitle className="flex items-center gap-2">
                  {alert.title}
                </AlertTitle>
                <AlertDescription className="mt-1">
                  {alert.description}
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => dismissAlert(alert.id)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        ))}
      </div>
      <Card>
          <CardHeader>
            <CardTitle>Actual vs Predicted Order Quantities for 2024</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: '500px' }}>
              <ResponsiveContainer>
                <LineChart
                  data={forecastData?.forecastData || []}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 50,
                    bottom: 20
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric'
                      });
                    }}
                    interval={14}  // Show a tick every two weeks
                    tick={{
                      fontSize: 11,
                      angle: -45,
                      textAnchor: 'end',
                      dy: 10
                    }}
                    height={60}
                    padding={{ left: 0, right: 0 }}
                  />
                  <YAxis
                    domain={[-6000, 6000]}
                    ticks={[-15000, 0, 15000, 30000, 45000]}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                  />
                  <Line
                    type="scatter"
                    dataKey="actualSales"
                    name="Actual"
                    stroke="#2563eb"
                    dot={{ r: 2 }}
                    connectNulls={false}
                  />
                  <Line
                    type="scatter"
                    dataKey="predictedSales"
                    name="Predicted"
                    stroke="#dc2626"
                    dot={{ r: 2 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Metrics Cards */}
        <Card className="metric-card">
        <div className="metrics-grid">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className={`text-sm ${metric.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.trend}
                    </p>
                  </div>
                  <metric.Icon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Upload Section */}
      <div className="upload-container">
        <div
          className="upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <p>Drag and drop a CSV file here or <span className="browse-link" onClick={() => document.getElementById('fileInput').click()}>browse</span></p>
          <input type="file" id="fileInput" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>
      </div>
        </Card>
        

        {/* Charts Section */}
        <div className="charts-grid">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric'
                    })}
                    interval={7}  // Show tick every 7 data points
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="stock" 
                    name="Available" 
                    stroke="#2563eb" 
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="required" 
                    name="Required" 
                    stroke="#16a34a" 
                    dot={false}
                  />
                </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* Inventory Management Section */}
        <div className="w-full overflow-auto scrollbar-thin">
          <table className="inventory-table">
            <Card className="col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Inventory Management & Reordering</CardTitle>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={fetchAllData}  // Remove the arrow function wrapper
                  disabled={loading}
                >
                  <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
                  Refresh Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-4 text-left font-medium text-gray-600">Product</th>
                      <th className="p-4 text-left font-medium text-gray-600">Stock Status</th>
                      <th className="p-4 text-left font-medium text-gray-600">Current Stock</th>
                      <th className="p-4 text-left font-medium text-gray-600">Stock Trend</th>
                      <th className="p-4 text-left font-medium text-gray-600">Supplier</th>
                      <th className="p-4 text-left font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product.currentStock, product.minStock);
                      const isNearReorder = product.currentStock <= product.reorderPoint;
                      
                      return (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-sm text-gray-500">ID: {product.id}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            {getStockBadge(stockStatus)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-medium">{product.currentStock}</span>
                              <span className="text-sm text-gray-500">Min: {product.minStock}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {product.currentStock > product.minStock * 1.5 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">
                                {product.currentStock > product.minStock * 1.5 ? "Stable" : "Declining"}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span>{product.supplier}</span>
                              {isNearReorder && (
                                <span className="text-sm text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="h-4 w-4" />
                                  Reorder Soon
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button 
                              variant={isNearReorder ? "destructive" : "secondary"}
                              onClick={() => handleReorder(product.id)}
                              disabled={loading}
                              className="w-full"
                            >
                              {loading ? (
                                <RefreshCcw className="h-4 w-4 animate-spin" />
                              ) : (
                                "Reorder"
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          </table>
        </div>
        

        {/* Add New Product Section */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
                <Input
                  placeholder="Current Stock"
                  type="number"
                  value={newProduct.currentStock}
                  onChange={(e) => setNewProduct({...newProduct, currentStock: e.target.value})}
                />
                <Input
                  placeholder="Minimum Stock"
                  type="number"
                  value={newProduct.minStock}
                  onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
                />
                <Input
                  placeholder="Reorder Point"
                  type="number"
                  value={newProduct.reorderPoint}
                  onChange={(e) => setNewProduct({...newProduct, reorderPoint: e.target.value})}
                />
                <Input
                  placeholder="Supplier"
                  value={newProduct.supplier}
                  onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
                />
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600" disabled={loading}>
                  Add Product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryDashboard;