# Stadium AI Dashboard 🏟️

**🌍 Live Demo:** [https://stadium-sync-734405091711.us-central1.run.app/](https://stadium-sync-734405091711.us-central1.run.app/)

A high-end, real-time AI dashboard for optimizing fan journeys, crowd density, and safety inside a stadium. Features a sleek, modern Light Theme UI built with React, Vite, and Google Gemini API integration.

## ✨ Features

- **Smart Route Planner:** Real-time routing algorithm simulation considering active gate congestion and crowd bottlenecks.
- **Dynamic SVGs Density Map:** A vector-based architectural stadium blueprint overlaying React-driven Gaussian blur heat-maps to visualize live occupancy.
- **AI Agent Chat:** Integrated full-context AI assistant powered by Google Gemini (e.g. `gemini-2.5-flash`), delivering multi-language support (English, Hindi, Bengali, Tamil, etc.).
- **Live Data Visualizations:** Real-time ticket scanning throughput, wait times, and alerts using fluid CSS transitions.
- **Premium Light Theme:** Architected around iOS/Material 3 mobile app paradigms leveraging subtle depth shadows, tactile scaling interactions, and crisp responsive grid containers.

## 🚀 Getting Started

### Local Development

1. Install dependencies:
   ```sh
   npm install
   ```

2. Create a `.env` file in the root based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_google_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

3. Start the Vite frontend and Express server concurrently:
   ```sh
   npm run dev
   ```

### ☁️ Cloud Deployment

This app can be deployed quickly to **Google Cloud Run** using source deployment.

1. Authenticate with gcloud:
   ```sh
   gcloud auth application-default login
   ```
2. Trigger source deploy (ensure you accept Buildpacks logic):
   ```sh
   gcloud run deploy stadium-sync --source . --allow-unauthenticated
   ```
3. Securely inject your API key into your service variables:
   ```sh
   gcloud run services update stadium-sync --update-env-vars="GEMINI_API_KEY=your_key"
   ```

## 🛠️ Stack

- **Frontend:** React, Vite, Vanilla CSS 
- **Backend:** Node.js, Express.js
- **AI Core:** Google Vertex / Generative Language API
