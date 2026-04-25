export const defaultTranslations = {
  en: {
    dashboard: 'Dashboard',
    navigate: 'Navigate',
    assistant: 'Assistant',
    title: 'Stadium Operations Hub',
    subtitle: 'AI-Powered Venue Intelligence',
    live: 'Live',
    densityMap: 'Live Crowd Density Map',
    occupancy: 'Venue Occupancy',
    queueTimes: 'Real-Time Queue Times',
    alerts: 'Active Alerts',
    routePlanner: 'Smart Route Planner',
    chatTitle: 'Stadium Assistant',
    chatPlaceholder: "Ask: nearest restroom, fastest exit, shortest queue...",
    send: 'Send',
    saveKey: 'Save Gemini Key',
    typing: 'Thinking...'
  }
};

export async function loadTranslations(lang) {
  const safeLang = lang || 'en';
  try {
    const res = await fetch(`/lang/${safeLang}.json`);
    if (!res.ok) throw new Error('missing language file');
    return await res.json();
  } catch {
    return defaultTranslations.en;
  }
}
