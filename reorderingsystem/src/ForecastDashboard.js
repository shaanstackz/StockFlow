import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.tsx";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert.tsx";
import { Package, TrendingUp, Truck, Bell } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summary, chart, forecast] = await Promise.all([
          fetch('http://localhost:8000/api/inventory/summary').then(res => res.json()),
          fetch('http://localhost:8000/api/inventory/chart-data').then(res => res.json()),
          fetch('http://localhost:8000/api/inventory/forecast').then(res => res.json())
        ]);

        setSummaryData(summary);
        setChartData(chart);
        setForecastData(forecast);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
      }
    };

    fetchData();
  }, []);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.name.endsWith('.csv')) {
      setFile(uploadedFile);
      console.log('CSV file uploaded:', uploadedFile);
      // You can add additional logic here to process the CSV
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
      // Process the CSV file here
    } else {
      alert('Please drop a valid CSV file.');
    }
  };

  const metrics = summaryData ? [
    {
      title: "Current Stock Level",
      value: summaryData.currentStock.toLocaleString(),
      trend: `${summaryData.stockChange.toFixed(1)}%`,
      Icon: Package
    },
    {
      title: "Forecast Accuracy",
      value: `${summaryData.forecastAccuracy.toFixed(1)}%`,
      trend: "+1.2%",
      Icon: TrendingUp
    },
    {
      title: "Active Orders",
      value: summaryData.activeOrders,
      trend: "-3",
      Icon: Truck
    },
    {
      title: "Alert Count",
      value: summaryData.alertCount,
      trend: "+2",
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

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Metrics Cards */}
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
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="stock" name="Available" stroke="#2563eb" />
                    <Line type="monotone" dataKey="planned" name="Required" stroke="#16a34a" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sales Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="chart-container">
                <ResponsiveContainer>
                  <LineChart
                    data={forecastData?.biweeklySales || []}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 70
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      interval={2}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => value ? `${value.toLocaleString()} units` : 'N/A'} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actualSales"
                      name="Actual Sales"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="predictedSales"
                      name="Predicted Sales"
                      stroke="#dc2626"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
