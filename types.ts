export interface GridMetrics {
  timestamp: number;
  load_demand: number; // kW
  solar_power: number; // kW
  wind_power: number; // kW
  grid_supply: number; // kW (The external grid/fossil fuel backup)
  battery_discharge: number; // kW
  voltage: number; // V (Target 230V, range 210-250)
  frequency: number; // Hz (Target 50/60)
  co2_intensity: number; // g/kWh
  cost_per_kwh: number; // $
  weather_forecast: string; // e.g., "CLEAR", "FOG_INCOMING", "LOW_WIND"
  accumulated_co2_saved: number; // kg
  isRealTime?: boolean; // Flag to indicate if data is from a live API
}

export type DataSourceType = 'SIMULATION' | 'ELECTRICITY_MAPS' | 'EIA';

export interface AgentLog {
  id: string;
  timestamp: Date;
  role: 'Grid_Manager' | 'Optimization_Writer' | 'Safety_Critic' | 'Weather_Forecaster' | 'ESG_Auditor' | 'System';
  message: string;
  status?: 'thinking' | 'success' | 'failure' | 'neutral';
}

export enum GridStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  OPTIMIZING = 'OPTIMIZING', 
}

export interface SimulationConfig {
  solarEfficiency: number; 
  windEfficiency: number; 
  loadMultiplier: number; 
  batteryCapacity: number; 
  optimizationBias: number; // 0 (Cheap/Dirty) to 100 (Green/Expensive)
}

export interface AnomalyThresholds {
  voltageDropPercent: number; 
  loadIncreasePercent: number;
  frequencyDeviation: number; // +/- Hz allowed before anomaly
  maxCo2Intensity: number; // g/kWh allowed before anomaly
}