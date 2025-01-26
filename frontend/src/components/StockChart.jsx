// frontend/src/components/StockChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StockChart = ({ data, symbol }) => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis 
            dataKey="date" 
            tick={{fontSize: 12}}
            tickFormatter={(date) => new Date(date).toLocaleDateString()}
          />
          <YAxis 
            tick={{fontSize: 12}}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            formatter={(value) => [`$${value}`, 'Price']}
            labelFormatter={(date) => new Date(date).toLocaleDateString()}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#4F46E5" 
            strokeWidth={2}
            dot={false}
            name={symbol}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;