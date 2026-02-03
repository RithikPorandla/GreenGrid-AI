import { GridMetrics, SimulationConfig } from '../types';

let currentTime = Date.now();
let phaseOffset = 0;
let accumulatedCo2Saved = 0;

// Base curve parameters
const BASE_LOAD = 500; 
const BASE_SOLAR = 300; 
const BASE_WIND = 200; 

const noise = (amplitude: number) => (Math.random() - 0.5) * amplitude;

export const generateNextGridStep = (
  prevMetric: GridMetrics | null,
  config: SimulationConfig,
  isOptimizing: boolean,
  liveDataOverride?: Partial<GridMetrics> | null
): GridMetrics => {
  currentTime += 2000; 
  phaseOffset += 0.05;

  const timeOfDayFactor = Math.sin(phaseOffset) * 0.5 + 0.5; 

  // --- Weather Forecast Simulation ---
  let weatherForecast = "CLEAR";
  const weatherCycle = Math.sin(phaseOffset * 0.5); 

  if (weatherCycle > 0.7) weatherForecast = "FOG_INCOMING";
  else if (weatherCycle < -0.7) weatherForecast = "LOW_WIND_CORRIDOR";

  // --- Generation Physics (Simulation) ---
  let currentSolarEff = config.solarEfficiency;
  let currentWindEff = config.windEfficiency;

  if (weatherCycle > 0.85) currentSolarEff *= 0.4;
  if (weatherCycle < -0.85) currentWindEff *= 0.3;

  let rawSolar = (BASE_SOLAR * timeOfDayFactor * currentSolarEff) + noise(20);
  let solar = Math.max(0, rawSolar);

  let rawWind = (BASE_WIND * Math.abs(Math.cos(phaseOffset * 0.3)) * currentWindEff) + noise(50);
  let wind = Math.max(0, rawWind);

  let rawLoad = (BASE_LOAD + (Math.sin(phaseOffset * 2) * 100)) * config.loadMultiplier + noise(15);
  let load = Math.max(200, rawLoad);
  
  let gridSupply = 0;
  let co2Intensity = 0;

  // --- LIVE DATA OVERRIDE ---
  if (liveDataOverride) {
      // If we have real data, use it for the generation mix
      solar = liveDataOverride.solar_power ?? solar;
      wind = liveDataOverride.wind_power ?? wind;
      load = (liveDataOverride.load_demand ?? load) * config.loadMultiplier; // Keep load multiplier for stress testing
      gridSupply = liveDataOverride.grid_supply ?? 0;
      co2Intensity = liveDataOverride.co2_intensity ?? 0;
  }

  // --- Optimization Bias Logic ---
  let battery = prevMetric?.battery_discharge || 0;
  
  if (!isOptimizing) {
    if (config.optimizationBias > 60 && load > (solar + wind)) {
       battery = Math.min(150, load - solar - wind);
    } else if (config.optimizationBias < 40) {
       battery = 0;
    }
  }

  // --- Gap Calculation (If Simulated) ---
  const renewableGen = solar + wind;
  
  if (!liveDataOverride) {
      // In simulation, Grid Supply fills the gap
      const gap = load - renewableGen - battery;
      gridSupply = Math.max(0, gap);
  }

  // --- Voltage Physics (Shared between Sim and Real) ---
  // Real data doesn't give us local voltage, so we simulate the physics of the "Microgrid" 
  // responding to the Real-Time generation inputs.
  let targetVoltage = 230;
  
  // High load drags voltage down
  if (load > 800) targetVoltage -= (load - 800) * 0.15;
  
  // Weather instability
  if (weatherForecast !== "CLEAR") targetVoltage -= 2; 
  
  // In live mode, if Grid Supply is massive (dirty grid), voltage is stiffer (stable)
  if (liveDataOverride && gridSupply > 600) targetVoltage += 2;

  let voltage = targetVoltage + noise(2);

  // --- Frequency ---
  let frequency = 50 + noise(0.05);
  if (voltage < 215) frequency -= 0.2;

  // --- Economics & CO2 & ESG ---
  const totalGen = renewableGen + gridSupply + battery;
  
  if (!liveDataOverride) {
      // Calculate derived metrics for simulation
      co2Intensity = (gridSupply * 400 + (solar + wind) * 20) / (totalGen || 1); 
  }
  
  const cost = (gridSupply * 0.20 + (solar + wind) * 0.05) / (totalGen || 1);

  // ESG: Calculate Saved CO2 vs a pure Coal baseline (800g/kWh)
  const baselineCo2 = load * 800; 
  const actualCo2 = totalGen * co2Intensity;
  const savedThisTick = Math.max(0, (baselineCo2 - actualCo2) / 1000); 
  accumulatedCo2Saved += savedThisTick;

  return {
    timestamp: currentTime,
    load_demand: Number(load.toFixed(2)),
    solar_power: Number(solar.toFixed(2)),
    wind_power: Number(wind.toFixed(2)),
    grid_supply: Number(gridSupply.toFixed(2)),
    battery_discharge: Number(battery.toFixed(2)),
    voltage: Number(voltage.toFixed(2)),
    frequency: Number(frequency.toFixed(2)),
    co2_intensity: Number(co2Intensity.toFixed(1)),
    cost_per_kwh: Number(cost.toFixed(3)),
    weather_forecast: weatherForecast,
    accumulated_co2_saved: Number(accumulatedCo2Saved.toFixed(1)),
    isRealTime: !!liveDataOverride
  };
};

export const applyCorrectiveAction = (current: GridMetrics, actionType: string): GridMetrics => {
  const next = { ...current };
  
  if (actionType === 'DISPATCH_BATTERY') {
    next.battery_discharge = 200; 
    // In live mode, we just reduce grid supply mathematically to show impact
    next.grid_supply = Math.max(0, next.load_demand - next.solar_power - next.wind_power - 200);
    next.voltage = 230 + noise(1); 
  } else if (actionType === 'CURTAIL_LOAD') {
    next.load_demand *= 0.8; 
    next.voltage = 235 + noise(1); 
  } else if (actionType === 'BOOST_TURBINE') {
    next.grid_supply += 100;
    next.voltage = 228 + noise(1);
  } else if (actionType === 'PREEMPTIVE_STORAGE') {
    next.battery_discharge = 150; 
    next.voltage = 232 + noise(0.5);
  }

  return next;
};