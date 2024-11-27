import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.tsx";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert.tsx";
import { Package, TrendingUp, Truck, Bell } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
 
const InventoryDashboard = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
 
  useEffect(() => {
    // Fetch data from backend
    const fetchData = async () => {
      const [summary, chart, analysis] = await Promise.all([
        fetch('http://localhost:8000/api/inventory/summary').then(res => res.json()),
        fetch('http://localhost:8000/api/inventory/chart-data').then(res => res.json()),
        fetch('http://localhost:8000/api/inventory/analysis').then(res => res.json())
      ]);
 
      setSummaryData(summary);
      setChartData(chart);
      setAnalysisData(analysis);
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
      value: `${summaryData.forecastAccuracy}%`,
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
 
      {/* Main Charts */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
<Card>
<CardHeader>
<CardTitle>Inventory Levels</CardTitle>
</CardHeader>
<CardContent>
<div className="h-[400px]">
<ResponsiveContainer>
<LineChart data={chartData}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="Planned dates" />
<YAxis />
<Tooltip />
<Legend />
<Line type="monotone" dataKey="Avail. Quantity" name="Available" stroke="#2563eb" />
<Line type="monotone" dataKey="Rec./reqd qty" name="Required" stroke="#16a34a" />
</LineChart>
</ResponsiveContainer>
</div>
</CardContent>
</Card>
 
        <Card>
<CardHeader>
<CardTitle>Location Analysis</CardTitle>
</CardHeader>
<CardContent>
<div className="h-[400px]">
<ResponsiveContainer>
<BarChart data={Object.entries(analysisData?.locationAnalysis || {}).map(([loc, data]) => ({
                  location: loc,
                  quantity: data['Rec./reqd qty']['sum']
                }))}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="location" />
<YAxis />
<Tooltip />
<Legend />
<Bar dataKey="quantity" fill="#2563eb" />
</BarChart>
</ResponsiveContainer>
</div>
</CardContent>
</Card>
</div>
 
      {/* Analysis Section */}
<div className="grid grid-cols-1 gap-4">
<Card>
<CardHeader>
<CardTitle>Inventory Analysis Summary</CardTitle>
</CardHeader>
<CardContent>
<div className="space-y-4">
              {analysisData?.movementAnalysis && (
<div>
<h3 className="font-semibold mb-2">Movement Type Distribution</h3>
<div className="grid grid-cols-2 gap-4">
                    {Object.entries(analysisData.movementAnalysis).map(([type, count]) => (
<div key={type} className="flex justify-between">
<span>{type}</span>
<span className="font-semibold">{count}</span>
</div>
                    ))}
</div>
</div>
              )}
</div>
</CardContent>
</Card>
</div>
</div>
  );
};
 
export default InventoryDashboard;