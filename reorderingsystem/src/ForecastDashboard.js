import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.tsx";
import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert.tsx";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Bell, TrendingUp, Package, Truck } from 'lucide-react';
import './global.css';

const InventoryDashboard = () => {
  // Sample data structure based on the CSV
  const [data] = useState([
    {"date": "11/26/2024", "stock": 394848, "safetyStock": -1184544, "planned": 789696},
    {"date": "11/27/2024", "stock": 0, "safetyStock": -1184544, "planned": 394848},
    {"date": "12/4/2024", "stock": 921312, "safetyStock": -1184544, "planned": 1184544},
    {"date": "12/11/2024", "stock": 1623264, "safetyStock": -1184544, "planned": 1184544},
    {"date": "12/18/2024", "stock": 1941336, "safetyStock": -1184544, "planned": 789696}
  ]);

  const alerts = useMemo(() => [
    {
      type: "warning",
      message: "Stock levels approaching safety threshold in CRE1 location",
      date: "Today"
    },
    {
      type: "error",
      message: "Delayed delivery detected for PO 4500196146",
      date: "2 hours ago"
    },
    {
      type: "info",
      message: "Unusual consumption pattern detected in SEC2",
      date: "5 hours ago"
    }
  ], []);

  const metrics = useMemo(() => [
    {
      title: "Current Stock Level",
      value: "394,848",
      trend: "+2.4%",
      icon: Package
    },
    {
      title: "Forecast Accuracy",
      value: "92.3%",
      trend: "+1.2%",
      icon: TrendingUp
    },
    {
      title: "Active Orders",
      value: "24",
      trend: "-3",
      icon: Truck
    },
    {
      title: "Alert Count",
      value: "3",
      trend: "+2",
      icon: Bell
    }
  ], []);

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm text-green-600">{metric.trend}</p>
                </div>
                <metric.icon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inventory Levels Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="stock" name="Current Stock" stroke="#2563eb" />
                  <Line type="monotone" dataKey="safetyStock" name="Safety Stock" stroke="#dc2626" />
                  <Line type="monotone" dataKey="planned" name="Planned Orders" stroke="#16a34a" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <Alert key={index} variant={alert.type === "error" ? "destructive" : "default"}>
                  <AlertTitle className="text-sm font-medium">
                    {alert.date}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InventoryDashboard;
