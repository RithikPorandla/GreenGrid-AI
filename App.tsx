import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgentTerminal } from './components/AgentTerminal';
import { RealTimeChart } from './components/RealTimeChart';
import { KpiCard } from './components/KpiCard';
import { ThresholdControls } from './components/ThresholdControls';
import { GridMap } from './components/GridMap';
import { OptimizationControls } from './components/OptimizationControls';
import { GridMetrics, GridStatus, AgentLog, SimulationConfig, AnomalyThresholds, DataSourceType } from './types';
import { generateNextGridStep, applyCorrectiveAction } from './services/gridSimulation';
import { runAgentSimulation, generateEsgReport } from './services/geminiService';
import { fetchLiveGridData as fetchElectricityMaps } from './services/electricityMaps';
import { fetchEiaGridData } from './services/eiaData';
import { Zap, ShieldAlert, Cpu, CloudFog, Wind, Wifi, WifiOff, Database } from 'lucide-react';

const INITIAL_CONFIG: SimulationConfig = {
  solarEfficiency: 1.0,
  windEfficiency: 1.0,
  loadMultiplier: 1.0,
  batteryCapacity: 1000,
  optimizationBias: 50, // 50/50 Start
};

const INITIAL_THRESHOLDS: AnomalyThresholds = {
  voltageDropPercent: 9,
  loadIncreasePercent: 60,
  frequencyDeviation: 0.5, // Hz
  maxCo2Intensity: 450, // g/kWh
};

const MAX_HISTORY = 60;

