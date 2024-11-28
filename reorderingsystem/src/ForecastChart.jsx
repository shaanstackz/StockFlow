import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
 
const ForecastChart = ({ data }) => {
  // Transform the biweeklySales data for the chart
  const transformedData = data?.biweeklySales?.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    actualSales: parseFloat((item.actualSales / 1000).toFixed(1)), // Convert to thousands
    predictedSales: item.predictedSales ? parseFloat((item.predictedSales / 1000).toFixed(1)) : null
  })) || [];
 
  // Custom tooltip formatter to add thousands separator and units
  const formatTooltip = (value) => {
    if (value == null) return 'N/A';
    return `${value.toLocaleString()} K units`;
  };
 
  // Custom legend formatter
  const renderLegend = (value) => {
    return value === 'actualSales' ? 'Actual Sales' : 'Predicted Sales';
  };
 
  return (
<Card className="w-full">
<CardHeader>
<CardTitle>Sales Forecast</CardTitle>
</CardHeader>
<CardContent>
<div className="h-96">
<ResponsiveContainer width="100%" height="100%">
<LineChart
              data={transformedData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}
>
<CartesianGrid strokeDasharray="3 3" />
<XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { 
                  month: 'short',
                  day: 'numeric'
                })}
                angle={-45}
                textAnchor="end"
                height={60}
              />
<YAxis
                label={{ 
                  value: 'Units (Thousands)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
<Tooltip
                formatter={formatTooltip}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              />
<Legend formatter={renderLegend} />
<Line
                type="monotone"
                dataKey="actualSales"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 8 }}
                name="actualSales"
              />
<Line
                type="monotone"
                dataKey="predictedSales"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 8 }}
                name="predictedSales"
              />
</LineChart>
</ResponsiveContainer>
</div>
</CardContent>
</Card>
  );
};
 
export default ForecastChart;