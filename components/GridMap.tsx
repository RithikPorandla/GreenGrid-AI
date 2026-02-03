import React from 'react';
import { GridMetrics, GridStatus } from '../types';
import { Zap, Home, Battery, Sun, Wind, Factory } from 'lucide-react';

interface GridMapProps {
    metrics: GridMetrics;
    status: GridStatus;
}

export const GridMap: React.FC<GridMapProps> = ({ metrics, status }) => {
    const isCritical = status === GridStatus.CRITICAL;
    const isOptimizing = status === GridStatus.OPTIMIZING;

    // Helper to determine flow line color/animation
    const getFlowClass = (active: boolean, type: 'renewable' | 'dirty' | 'storage' | 'load') => {
        if (!active) return 'stroke-gray-800';
        const base = 'stroke-[2px] vector-effect-non-scaling-stroke';
        if (type === 'renewable') return `${base} stroke-emerald-500 ${active ? 'animate-dash-slow' : ''}`;
        if (type === 'dirty') return `${base} stroke-gray-500 ${active ? 'animate-dash-slow' : ''}`;
        if (type === 'storage') return `${base} stroke-blue-500 ${active ? 'animate-dash-fast' : ''}`;
        if (type === 'load') return `${base} stroke-red-400 ${active ? 'animate-dash-rapid' : ''}`;
        return '';
    };

    return (
        <div className="glass-card rounded-2xl p-6 h-full relative overflow-hidden bg-[#050505]">
            <div className="absolute top-4 left-6 z-10">
                <h3 className="text-gray-200 text-sm font-medium tracking-wide flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-500" /> Digital Twin
                </h3>
            </div>

            <div className="w-full h-full flex items-center justify-center relative">
                <svg viewBox="0 0 400 300" className="w-full h-full max-w-[500px]">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* --- Power Lines --- */}
                    
                    {/* Solar to Hub */}
                    <path d="M 60 60 L 150 150" className={getFlowClass(metrics.solar_power > 10, 'renewable')} strokeDasharray="10,5" />
                    
                    {/* Wind to Hub */}
                    <path d="M 60 240 L 150 150" className={getFlowClass(metrics.wind_power > 10, 'renewable')} strokeDasharray="10,5" />
                    
                    {/* Fossil to Hub */}
                    <path d="M 340 60 L 250 150" className={getFlowClass(metrics.grid_supply > 10, 'dirty')} strokeDasharray="10,5" />
                    
                    {/* Battery to Hub (Bi-directional technically, simplifying here) */}
                    <path d="M 340 240 L 250 150" className={getFlowClass(metrics.battery_discharge > 0, 'storage')} strokeDasharray="10,5" />

                    {/* Central Bus (Hub) */}
                    <path d="M 150 150 L 250 150" className={`stroke-white stroke-[3px] ${isCritical ? 'animate-pulse stroke-red-500' : ''}`} />

                    {/* Hub to Load */}
                    <path d="M 200 150 L 200 250" className={getFlowClass(true, 'load')} strokeDasharray="10,5" />


                    {/* --- Nodes --- */}

                    {/* Solar Node */}
                    <g transform="translate(40, 40)">
                        <circle cx="20" cy="20" r="25" fill="#0A0A0A" stroke="#10B981" strokeWidth="2" filter="url(#glow)" />
                        <Sun className="text-emerald-500 w-6 h-6 x-centered" x="8" y="8" />
                        <text x="20" y="60" textAnchor="middle" className="text-[10px] fill-gray-400">Solar</text>
                    </g>

                    {/* Wind Node */}
                    <g transform="translate(40, 220)">
                        <circle cx="20" cy="20" r="25" fill="#0A0A0A" stroke="#10B981" strokeWidth="2" filter="url(#glow)" />
                        <Wind className="text-emerald-500 w-6 h-6" x="8" y="8" />
                        <text x="20" y="60" textAnchor="middle" className="text-[10px] fill-gray-400">Wind</text>
                    </g>

                    {/* Fossil Node */}
                    <g transform="translate(320, 40)">
                        <circle cx="20" cy="20" r="25" fill="#0A0A0A" stroke="#6B7280" strokeWidth="2" />
                        <Factory className="text-gray-400 w-6 h-6" x="8" y="8" />
                        <text x="20" y="60" textAnchor="middle" className="text-[10px] fill-gray-400">Grid</text>
                    </g>

                    {/* Battery Node */}
                    <g transform="translate(320, 220)">
                        <circle cx="20" cy="20" r="25" fill="#0A0A0A" stroke="#3B82F6" strokeWidth="2" filter={metrics.battery_discharge > 0 ? "url(#glow)" : ""} />
                        <Battery className="text-blue-500 w-6 h-6" x="8" y="8" />
                        <text x="20" y="60" textAnchor="middle" className="text-[10px] fill-gray-400">Storage</text>
                    </g>

                    {/* Load Node (City) */}
                    <g transform="translate(180, 230)">
                        <rect x="0" y="0" width="40" height="40" rx="8" fill="#0A0A0A" stroke={isCritical ? "#EF4444" : "#E5E7EB"} strokeWidth="2" />
                        <Home className={`${isCritical ? "text-red-500 animate-bounce" : "text-gray-200"} w-6 h-6`} x="8" y="8" />
                        <text x="20" y="55" textAnchor="middle" className="text-[10px] fill-gray-400">City Load</text>
                    </g>
                    
                </svg>
            </div>
            
            {/* Status Overlay */}
            <div className="absolute bottom-4 right-6 flex flex-col items-end gap-1">
                <span className="text-[10px] text-gray-500 font-mono">GRID TOPOLOGY</span>
                {isOptimizing && <span className="text-xs text-blue-400 font-mono animate-pulse">REROUTING POWER...</span>}
            </div>
        </div>
    );
};