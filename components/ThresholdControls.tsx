import React from 'react';
import { Sliders, AlertTriangle, Activity, Leaf } from 'lucide-react';
import { AnomalyThresholds } from '../types';

interface ThresholdControlsProps {
  thresholds: AnomalyThresholds;
  onChange: (t: AnomalyThresholds) => void;
}

export const ThresholdControls: React.FC<ThresholdControlsProps> = ({ thresholds, onChange }) => {
  const nominalVoltage = 230;
  const nominalLoad = 500;
  
  const voltageTrigger = (nominalVoltage * (1 - thresholds.voltageDropPercent / 100)).toFixed(1);
  const loadTrigger = (nominalLoad * (1 + thresholds.loadIncreasePercent / 100)).toFixed(0);

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col justify-between overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-200 text-sm font-medium tracking-wide flex items-center gap-2">
                <Sliders className="w-4 h-4 text-gray-500" /> Thresholds
            </h3>
        </div>
        
        <div className="space-y-6">
            {/* Voltage Control */}
            <div className="group">
                <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400 group-hover:text-gray-200 transition-colors">Voltage Stability</span>
                    <span className="text-warning font-mono bg-warning/10 px-1.5 py-0.5 rounded text-[10px]">{thresholds.voltageDropPercent}% (&lt; {voltageTrigger}V)</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    step="1"
                    value={thresholds.voltageDropPercent}
                    onChange={(e) => onChange({ ...thresholds, voltageDropPercent: Number(e.target.value) })}
                    className="w-full"
                />
            </div>

            {/* Load Control */}
            <div className="group">
                 <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400 group-hover:text-gray-200 transition-colors">Max Load Surge</span>
                    <span className="text-danger font-mono bg-danger/10 px-1.5 py-0.5 rounded text-[10px]">+{thresholds.loadIncreasePercent}% (&gt; {loadTrigger}kW)</span>
                </div>
                <input 
                    type="range" 
                    min="10" 
                    max="100" 
                    step="5"
                    value={thresholds.loadIncreasePercent}
                    onChange={(e) => onChange({ ...thresholds, loadIncreasePercent: Number(e.target.value) })}
                    className="w-full"
                />
            </div>

            {/* Frequency Control */}
            <div className="group">
                 <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400 group-hover:text-gray-200 transition-colors flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Freq Deviation
                    </span>
                    <span className="text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">+/- {thresholds.frequencyDeviation} Hz</span>
                </div>
                <input 
                    type="range" 
                    min="0.1" 
                    max="2.0" 
                    step="0.1"
                    value={thresholds.frequencyDeviation}
                    onChange={(e) => onChange({ ...thresholds, frequencyDeviation: Number(e.target.value) })}
                    className="w-full"
                />
            </div>

            {/* CO2 Limit */}
            <div className="group">
                 <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400 group-hover:text-gray-200 transition-colors flex items-center gap-1">
                        <Leaf className="w-3 h-3" /> Max CO2 Intensity
                    </span>
                    <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px]">&gt; {thresholds.maxCo2Intensity} g/kWh</span>
                </div>
                <input 
                    type="range" 
                    min="100" 
                    max="800" 
                    step="25"
                    value={thresholds.maxCo2Intensity}
                    onChange={(e) => onChange({ ...thresholds, maxCo2Intensity: Number(e.target.value) })}
                    className="w-full"
                />
            </div>
            
            <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl flex gap-3 items-center">
                <AlertTriangle className="w-4 h-4 text-secondary shrink-0" />
                <p className="text-[10px] text-gray-400 leading-tight">
                    Breaching these limits triggers autonomous agent intervention.
                </p>
            </div>
        </div>
    </div>
  );
};