import React from 'react';
import {
  AreaChart, // Changed from LineChart to AreaChart for gradient fill
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { GridMetrics } from '../types';

interface RealTimeChartProps {
  data: GridMetrics[];
  dataKeys: { key: keyof GridMetrics; color: string; name: string }[];
  title: string;
  yDomain?: [number, number];
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({ data, dataKeys, title, yDomain }) => {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col h-full relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
          <h3 className="text-gray-200 text-sm font-medium tracking-wide">{title}</h3>
          <div className="flex gap-2">
               {dataKeys.map(k => (
                   <div key={k.key} className="flex items-center gap-1.5">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: k.color }}></div>
                       <span className="text-[10px] text-gray-500 uppercase">{k.name}</span>
                   </div>
               ))}
          </div>
      </div>
      
      <div className="flex-grow min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              {dataKeys.map((k, i) => (
                <linearGradient key={k.key} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={k.color} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={k.color} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tick={false} 
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={yDomain || ['auto', 'auto']} 
              stroke="#525252"
              tick={{ fontSize: 10, fill: '#525252' }}
              tickFormatter={(val) => val.toFixed(0)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                  backgroundColor: '#0A0A0A', 
                  borderColor: '#262626', 
                  color: '#F3F4F6', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
              }}
              itemStyle={{ fontSize: '12px', fontWeight: 500 }}
              labelFormatter={() => ''}
            />
            {dataKeys.map((k, i) => (
              <Area
                key={k.key}
                type="monotone"
                dataKey={k.key}
                stroke={k.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${i})`}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};