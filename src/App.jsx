import { useEffect, useMemo, useState } from 'react';
import HeatmapCanvas from './components/HeatmapCanvas';
import AssistantPanel from './components/AssistantPanel';
import { defaultTranslations, loadTranslations } from './lib/i18n';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'mr', label: 'मराठी' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
  { code: 'as', label: 'অসমীয়া' }
];

const SUPPORTED_LANGUAGE_CODES = new Set(LANGUAGE_OPTIONS.map((item) => item.code));

function sanitizeLanguage(code) {
  return SUPPORTED_LANGUAGE_CODES.has(code) ? code : 'en';
}

const queues = [
  { name: 'Food Court A', wait: 18, level: 'high' },
  { name: 'Food Court B', wait: 4, level: 'low' },
  { name: 'Restroom Block 1', wait: 9, level: 'medium' },
  { name: 'Restroom Block 2', wait: 2, level: 'low' },
  { name: 'Gate 1 (Main)', wait: 14, level: 'high' }
];

const alerts = [
  { tone: 'danger', text: 'North Stand N3-N7 above 95% occupancy.' },
  { tone: 'warn', text: 'Food Court A exceeds 15 min wait.' },
  { tone: 'safe', text: 'Corridor C2 congestion resolved.' }
];

const SvgIcon = ({ d, viewBox = "0 0 24 24" }) => (
  <svg viewBox={viewBox} className="icon" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

function StatCard({ label, value, sub, tone }) {
  // Uses pure CSS for hover states setup in global.css
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <div className={`stat-value ${tone}`}>{value}</div>
      <span className="stat-sub">{sub}</span>
    </div>
  );
}

