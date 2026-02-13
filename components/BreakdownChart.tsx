
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalysisScore } from '../types';

interface BreakdownChartProps {
  breakdown: AnalysisScore['breakdown'];
}

const BreakdownChart: React.FC<BreakdownChartProps> = ({ breakdown }) => {
  const data = [
    { name: 'Docs', val: breakdown.documentation, max: 20 },
    { name: 'Quality', val: breakdown.codeQuality, max: 20 },
    { name: 'Activity', val: breakdown.activity, max: 15 },
    { name: 'Org', val: breakdown.organization, max: 10 },
    { name: 'Impact', val: breakdown.impact, max: 15 },
    { name: 'Depth', val: breakdown.technicalDepth, max: 15 },
    { name: 'Collab', val: breakdown.collaboration, max: 5 },
  ];

  return (
    <div className="w-full h-64 min-h-[256px] min-w-0 relative">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
          />
          <Tooltip 
            cursor={{ fill: '#161b22' }}
            contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #374151', borderRadius: '8px' }}
          />
          <Bar dataKey="val" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.val / entry.max > 0.8 ? '#10b981' : entry.val / entry.max > 0.5 ? '#f59e0b' : '#ef4444'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BreakdownChart;
