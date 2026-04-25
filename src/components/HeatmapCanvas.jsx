import { useEffect, useState } from 'react';

// Get color based on density for Light Theme Professional look
function getDensityColor(density) {
  if (density < 0.4) return 'rgba(16, 185, 129, 0.7)'; // Emerald (OK)
  if (density < 0.7) return 'rgba(245, 158, 11, 0.7)'; // Amber (Warn)
  return 'rgba(239, 68, 68, 0.75)'; // Red (Danger)
}

export default function HeatmapCanvas() {
  const [data, setData] = useState({
    zones: [
      { id: 'N', x: 200, y: 60, d: 0.95, label: 'N' },
      { id: 'S', x: 200, y: 240, d: 0.66, label: 'S' },
      { id: 'E', x: 320, y: 150, d: 0.44, label: 'E' },
      { id: 'W', x: 80, y: 150, d: 0.62, label: 'W' },
      { id: 'NE', x: 290, y: 80, d: 0.79, label: 'NE' },
      { id: 'NW', x: 110, y: 80, d: 0.82, label: 'NW' },
      { id: 'SE', x: 290, y: 220, d: 0.53, label: 'SE' },
      { id: 'SW', x: 110, y: 220, d: 0.39, label: 'SW' }
    ],
    gates: [
      { id: 'g1', x: 200, y: 20, label: 'Gate 1', color: '#ef4444' }, // Congested
      { id: 'g2', x: 370, y: 150, label: 'Gate 2', color: '#3b82f6' }, // Flowing
      { id: 'g3', x: 200, y: 280, label: 'Gate 3', color: '#3b82f6' }, // Flowing
      { id: 'g4', x: 30, y: 150, label: 'Gate 4', color: '#10b981' }   // Clear
    ]
  });

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        ...prev,
        zones: prev.zones.map(z => ({
          ...z,
          d: Math.max(0.1, Math.min(0.99, z.d + (Math.random() - 0.5) * 0.15))
        }))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="heatmap-container" style={{ position: 'relative', width: '100%', aspectRatio: '4/3', minHeight: '200px' }}>
      <svg
        viewBox="0 0 400 300"
        style={{ width: '100%', height: '100%', dropShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
      >
        <defs>
          {/* Soft blur for heatmap zones */}
          <filter id="heat-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Subtle grid pattern for the pitch */}
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* --- STADIUM WIREFRAME ARCHITECTURE --- */}
        {/* Outer Grounds Layer */}
        <rect x="25" y="15" width="350" height="270" rx="100" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />

        {/* Inner Concourse boundary */}
        <rect x="60" y="40" width="280" height="220" rx="75" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Field Area (Pitch) */}
        <rect x="130" y="80" width="140" height="140" rx="20" fill="url(#grid)" stroke="#94a3b8" strokeWidth="2" />

        {/* Center circle and line */}
        <circle cx="200" cy="150" r="25" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="130" y1="150" x2="270" y2="150" stroke="#94a3b8" strokeWidth="1.5" />

        {/* Goal Boxes */}
        <rect x="175" y="80" width="50" height="20" fill="none" stroke="#94a3b8" strokeWidth="1" />
        <rect x="175" y="200" width="50" height="20" fill="none" stroke="#94a3b8" strokeWidth="1" />

        {/* --- HEATMAP OVERLAYS --- */}
        <g filter="url(#heat-blur)">
          {data.zones.map(zone => (
            <circle
              key={zone.id}
              cx={zone.x}
              cy={zone.y}
              r={15 + (zone.d * 20)} // Size pulses with density
              fill={getDensityColor(zone.d)}
              style={{ transition: 'all 1.5s ease' }}
            />
          ))}
        </g>

        {/* --- LABELS AND DATA PILLS --- */}
        {data.zones.map(zone => (
          <g key={`lbl-${zone.id}`} transform={`translate(${zone.x}, ${zone.y})`} style={{ transition: 'all 1.5s ease' }}>
            <rect x="-16" y="-10" width="32" height="20" rx="4" fill="rgba(255,255,255,0.9)" stroke="#e2e8f0" strokeWidth="1" />
            <text x="0" y="3" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="700" fill="#334155" textAnchor="middle" dominantBaseline="middle">
              {Math.round(zone.d * 100)}%
            </text>
            <text x="0" y="-16" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="600" fill="#64748b" textAnchor="middle">
              {zone.label}
            </text>
          </g>
        ))}

        {/* --- GATES (ENTRY/EXIT POINTS) --- */}
        {data.gates.map(gate => (
          <g key={gate.id}>
            {/* Gate pulsating ring */}
            <circle cx={gate.x} cy={gate.y} r="12" fill={gate.color} opacity="0.15">
              <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            {/* Gate core dot */}
            <circle cx={gate.x} cy={gate.y} r="5" fill="#fff" stroke={gate.color} strokeWidth="2" />
            {/* Gate label background */}
            <rect
              x={gate.x - 24}
              y={gate.y > 150 ? gate.y + 8 : gate.y - 20}
              width="48" height="14" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1"
            />
            {/* Gate label text */}
            <text
              x={gate.x}
              y={gate.y > 150 ? gate.y + 17 : gate.y - 11}
              fontSize="8" fontFamily="Inter, sans-serif" fontWeight="600" fill={gate.color} textAnchor="middle"
            >
              {gate.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
