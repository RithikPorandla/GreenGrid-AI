import { GoogleGenAI } from '@google/genai';
import { GridMetrics, AgentLog, AnomalyThresholds } from '../types';

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");
    return new GoogleGenAI({ apiKey });
};

export const runAgentSimulation = async (
  metrics: GridMetrics,
  anomalyDescription: string,
  thresholds: AnomalyThresholds,
  optimizationBias: number // 0-100
): Promise<{ logs: AgentLog[]; recommendedAction: string }> => {
  const ai = getAiClient();
  const modelId = "gemini-3-flash-preview"; 
  
  const voltageLimitLow = (230 * (1 - thresholds.voltageDropPercent / 100)).toFixed(1);
  const biasLabel = optimizationBias > 50 ? "MAXIMIZE_ESG_AND_STABILITY" : "MAXIMIZE_PROFIT_MINIMIZE_COST";

  const prompt = `
    Role: You are a Multi-Agent Smart Grid Control System with Predictive Capabilities.
    
    Context:
    - Optimization Strategy: ${biasLabel} (Slider Value: ${optimizationBias}/100)
    - Weather Forecast: ${metrics.weather_forecast}
    - Accumulated CO2 Saved: ${metrics.accumulated_co2_saved} kg
    
    Telemetry (Current State):
    - Voltage: ${metrics.voltage}V (Safe Range: > ${voltageLimitLow}V)
    - Frequency: ${metrics.frequency}Hz (Safe Range: 50Hz ± ${thresholds.frequencyDeviation})
    - CO2 Intensity: ${metrics.co2_intensity}g/kWh (Limit: < ${thresholds.maxCo2Intensity})
    - Load: ${metrics.load_demand}kW
    - Solar: ${metrics.solar_power}kW | Wind: ${metrics.wind_power}kW
    - Battery Output: ${metrics.battery_discharge}kW
    
    Anomaly/Event: ${anomalyDescription}
    
    Feature Requirement - Predictive Weather Agent:
    - If Forecast is NOT "CLEAR", you must inject "Future-State" variables into the optimization.
    - MATH CONSTRAINT CHANGE: Switch from "P_wind <= Current_Wind" to "P_wind <= f(Forecast_Wind)".
    - If FOG_INCOMING: Anticipate 60% Solar Drop.
    - If LOW_WIND_CORRIDOR: Anticipate 70% Wind Drop.
    
    Agents & Personalities:
    1. [Weather_Forecaster]: Analyzes 'Weather Forecast'. If imminent bad weather is detected, ORDER pre-emptive action (e.g., "Fog detected T-minus 10 mins. Initiating storage spin-up.").
    2. [Grid_Manager] (Market Focus): Wants to maximize profit. If Forecast implies future scarcity, agrees to spend money now to prevent blackout later.
    3. [Safety_Critic]: STRICT physics engine. Denies any plan that risks Voltage < ${voltageLimitLow}V OR Frequency Deviation > ${thresholds.frequencyDeviation}Hz.
    4. [Optimization_Writer]: The mediator. Calculates the new dispatch plan using the FORECASTED constraints.
    
    Output Format (JSON):
    {
      "logs": [
        { "role": "Weather_Forecaster", "message": "..." },
        { "role": "Grid_Manager", "message": "..." },
        { "role": "Safety_Critic", "message": "..." },
        { "role": "Optimization_Writer", "message": "Recalculating with constraint: P_solar <= f(Fog)... New Plan: [Details]" }
      ],
      "final_action": "DISPATCH_BATTERY" | "CURTAIL_LOAD" | "BOOST_TURBINE" | "PREEMPTIVE_STORAGE"
    }

    Style Guide:
    - Internal Monologue.
    - Show the friction between Cost (Manager) and Safety/Forecast (Others).
    - Explicitly mention the math constraint shift in the Optimization_Writer log.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    const logs: AgentLog[] = data.logs.map((l: any, i: number) => ({
      id: `log-${Date.now()}-${i}`,
      timestamp: new Date(),
      role: l.role,
      message: l.message,
      status: 'neutral'
    }));

    return {
      logs,
      recommendedAction: data.final_action || "IGNORE"
    };

  } catch (error) {
    console.error("Agent simulation failed:", error);
    return {
        logs: [],
        recommendedAction: 'IGNORE'
    };
  }
};

export const generateEsgReport = async (metrics: GridMetrics): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
        Generate a professional, audit-ready ESG (Environmental, Social, and Governance) Executive Summary for the GreenGrid Smart Grid system.
        
        Data:
        - Total CO2 Avoided: ${metrics.accumulated_co2_saved} kg
        - Current Carbon Intensity: ${metrics.co2_intensity} g/kWh
        - Grid Status: Stable
        
        Format:
        Markdown. Keep it brief (3-4 sentences). Use professional tone suitable for a regulatory filing. 
        Highlight the "Predictive AI" contribution to sustainability and the specific weather adaptation logic.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return response.text || "Report generation failed.";
    } catch (e) {
        return "Error generating report.";
    }
}