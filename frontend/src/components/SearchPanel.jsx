/**
 * FilterStrip — §5.1 sticky filter strip
 * "🔋 42%  CCS2 ▾  2.1 km ▾" — the PRD's wireframe
 * §3: Copper primary button. §8: 44px min touch targets.
 * §10: "Navigate" not "Go." Buttons say what they do.
 */

import React from 'react';

const PRESET_LOCATIONS = [
  { label: 'SJCEM Palghar', lat: 19.6967, lng: 72.7699 },
  { label: 'Thane Viviana', lat: 19.2087, lng: 72.9719 },
  { label: 'BKC Mumbai', lat: 19.0657, lng: 72.8682 },
  { label: 'Andheri WEH', lat: 19.1197, lng: 72.8576 },
  { label: 'Manor NH48', lat: 19.7421, lng: 72.9125 },
  { label: 'Vashi Inorbit', lat: 19.0652, lng: 72.9984 },
];

const CONNECTORS = ['Any', 'CCS2', 'Type 2', 'CHAdeMO', 'Bharat DC-001'];

// Estimated safe driving range from battery %
const estimatedRange = (pct) => Math.round((pct / 100) * 280);

export default function FilterStrip({
  location, setLocation,
  batteryPct, setBatteryPct,
  connectorType, setConnectorType,
  radiusKm, setRadiusKm,
  onSearch, loading,
}) {
  const range = estimatedRange(batteryPct);
  const batteryLow = batteryPct <= 20;

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ label: 'GPS Location', lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) }),
      () => {},
    );
  };

  return (
    <div
      style={{
        background: 'var(--slate)',
        borderBottom: '1px solid var(--slate-border)',
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Row 1: location + GPS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <select
          value={`${location.lat},${location.lng}`}
          onChange={(e) => {
            const [lat, lng] = e.target.value.split(',').map(Number);
            const found = PRESET_LOCATIONS.find(p => p.lat === lat && p.lng === lng);
            setLocation(found ?? { label: 'Custom', lat, lng });
          }}
          style={{
            flex: 1,
            minWidth: '160px',
            background: 'var(--slate-dim)',
            border: '1px solid var(--slate-border)',
            borderRadius: 'var(--radius-chip)',
            color: 'var(--fog)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            padding: '7px 10px',
            outline: 'none',
            cursor: 'pointer',
          }}
          aria-label="Select origin location"
        >
          {PRESET_LOCATIONS.map((p) => (
            <option key={p.label} value={`${p.lat},${p.lng}`}>{p.label}</option>
          ))}
        </select>

        <button
          onClick={handleGPS}
          className="btn btn-ghost"
          style={{ padding: '7px 12px', fontSize: '0.78rem', minHeight: '34px' }}
          aria-label="Use GPS location"
        >
          📍 GPS
        </button>
      </div>

      {/* Row 2: Battery slider — §8 data in IBM Plex Mono */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--fog-muted)' }}>
            🔋 Battery
          </label>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.82rem', color: batteryLow ? 'var(--signal-red)' : 'var(--volt-cyan)', fontWeight: 500 }}>
            {batteryPct}% &nbsp;·&nbsp; ~{range} km
          </span>
        </div>
        <input
          type="range"
          min="5" max="100" step="5"
          value={batteryPct}
          onChange={(e) => setBatteryPct(+e.target.value)}
          style={{ width: '100%', accentColor: batteryLow ? 'var(--signal-red)' : 'var(--copper)', cursor: 'pointer' }}
          aria-label={`Battery level: ${batteryPct}%`}
        />
      </div>

      {/* Row 3: Connector chips + Radius + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {CONNECTORS.map((c) => {
          const active = (c === 'Any' && !connectorType) || connectorType === c;
          return (
            <button
              key={c}
              onClick={() => setConnectorType(c === 'Any' ? '' : c)}
              className={`chip${active ? ' chip--active' : ''}`}
              aria-pressed={active}
            >
              {c}
            </button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--fog-muted)', whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: 'var(--font-data)' }}>{radiusKm} km</span> radius
          </label>
          <input
            type="range"
            min="10" max="80" step="5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(+e.target.value)}
            style={{ width: '70px', accentColor: 'var(--copper)' }}
            aria-label={`Search radius: ${radiusKm} km`}
          />
        </div>

        <button
          onClick={onSearch}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.82rem', minHeight: '34px' }}
          id="find-stations-btn"
        >
          {loading ? 'Searching…' : 'Find Stations'}
        </button>
      </div>
    </div>
  );
}
