/**
 * FilterStrip — §5.1 sticky filter strip
 * "🔋 42%  CCS2 ▾  2.1 km ▾" — PRD §5.1 wireframe
 * Compact single-row design on desktop, stacks on mobile.
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

export default function FilterStrip({
  location, setLocation,
  batteryPct, setBatteryPct,
  connectorType, setConnectorType,
  radiusKm, setRadiusKm,
  onSearch, loading,
}) {
  const batteryLow = batteryPct <= 20;
  const range = Math.round((batteryPct / 100) * 280);

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) =>
      setLocation({ label: 'GPS', lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) })
    );
  };

  return (
    <div style={{ background: 'var(--slate)', borderBottom: '1px solid var(--slate-border)', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* Row 1: Location + GPS + Find */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <select
          value={`${location.lat},${location.lng}`}
          onChange={(e) => {
            const [lat, lng] = e.target.value.split(',').map(Number);
            const found = PRESET_LOCATIONS.find(p => p.lat === lat && p.lng === lng);
            setLocation(found ?? { label: 'Custom', lat, lng });
          }}
          style={{
            flex: 1, background: 'var(--slate-dim)', border: '1px solid var(--slate-border)',
            borderRadius: 'var(--radius-chip)', color: 'var(--fog)',
            fontFamily: 'var(--font-body)', fontSize: '0.82rem',
            padding: '6px 10px', outline: 'none', cursor: 'pointer',
          }}
          aria-label="Select origin location"
        >
          {PRESET_LOCATIONS.map((p) => (
            <option key={p.label} value={`${p.lat},${p.lng}`}>{p.label}</option>
          ))}
        </select>

        <button onClick={handleGPS} className="btn btn-ghost"
          style={{ padding: '6px 10px', fontSize: '0.75rem', minHeight: '32px', whiteSpace: 'nowrap' }}
          aria-label="Use GPS">
          📍 GPS
        </button>

        <button onClick={onSearch} disabled={loading} className="btn btn-primary"
          style={{ padding: '6px 14px', fontSize: '0.82rem', minHeight: '32px', whiteSpace: 'nowrap' }}
          id="find-stations-btn">
          {loading ? '…' : 'Find'}
        </button>
      </div>

      {/* Row 2: Battery inline + Connectors */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

        {/* Battery % pill + slider inline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--fog-dim)' }}>🔋</span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.78rem', color: batteryLow ? 'var(--signal-red)' : 'var(--volt-cyan)', fontWeight: 500, minWidth: '30px' }}>
            {batteryPct}%
          </span>
          <input type="range" min="5" max="100" step="5" value={batteryPct}
            onChange={(e) => setBatteryPct(+e.target.value)}
            style={{ width: '80px', accentColor: batteryLow ? 'var(--signal-red)' : 'var(--copper)' }}
            aria-label={`Battery: ${batteryPct}%`} />
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.72rem', color: 'var(--fog-dim)' }}>
            ~{range}km
          </span>
        </div>

        {/* Connector chips */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', flex: 1 }}>
          {CONNECTORS.map((c) => {
            const active = (c === 'Any' && !connectorType) || connectorType === c;
            return (
              <button key={c} onClick={() => setConnectorType(c === 'Any' ? '' : c)}
                className={`chip${active ? ' chip--active' : ''}`}
                style={{ padding: '4px 9px', minHeight: '28px', fontSize: '0.73rem' }}
                aria-pressed={active}>
                {c}
              </button>
            );
          })}
        </div>

        {/* Radius */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.72rem', color: 'var(--fog-dim)' }}>{radiusKm}km</span>
          <input type="range" min="10" max="80" step="5" value={radiusKm}
            onChange={(e) => setRadiusKm(+e.target.value)}
            style={{ width: '55px', accentColor: 'var(--copper)' }}
            aria-label={`Radius: ${radiusKm}km`} />
        </div>
      </div>
    </div>
  );
}
