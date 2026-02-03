import { GridMetrics } from '../types';

// California ISO Zone as default
const DEFAULT_ZONE = 'US-CAL-CISO'; 

export interface ElectricityMapsResponse {
  zone: string;
  carbonIntensity: number;
  datetime: string;
  powerProductionBreakdown: {
    [key: string]: number | null;
  };
  powerConsumptionBreakdown: {
    [key: string]: number | null;
  };
}

export const fetchLiveGridData = async (apiKey: string, zone: string = DEFAULT_ZONE): Promise<Partial<GridMetrics> | null> => {
  if (!apiKey) {
     console.warn("No Electricity Maps API Key provided.");
     return null;
  }

  try {
    const response = await fetch(`https://api.electricitymap.org/v3/power-breakdown/latest?zone=${zone}`, {
      method: 'GET',
      headers: {
        'auth-token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data: ElectricityMapsResponse = await response.json();

    // Map API data to our GridMetrics structure
    // Note: API returns MW, we might need to scale or treat as kW for our dashboard consistency.
    // For this app, we'll treat the raw numbers as "units" that fit our chart scale (approx 0-1000 range).
    // If real grid data is in GW/MW (thousands), we scale it down to fit the "Microgrid" simulation feel.
    
    const breakdown = data.powerProductionBreakdown;
    
    const solar = breakdown.solar || 0;
    const wind = breakdown.wind || 0;
    
    // Sum up everything else as "Grid Supply" (Baseload + Peaker)
    const otherSources = [
      breakdown.nuclear,
      breakdown.geothermal,
      breakdown.biomass,
      breakdown.coal,
      breakdown.gas,
      breakdown.hydro,
      breakdown.oil,
      breakdown.unknown
    ];
    
    const gridSupply = otherSources.reduce((acc, val) => (acc || 0) + (val || 0), 0) || 0;

    // Calculate total for relative load
    const totalGen = solar + wind + gridSupply;
    
    // Scale down huge grid numbers (MW) to our Microgrid dashboard scale (kW)
    // Assuming typical ISO output is ~30,000 MW. We want ~500-1000 kW.
    // Scaling factor approx 0.02
    const SCALE = 0.05; 

    return {
      solar_power: solar * SCALE,
      wind_power: wind * SCALE,
      grid_supply: gridSupply * SCALE,
      load_demand: totalGen * SCALE, // Assume load matches generation roughly in real-time
      co2_intensity: data.carbonIntensity || 0,
      isRealTime: true
    };

  } catch (error) {
    console.error("Failed to fetch Electricity Maps data:", error);
    return null;
  }
};