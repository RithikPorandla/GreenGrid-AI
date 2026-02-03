import { GridMetrics } from '../types';

// EIA API Configuration
// Using ERCOT (Texas) as it has a dynamic mix of Wind, Solar, and Fossil Fuels.
const RESPONDENT = 'TEX'; 
const BASE_URL = 'https://api.eia.gov/v2/electricity/rto/fuel-type-data/data';

interface EiaRecord {
    period: string;
    respondent: string;
    respondent_name: string;
    fueltype: string;
    type_name: string;
    value: number; // MWh
    "value-units": string;
}

interface EiaResponse {
    response: {
        data: EiaRecord[];
    }
}

// Map EIA Fuel codes to our internal categories
const FUEL_MAP: Record<string, 'SOLAR' | 'WIND' | 'GRID' | 'IGNORE'> = {
    'SUN': 'SOLAR',
    'WND': 'WIND',
    'NG': 'GRID',  // Natural Gas
    'COL': 'GRID', // Coal
    'NUC': 'GRID', // Nuclear
    'WAT': 'GRID', // Hydro
    'OTH': 'GRID', // Other
};

// Estimated Carbon Intensity (g/kWh) for EIA fuel types (Simplification)
const CO2_FACTORS: Record<string, number> = {
    'SUN': 40,
    'WND': 11,
    'NG': 450,
    'COL': 820,
    'NUC': 12,
    'WAT': 24,
    'OTH': 500
};

export const fetchEiaGridData = async (apiKey: string): Promise<Partial<GridMetrics> | null> => {
    if (!apiKey) {
        console.warn("No EIA API Key provided.");
        return null;
    }

    try {
        // Fetch the last hour of data for Texas (ERCOT)
        // We fetch a bit more (length=30) to ensure we get a full set of fuel types for the latest timestamp
        const url = `${BASE_URL}?api_key=${apiKey}&frequency=local-hourly&data[0]=value&facets[respondent][]=${RESPONDENT}&sort[0][column]=period&sort[0][direction]=desc&length=30`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`EIA API Error: ${response.status} ${response.statusText}`);
        }

        const json: EiaResponse = await response.json();
        const data = json.response.data;

        if (!data || data.length === 0) return null;

        // Group by period to find the absolute latest complete set
        // The API returns flattened records.
        const latestPeriod = data[0].period;
        const currentRecords = data.filter(d => d.period === latestPeriod);

        let solarMwh = 0;
        let windMwh = 0;
        let gridMwh = 0;
        let totalMwh = 0;
        let weightedCo2 = 0;

        currentRecords.forEach(record => {
            const category = FUEL_MAP[record.fueltype] || 'GRID';
            const val = record.value || 0;
            const co2Factor = CO2_FACTORS[record.fueltype] || 400;

            if (category === 'SOLAR') solarMwh += val;
            else if (category === 'WIND') windMwh += val;
            else if (category === 'GRID') gridMwh += val;

            totalMwh += val;
            weightedCo2 += (val * co2Factor);
        });

        if (totalMwh === 0) return null;

        // Normalization
        // The real grid is massive (GWs). The dashboard simulates a Microgrid (kW).
        // We normalize the mix so the Total Load equals approx 1000 kW for visualization consistency.
        const TARGET_SCALE = 1000;
        const scaleFactor = TARGET_SCALE / totalMwh;

        return {
            solar_power: solarMwh * scaleFactor,
            wind_power: windMwh * scaleFactor,
            grid_supply: gridMwh * scaleFactor,
            load_demand: totalMwh * scaleFactor,
            co2_intensity: weightedCo2 / totalMwh,
            isRealTime: true
        };

    } catch (error) {
        console.error("Failed to fetch EIA Data:", error);
        return null;
    }
};