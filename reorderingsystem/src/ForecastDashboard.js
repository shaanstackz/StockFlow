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
 
const InventoryDashboard = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summary, chart, analysis, forecast] = await Promise.all([
          fetch('http://localhost:8000/api/inventory/summary').then(res => res.json()),
          fetch('http://localhost:8000/api/inventory/chart-data').then(res => res.json()),
          fetch('http://localhost:8000/api/inventory/analysis').then(res => res.json()),
          fetch('http://localhost:8000/api/inventory/forecast').then(res => res.json())
        ]);
 
        setSummaryData(summary);
        setChartData(chart);
        setAnalysisData(analysis);
        setForecastData(forecast);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
      }
    };
 
    fetchData();
  }, []);
 
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
 
  const formatTooltip = (value) => {
    if (value == null) return 'N/A';
    return `${value.toLocaleString()} K units`;
  };
 
  if (error) {
    return (
<Alert variant="destructive" className="m-6">
<AlertTitle>Error</AlertTitle>
<AlertDescription>{error}</AlertDescription>
</Alert>
    );
  }
 
  return (
<div className="p-6 space-y-6">
      {/* Metrics Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
 
      {/* Charts */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inventory Levels Chart */}
<Card>
<CardHeader>
<CardTitle>Inventory Levels</CardTitle>
</CardHeader>
<CardContent>
<div style={{ width: '100%', height: '400px' }}>
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
 
        {/* Forecast Chart */}
<Card>
<CardHeader>
<CardTitle>Sales Forecast</CardTitle>
</CardHeader>
<CardContent>
<div style={{ width: '100%', height: '400px' }}>
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
  );
};
 
export default InventoryDashboard;