function AccordionItem({ title, data, renderItem }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`accordion ${open ? 'open' : ''}`}>
      <div className="accordion-header" onClick={() => setOpen(!open)}>
        <h3>{title}</h3>
        <svg style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </div>
      <div className="accordion-body">
        <div className="accordion-content">
          {data.map(renderItem)}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => sanitizeLanguage(localStorage.getItem('stadium_lang')));
  const [dict, setDict] = useState(defaultTranslations.en);
  const [wait, setWait] = useState(4.2);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [routeResult, setRouteResult] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  function handleRoutePlanner(e) {
    e.preventDefault();
    setRouteLoading(true);
    setRouteResult(null);

    setTimeout(() => {
      setRouteLoading(false);
      setRouteResult({
        path: 'Current Loc → Concourse C → East Stand Stairs',
        eta: '4 mins',
        status: 'Route optimized. Avoids heavy congestion.'
      });
    }, 1200);
  }

  useEffect(() => {
    let mounted = true;
    loadTranslations(lang).then((tr) => {
      if (!mounted) return;
      setDict({ ...defaultTranslations.en, ...tr });
      localStorage.setItem('stadium_lang', lang);
    });
    return () => mounted = false;
  }, [lang]);

  useEffect(() => {
    const id = setInterval(() => {
      setWait((prev) => Math.max(2.1, Math.min(8.3, prev + (Math.random() - 0.5) * 0.8)));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const t = useMemo(() => ({ ...defaultTranslations.en, ...dict }), [dict]);

  return (
    <div className="app-shell pb-nav">
      {/* Clean Sticky Header */}
      <header className="topbar">
        <h1 className="brand-title">{t.title}</h1>
        <div className="topbar-right">
          <select className="select-input" value={lang} onChange={(e) => setLang(sanitizeLanguage(e.target.value))}>
            {LANGUAGE_OPTIONS.map((item) => (
              <option key={item.code} value={item.code}>{item.label}</option>
            ))}
          </select>
          <span className="live-pill">● {t.live}</span>
        </div>
      </header>

      {/* Elegant Info Ticker */}
      <div className="ticker-wrapper">
        <div className="marquee-text">
          <span>AI routing active • Gate 4 recommended • North stand at 97% • Food Court B fastest • Restroom Block 2 clear • Safety lanes monitored live •</span>
        </div>
      </div>

      <main className="main-content">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="tab-view fade-slide-in">
            <section className="stats-grid">
              <StatCard label="Total Attendees" value="68,420" sub="of 75k capacity" tone="ok" />
              <StatCard label="Avg Wait Time" value={`${wait.toFixed(1)}m`} sub="dynamic live" tone="warn" />
              <StatCard label="Active Alerts" value="3" sub="2 crowd, 1 queue" tone="danger" />
              <StatCard label="AI Resolved" value="1,247" sub="98.2% sat." tone="accent" />
            </section>

            <article className="card map-card mt-3">
              <div className="title-row">
                <h2>{t.densityMap}</h2>
                <span className="live-text">Live 5s</span>
              </div>
              <HeatmapCanvas />
              <div className="legend">
                <span><i className="low" /> Low</span>
                <span><i className="med" /> Medium</span>
                <span><i className="high" /> High</span>
                <span><i className="gate" /> Gates</span>
              </div>
            </article>
          </div>
        )}

        {/* NAVIGATE (OCCUPANCY & ROUTE) TAB */}
        {activeTab === 'navigate' && (
          <div className="tab-view fade-slide-in">
            <article className="card occupancy-card">
              <h2>{t.occupancy}</h2>
              <div className="ring-wrap">
                <div className="ring-border">
                  <span className="ring-val">91<small>%</small></span>
                </div>
              </div>
              <div className="pill-grid">
                <span className="pill high">North 97%</span>
                <span className="pill med">South 72%</span>
                <span className="pill low">East 45%</span>
                <span className="pill med">West 68%</span>
              </div>
            </article>

            <article className="card mt-3">
              <AccordionItem
                title={t.queueTimes}
                data={queues}
                renderItem={(q) => (
                  <div className="queue-row" key={q.name}>
                    <span className="queue-name">{q.name}</span>
                    <div className="bar">
                      <div className={`fill ${q.level}`} style={{ width: `${Math.min(100, q.wait * 5)}%` }} />
                    </div>
                    <strong>{q.wait}m</strong>
                  </div>
                )}
              />
            </article>

            <article className="card mt-3">
              <AccordionItem
                title={t.alerts}
                data={alerts}
                renderItem={(a) => (
                  <div key={a.text} className={`alert ${a.tone}`}>
                    {a.text}
                  </div>
                )}
              />
            </article>

            <article className="card mt-3">
              <h2>{t.routePlanner}</h2>
              <form className="route-form" onSubmit={handleRoutePlanner}>
                <select className="input-field"><option>From: Current Location</option><option>Gate 1</option></select>
                <input className="input-field" placeholder="Seat (e.g. N5-R12-S24)" required />
                <button className="btn-primary" disabled={routeLoading}>
                  {routeLoading ? 'Calculating...' : (t.routePlanner || "Find Optimal Route")}
                </button>
              </form>
              {routeResult && (
                <div className="alert safe" style={{ marginTop: '16px', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <strong style={{ display: 'block', fontSize: '1.05rem', marginBottom: '4px' }}>ETA: {routeResult.eta}</strong>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.7)', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.05)', width: '100%', marginBottom: '4px' }}>
                    {routeResult.path}
                  </div>
                  <small style={{ fontWeight: 600 }}>{routeResult.status}</small>
                </div>
              )}
            </article>
          </div>
        )}

        {/* ASSISTANT AGENT TAB */}
        {activeTab === 'assistant' && (
          <div className="tab-view fade-slide-in height-auto">
            <div className="card agent-card" style={{ padding: 0, boxShadow: 'none', background: 'transparent', border: 'none' }}>
              <AssistantPanel t={t} lang={lang} />
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <nav className="bottom-nav glass-nav">
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <SvgIcon d="M3 3v18h18 M9 15l3-3 4 4 5-5" />
          <span>Dashboard</span>
        </button>
        <button className={`nav-item ${activeTab === 'navigate' ? 'active' : ''}`} onClick={() => setActiveTab('navigate')}>
          <SvgIcon d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
          <span>Navigate</span>
        </button>
        <button className={`nav-item ${activeTab === 'assistant' ? 'active' : ''}`} onClick={() => setActiveTab('assistant')}>
          <SvgIcon d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          <span>Agent</span>
        </button>
      </nav>
    </div>
  );
}
