import React, { useState } from 'react';
import { Leaf, DollarSign, FileText, Globe, Key, Activity, Database } from 'lucide-react';
import { DataSourceType } from '../types';

interface OptimizationControlsProps {
    bias: number;
    setBias: (val: number) => void;
    onGenerateReport: () => void;
    reportLoading: boolean;
    dataSource: DataSourceType;
    setDataSource: (val: DataSourceType) => void;
    apiKeys: { emaps: string; eia: string };
    setApiKeys: (keys: { emaps: string; eia: string }) => void;
}

export const OptimizationControls: React.FC<OptimizationControlsProps> = ({ 
    bias, 
    setBias, 
    onGenerateReport, 
    reportLoading,
    dataSource,
    setDataSource,
    apiKeys,
    setApiKeys
}) => {
    
    const handleKeyChange = (val: string) => {
        if (dataSource === 'ELECTRICITY_MAPS') {
            setApiKeys({ ...apiKeys, emaps: val });
        } else if (dataSource === 'EIA') {
            setApiKeys({ ...apiKeys, eia: val });
        }
    };

    const currentKey = dataSource === 'ELECTRICITY_MAPS' ? apiKeys.emaps : (dataSource === 'EIA' ? apiKeys.eia : '');

    return (
        <div className="glass-card rounded-2xl p-6 h-full flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div>
                <h3 className="text-gray-200 text-sm font-medium tracking-wide flex items-center gap-2 mb-6">
                    <Leaf className="w-4 h-4 text-emerald-500" /> Optimization Strategy
                </h3>

                {/* Pareto Slider */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs mb-3 font-medium">
                        <span className={`flex items-center gap-1 ${bias < 50 ? 'text-blue-400' : 'text-gray-600'}`}>
                            <DollarSign className="w-3 h-3" /> Cost Priority
                        </span>
                        <span className={`flex items-center gap-1 ${bias >= 50 ? 'text-emerald-400' : 'text-gray-600'}`}>
                            Carbon Priority <Leaf className="w-3 h-3" />
                        </span>
                    </div>
                    
                    <div className="relative h-6 flex items-center">
                        <div className="absolute w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
                                style={{ width: `${bias}%` }}
                             />
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="10"
                            value={bias}
                            onChange={(e) => setBias(Number(e.target.value))}
                            className="absolute w-full h-full opacity-0 cursor-pointer"
                        />
                        <div 
                            className="absolute h-4 w-4 bg-white rounded-full shadow-lg pointer-events-none transition-all duration-300 border border-gray-300"
                            style={{ left: `calc(${bias}% - 8px)` }}
                        />
                    </div>
                    <div className="mt-2 text-center text-[10px] text-gray-500 font-mono">
                        BIAS: {bias < 50 ? "ECONOMIC ($)" : "ECOLOGICAL (ESG)"}
                    </div>
                </div>

                {/* Data Source Toggle */}
                <div className="mb-8 border-t border-white/10 pt-6">
                     <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Data Source
                     </h4>
                     
                     <div className="flex flex-col gap-2 mb-4">
                         {/* Option: Simulation */}
                         <button 
                            onClick={() => setDataSource('SIMULATION')}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all border ${dataSource === 'SIMULATION' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}
                         >
                             <Activity className="w-4 h-4" />
                             <div className="text-left">
                                 <div className="text-xs font-semibold">Physics Simulation</div>
                                 <div className="text-[9px] opacity-70">Randomized chaos & anomalies</div>
                             </div>
                         </button>

                         {/* Option: Electricity Maps */}
                         <button 
                            onClick={() => setDataSource('ELECTRICITY_MAPS')}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all border ${dataSource === 'ELECTRICITY_MAPS' ? 'bg-secondary/10 border-secondary/30 text-secondary' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}
                         >
                             <Globe className="w-4 h-4" />
                             <div className="text-left">
                                 <div className="text-xs font-semibold">Electricity Maps API</div>
                                 <div className="text-[9px] opacity-70">Global Carbon Intensity (CAISO)</div>
                             </div>
                         </button>

                         {/* Option: EIA */}
                         <button 
                            onClick={() => setDataSource('EIA')}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all border ${dataSource === 'EIA' ? 'bg-warning/10 border-warning/30 text-warning' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}
                         >
                             <Database className="w-4 h-4" />
                             <div className="text-left">
                                 <div className="text-xs font-semibold">U.S. EIA API (Open Data)</div>
                                 <div className="text-[9px] opacity-70">Real-time Fuel Mix (ERCOT/Texas)</div>
                             </div>
                         </button>
                     </div>

                     {dataSource !== 'SIMULATION' && (
                         <div className="animate-fadeIn mt-4 bg-black/30 p-3 rounded-xl border border-white/10">
                             <div className="relative">
                                 <Key className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                                 <input 
                                    type="password"
                                    placeholder={dataSource === 'ELECTRICITY_MAPS' ? "Electricity Maps API Key" : "EIA API Key (v2)"}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-gray-300 focus:outline-none focus:border-white/30"
                                    value={currentKey}
                                    onChange={(e) => handleKeyChange(e.target.value)}
                                 />
                             </div>
                             <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                                 {dataSource === 'ELECTRICITY_MAPS' 
                                    ? "Connects to api.electricitymap.org (CAISO Zone)." 
                                    : "Connects to api.eia.gov/v2 (ERCOT Respondent)."
                                 }
                             </p>
                         </div>
                     )}
                </div>
            </div>

            <div>
                <button 
                    onClick={onGenerateReport}
                    disabled={reportLoading}
                    className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-gray-300 transition-all"
                >
                    {reportLoading ? (
                        <span className="animate-pulse">Generating Audit...</span>
                    ) : (
                        <>
                            <FileText className="w-4 h-4" /> Download ESG Compliance Report
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};