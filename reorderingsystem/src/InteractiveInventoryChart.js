import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card.tsx";
import './global.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';

const InventoryChart = () => {
  // Process and transform the data
  const [data] = useState(() => {
    // Convert raw CSV data into structured format
    const processedData = [
      {"date": "2024-11-26", "stock": 394848, "safetyStock": -1184544, "planned": 789696, "event": "Stock on hold"},
      {"date": "2024-11-27", "stock": 0, "safetyStock": -1184544, "planned": 394848},
      {"date": "2024-12-04", "stock": 921312, "safetyStock": -1184544, "planned": 1184544, "event": "Large PO received"},
      {"date": "2024-12-11", "stock": 1623264, "safetyStock": -1184544, "planned": 1184544},
      {"date": "2024-12-18", "stock": 1941336, "safetyStock": -1184544, "planned": 789696, "event": "Peak inventory"},
      {"date": "2024-12-25", "stock": 1500000, "safetyStock": -1184544, "planned": 0, "event": "Year-end adjustment"},
      {"date": "2025-01-01", "stock": 1200000, "safetyStock": -1184544, "planned": 500000},
      {"date": "2025-01-08", "stock": 900000, "safetyStock": -1184544, "planned": 750000},
      {"date": "2025-01-15", "stock": 600000, "safetyStock": -1184544, "planned": 1000000, "event": "Low stock alert"}
    ].map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString(),
    }));
    return processedData;
  });

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-bold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
          {payload[0].payload.event && (
            <p className="text-gray-600 mt-2">
              Event: {payload[0].payload.event}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
};

export default InventoryChart;