const App: React.FC = () => {
  const [gridData, setGridData] = useState<GridMetrics[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [config, setConfig] = useState<SimulationConfig>(INITIAL_CONFIG);
  const [thresholds, setThresholds] = useState<AnomalyThresholds>(INITIAL_THRESHOLDS);
  const [status, setStatus] = useState<GridStatus>(GridStatus.NORMAL);
  const [isProcessingAnomaly, setIsProcessingAnomaly] = useState(false);
  const [manualOverride, setManualOverride] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  
  // Real Time Data State
  const [dataSource, setDataSource] = useState<DataSourceType>('SIMULATION');
  const [apiKeys, setApiKeys] = useState({ emaps: '', eia: '' });
  const [lastLiveFetch, setLastLiveFetch] = useState<Partial<GridMetrics> | null>(null);

  const configRef = useRef(INITIAL_CONFIG);
  const thresholdsRef = useRef(INITIAL_THRESHOLDS);
  const overrideRef = useRef<string | null>(null);
  const dataSourceRef = useRef(dataSource);
  const apiKeysRef = useRef(apiKeys);
  
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { thresholdsRef.current = thresholds; }, [thresholds]);
  useEffect(() => { overrideRef.current = manualOverride; }, [manualOverride]);
  useEffect(() => { dataSourceRef.current = dataSource; }, [dataSource]);
  useEffect(() => { apiKeysRef.current = apiKeys; }, [apiKeys]);

  const addLog = (role: AgentLog['role'], message: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36),
      timestamp: new Date(),
      role,
      message,
    }]);
  };

  // --- Real Time Data Fetcher Loop ---
  useEffect(() => {
    if (dataSource === 'SIMULATION') {
        setLastLiveFetch(null);
        return;
    }
    
    const fetchData = async () => {
        let data: Partial<GridMetrics> | null = null;
        
        if (dataSourceRef.current === 'ELECTRICITY_MAPS') {
            if (apiKeysRef.current.emaps) {
                data = await fetchElectricityMaps(apiKeysRef.current.emaps);
            }
        } else if (dataSourceRef.current === 'EIA') {
             if (apiKeysRef.current.eia) {
                 data = await fetchEiaGridData(apiKeysRef.current.eia);
             }
        }

        if (data) {
            setLastLiveFetch(data);
        }
    };

    fetchData();
    const interval = setInterval(fetchData, 20000); // 20s updates
    return () => clearInterval(interval);
  }, [dataSource, apiKeys]); // Re-initiate loop on source change or key update


  const handleAnomaly = useCallback(async (currentMetric: GridMetrics, reason: string) => {
    if (isProcessingAnomaly) return;
    setIsProcessingAnomaly(true);
    setStatus(GridStatus.OPTIMIZING);
    
    addLog('System', `ANOMALY DETECTED: ${reason}. Triggering Multi-Agent Negotiation...`);
    
    const result = await runAgentSimulation(
        currentMetric, 
        reason, 
        thresholdsRef.current,
        configRef.current.optimizationBias
    );
    
    result.logs.forEach((log, index) => {
      setTimeout(() => {
        setLogs(prev => [...prev, log]);
      }, index * 1200); 
    });

    const totalDelay = result.logs.length * 1200 + 1000;

    setTimeout(() => {
      const action = result.recommendedAction;
      addLog('System', `CONSENSUS REACHED: EXECUTING ${action}`);
      setManualOverride(action);
      
      setTimeout(() => {
        setManualOverride(null);
        setIsProcessingAnomaly(false);
        setStatus(GridStatus.NORMAL);
        addLog('System', 'Stability restored. Agents standing by.');
        
        if (configRef.current.loadMultiplier > 1.5) {
             setConfig(prev => ({...prev, loadMultiplier: 1.0}));
        }
        if (configRef.current.solarEfficiency < 0.5) {
            setConfig(prev => ({...prev, solarEfficiency: 1.0}));
        }

      }, 5000);
    }, totalDelay);

  }, [isProcessingAnomaly]);

  // --- Main Simulation Loop ---
  useEffect(() => {
    const interval = setInterval(() => {
      setGridData(prevData => {
        const lastMetric = prevData.length > 0 ? prevData[prevData.length - 1] : null;
        
        // Use live seed if we are not in simulation mode AND we have valid fetched data
        const liveSeed = (dataSourceRef.current !== 'SIMULATION') ? lastLiveFetch : null;

        let nextMetric = generateNextGridStep(
            lastMetric, 
            configRef.current, 
            !!overrideRef.current,
            liveSeed
        );

        if (overrideRef.current) {
            nextMetric = applyCorrectiveAction(nextMetric, overrideRef.current);
        }

        // Anomaly Checks
        if (!isProcessingAnomaly && !overrideRef.current) {
            const currentThresholds = thresholdsRef.current;
            const nominalVoltage = 230;
            const minVoltage = nominalVoltage * (1 - currentThresholds.voltageDropPercent / 100);
            const nominalLoad = 500;
            const maxLoad = nominalLoad * (1 + currentThresholds.loadIncreasePercent / 100);
            const maxCo2 = currentThresholds.maxCo2Intensity;
            const freqDev = currentThresholds.frequencyDeviation;

            if (nextMetric.voltage < minVoltage) {
                handleAnomaly(nextMetric, `Voltage Drop (-${currentThresholds.voltageDropPercent}% limit)`);
            } else if (nextMetric.load_demand > maxLoad) {
                handleAnomaly(nextMetric, `Load Spike (+${currentThresholds.loadIncreasePercent}% limit)`);
            } else if (Math.abs(nextMetric.frequency - 50) > freqDev) {
                handleAnomaly(nextMetric, `Frequency Deviation (${nextMetric.frequency.toFixed(2)}Hz)`);
            } else if (nextMetric.co2_intensity > maxCo2) {
                handleAnomaly(nextMetric, `ESG Violation: CO2 Intensity (${nextMetric.co2_intensity.toFixed(0)}g/kWh > ${maxCo2})`);
            } else if (nextMetric.weather_forecast !== "CLEAR" && lastMetric?.weather_forecast === "CLEAR") {
                 handleAnomaly(nextMetric, `Predictive Alert: ${nextMetric.weather_forecast}`);
            }
        }

        const newData = [...prevData, nextMetric];
        if (newData.length > MAX_HISTORY) newData.shift();
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleAnomaly, isProcessingAnomaly, lastLiveFetch]);

  const currentMetric: GridMetrics = gridData[gridData.length - 1] || {
    timestamp: Date.now(),
    voltage: 230,
    load_demand: 0,
    solar_power: 0,
    wind_power: 0,
    grid_supply: 0,
    battery_discharge: 0,
    co2_intensity: 0,
    cost_per_kwh: 0,
    frequency: 50,
    weather_forecast: 'CLEAR',
    accumulated_co2_saved: 0
  };

  const handleGenerateReport = async () => {
      setReportLoading(true);
      const text = await generateEsgReport(currentMetric);
      setReportText(text);
      setShowReportModal(true);
      setReportLoading(false);
  };

  const getStatusColor = (s: GridStatus) => {
    switch (s) {
      case GridStatus.NORMAL: return 'text-primary bg-primary/10 border-primary/20';
      case GridStatus.WARNING: return 'text-warning bg-warning/10 border-warning/20';
      case GridStatus.CRITICAL: return 'text-danger bg-danger/10 border-danger/20';
      case GridStatus.OPTIMIZING: return 'text-secondary bg-secondary/10 border-secondary/20 animate-pulse';
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-primary/30 text-gray-200 pb-10 relative">
      
      {/* Report Modal */}
      {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-white/10 bg-[#0A0A0A]">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <ShieldAlert className="text-emerald-500" /> ESG Compliance Report
                  </h2>
                  <div className="prose prose-invert prose-sm mb-6 max-h-[60vh] overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-gray-300">{reportText}</pre>
                  </div>
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                  >
                      Close Report
                  </button>
              </div>
          </div>
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-card border-x-0 border-t-0 border-b px-6 py-4 mb-8">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-lg">
                    <Zap className="text-primary w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                        GreenGrid <span className="text-gray-500 font-normal">Optimizer</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
                            {currentMetric.weather_forecast === 'CLEAR' ? <Zap className="w-3 h-3" /> : 
                             currentMetric.weather_forecast.includes('FOG') ? <CloudFog className="w-3 h-3 text-blue-400" /> : <Wind className="w-3 h-3 text-gray-400" />}
                            {currentMetric.weather_forecast.replace('_', ' ')}
                        </span>
                        
                        {dataSource === 'ELECTRICITY_MAPS' && (
                            <span className="flex items-center gap-1 text-[9px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded border border-secondary/20">
                                <Wifi className="w-2.5 h-2.5" /> LIVE: CAISO
                            </span>
                        )}
                        {dataSource === 'EIA' && (
                            <span className="flex items-center gap-1 text-[9px] bg-warning/10 text-warning px-1.5 py-0.5 rounded border border-warning/20">
                                <Database className="w-2.5 h-2.5" /> LIVE: ERCOT
                            </span>
                        )}
                        {dataSource === 'SIMULATION' && (
                             <span className="flex items-center gap-1 text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                                <WifiOff className="w-2.5 h-2.5" /> SIMULATED
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${getStatusColor(status)}`}>
                {status === GridStatus.OPTIMIZING && <Cpu className="w-3.5 h-3.5 animate-spin" />}
                {status === GridStatus.CRITICAL && <ShieldAlert className="w-3.5 h-3.5" />}
                <span className="font-mono text-xs font-bold tracking-wider">{status}</span>
            </div>
        </div>
      </nav>

      {/* Main Grid */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6">
        
        {/* Row 1: KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard 
                label="Voltage" 
                value={currentMetric.voltage} 
                unit="V" 
                color={currentMetric.voltage < (230 * (1 - thresholds.voltageDropPercent/100)) ? 'danger' : 'success'} 
            />
            <KpiCard 
                label="CO2 Avoided (Total)" 
                value={currentMetric.accumulated_co2_saved.toFixed(1)} 
                unit="kg"
                color="success"
            />
            <KpiCard 
                label="CO2 Intensity" 
                value={currentMetric.co2_intensity} 
                unit="g/kWh" 
                color={currentMetric.co2_intensity > thresholds.maxCo2Intensity ? 'warning' : 'default'}
            />
            <KpiCard 
                label="Efficiency Cost" 
                value={`$${currentMetric.cost_per_kwh}`} 
                unit="/kWh" 
            />
        </div>

        {/* Row 2: Charts & Digital Twin */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 h-[420px] flex flex-col gap-6">
                <div className="flex-1">
                    <RealTimeChart 
                        title="Energy Mix (Real-Time)"
                        data={gridData}
                        dataKeys={[
                            { key: 'load_demand', color: '#EF4444', name: 'Load' },
                            { key: 'grid_supply', color: '#737373', name: 'Grid' },
                            { key: 'solar_power', color: '#F59E0B', name: 'Solar' },
                            { key: 'battery_discharge', color: '#3B82F6', name: 'Storage' },
                        ]}
                    />
                </div>
            </div>
            <div className="h-[420px]">
                 <GridMap metrics={currentMetric} status={status} />
            </div>
        </div>

        {/* Row 3: Controls & Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control Column */}
            <div className="flex flex-col gap-6">
                <div className="flex-1 min-h-[300px]">
                     <OptimizationControls 
                        bias={config.optimizationBias} 
                        setBias={(v) => setConfig(prev => ({...prev, optimizationBias: v}))}
                        onGenerateReport={handleGenerateReport}
                        reportLoading={reportLoading}
                        dataSource={dataSource}
                        setDataSource={setDataSource}
                        apiKeys={apiKeys}
                        setApiKeys={setApiKeys}
                     />
                </div>
                <div className="flex-1 min-h-[200px]">
                     <ThresholdControls thresholds={thresholds} onChange={setThresholds} />
                </div>
            </div>

             {/* Agent Terminal (Wider now) */}
             <div className="lg:col-span-2 h-[500px] lg:h-auto">
                 <AgentTerminal logs={logs} />
             </div>
        </div>

      </main>
    </div>
  );
};

export default App;