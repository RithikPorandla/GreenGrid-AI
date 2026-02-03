import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'success' | 'warning' | 'danger';
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, unit, color = 'default' }) => {
  const colorClasses = {
    default: 'text-gray-100',
    success: 'text-primary',
    warning: 'text-warning',
    danger: 'text-danger',
  };

  const trendIcon = {
      success: <TrendingUp className="w-3 h-3 text-primary" />,
      warning: <TrendingUp className="w-3 h-3 text-warning" />,
      danger: <TrendingDown className="w-3 h-3 text-danger" />,
      default: <Minus className="w-3 h-3 text-gray-500" />
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.04] transition-colors duration-300 group">
      <div className="flex justify-between items-start">
        <span className="text-gray-400 text-[11px] font-semibold uppercase tracking-widest">{label}</span>
        {/* Decorative dot */}
        <div className={`w-1.5 h-1.5 rounded-full ${color === 'default' ? 'bg-gray-700' : colorClasses[color].replace('text-', 'bg-')}`}></div>
      </div>
      
      <div className="flex items-baseline gap-1.5 mt-3">
        <span className={`text-3xl font-sans font-medium tracking-tight ${colorClasses[color]} group-hover:scale-105 transition-transform duration-300 origin-left`}>
          {value}
        </span>
        {unit && <span className="text-gray-500 text-sm font-medium">{unit}</span>}
      </div>
    </div>
  );
};