# GreenGrid AI Optimizer ⚡🌱

**GreenGrid AI Optimizer** is a production-grade **Autonomous Smart Grid SaaS Dashboard**. It combines a physics-based microgrid simulation with real-time external data (U.S. EIA & Electricity Maps) and uses **Google Gemini 3 Multi-Agent AI** to perform autonomous grid stabilization and anomaly resolution.

## 🚀 High-Level Overview

This application acts as a "Digital Twin" for a renewable energy microgrid. It visualizes the flow of energy between Solar, Wind, Grid (Fossil), and Battery Storage.

Unlike standard dashboards that just *show* data, GreenGrid **acts** on it. When anomalies occur (Voltage drops, Frequency deviations, Load spikes), a team of AI Agents negotiates a solution in real-time to stabilize the grid based on your configured priorities (Profit vs. ESG).

---

## ✨ Key Features

### 1. Hybrid Simulation Engine
The app runs a continuous physics loop (`services/gridSimulation.ts`) that calculates:
*   **Voltage Physics:** Simulates voltage sags under high load or low generation.
*   **Frequency (Hz):** Simulates grid frequency stability (50Hz target).
*   **Carbon Intensity:** Calculates real-time CO2 impact based on the generation mix.

### 2. Multi-Agent AI System (Gemini 3)
When a threshold is breached, the system triggers a **Multi-Agent Debate** using the Google Gemini API. The agents act as distinct personas:
*   **Grid_Manager 💼:** Maximizes profit and minimizes operating costs.
*   **Safety_Critic 🛡️:** Enforces strict physics constraints (Voltage > 210V, Freq 50Hz ±0.5).
*   **Weather_Forecaster ☁️:** Predicts future generation drops (e.g., "Fog Incoming") and demands pre-emptive action.
*   **Optimization_Writer 📝:** Synthesizes the debate into a final JSON dispatch command (e.g., `DISPATCH_BATTERY`).

### 3. Real-Time Data Integration
The dashboard can switch between three data modes:
*   **Physics Simulation:** Uses Perlin noise and math functions to simulate chaos.
*   **Electricity Maps API:** Fetches live Carbon Intensity and generation mix from **CAISO (California)**.
*   **U.S. EIA Open Data API:** Fetches real-time hourly fuel mix data from **ERCOT (Texas)**.
    *   *Note:* Real-world GW (Gigawatt) scale data is normalized to kW (Kilowatt) scale to fit the microgrid visualization while preserving the energy mix percentages.

### 4. Interactive Control Plane
*   **Pareto Optimization Slider:** Adjusts the AI's "Bias" between **Economic Priority** (Cheap/Dirty) and **Ecological Priority** (Green/Expensive).
*   **Threshold Controls:** Manually set trigger points for Voltage, Load, Frequency Deviation, and Max CO2 Intensity.
*   **Digital Twin Map:** An SVG visualization showing active power flow and stress points.

---

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS (Glassmorphism UI)
*   **AI Model:** Google Gemini 1.5/2.0 Flash (`@google/genai` SDK)
*   **Visualization:** Recharts (Area Charts), Custom SVG Maps
*   **Icons:** Lucide React

---

## 🧠 The AI Agent Workflow

1.  **Anomaly Detection:** The main loop detects a violation (e.g., Voltage < 209V).
2.  **Context Injection:** The system captures the current state (Load, Solar Output, Weather Forecast) and the User's Optimization Bias.
3.  **Prompt Engineering:** A structured prompt is sent to Gemini, defining the personas and the math constraints.
4.  **Negotiation:** The model generates a conversation log where agents argue.
    *   *Example:* The Safety Critic might reject the Grid Manager's plan to buy cheap coal power because it violates the new CO2 threshold.
5.  **Execution:** The AI returns a `recommendedAction` (e.g., `PREEMPTIVE_STORAGE`) which is fed back into the simulation loop to physically alter the grid state.

---

## 🔌 API Integrations

### Electricity Maps
*   **Endpoint:** `api.electricitymap.org/v3/power-breakdown/latest`
*   **Usage:** Provides global standard carbon intensity data.
*   **Auth:** Requires an API Key (User input in UI).

### U.S. Energy Information Administration (EIA)
*   **Endpoint:** `api.eia.gov/v2/electricity/rto/fuel-type-data`
*   **Usage:** Provides granular fuel-mix data (Coal vs. Gas vs. Wind).
*   **Auth:** Requires an EIA v2 API Key (User input in UI).

---

## 🚦 Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Setup:**
    Ensure you have a Google Gemini API Key. The app expects `process.env.API_KEY` for the AI agents to function.
    ```bash
    export API_KEY="your_gemini_key_here"
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
