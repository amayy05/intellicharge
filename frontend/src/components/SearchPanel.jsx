import React from 'react';

const PRESET_LOCATIONS = [
  { label: '🎓 SJCEM Palghar Campus', lat: 19.6967, lng: 72.7699, region: 'Palghar' },
  { label: '🛍️ Viviana Mall (Thane)', lat: 19.2087, lng: 72.9719, region: 'Thane' },
  { label: '💼 BKC Financial Hub (Mumbai)', lat: 19.0657, lng: 72.8682, region: 'Mumbai' },
  { label: '🚇 Andheri WEH Metro (Mumbai)', lat: 19.1197, lng: 72.8576, region: 'Mumbai' },
];

const CONNECTOR_OPTIONS = ['All', 'CCS2', 'Type 2', 'CHAdeMO', 'Bharat DC-001'];

export default function SearchPanel({
  location,
  setLocation,
  batteryPct,
  setBatteryPct,
  connectorType,
  setConnectorType,
  radiusKm,
  setRadiusKm,
  onSearch,
  loading,
}) {
  const estimatedRangeKm = Math.round((batteryPct / 100) * 320);

  const getBatteryColor = (pct) => {
    if (pct > 20) return 'var(--primary-accent)';
    if (pct > 10) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Battery / Car Overview Card - DARK THEME */}
      <div className="card" style={{ background: 'var(--bg-dark-card)', color: 'var(--text-light)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Battery Health
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <h2 style={{ fontSize: '36px', margin: 0, fontWeight: '400' }}>{batteryPct}<span style={{ fontSize: '24px' }}>%</span></h2>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--primary-accent)' }}>Working on high quality</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Remaining
            </span>
            <div style={{ marginTop: '4px' }}>
              <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '500' }}>{estimatedRangeKm} km</h2>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Out of 320km</span>
          </div>
        </div>
        
        {/* Battery visual bar (Segmented) */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', height: '40px', width: '100%' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              style={{
                flex: 1,
                background: (i * 20) < batteryPct ? getBatteryColor(batteryPct) : 'rgba(255,255,255,0.1)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '4px'
              }}
            >
              {(i * 20) < batteryPct && <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#0A1410' }}>{(i+1)*20}%</span>}
            </div>
          ))}
        </div>
        
        {/* Hidden input to allow changing battery for demo purposes */}
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={batteryPct}
          onChange={(e) => setBatteryPct(Number(e.target.value))}
          style={{ width: '100%', opacity: 0.2 }}
        />
      </div>

      {/* Destination / Search Params Card */}
      <div className="card">
        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
          Origin Location
        </label>
        <select
          value={`${location.lat},${location.lng}`}
          onChange={(e) => {
            const [latStr, lngStr] = e.target.value.split(',');
            const matched = PRESET_LOCATIONS.find((p) => p.lat === Number(latStr) && p.lng === Number(lngStr));
            if (matched) setLocation(matched);
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-input)',
            color: 'var(--text-dark)',
            fontSize: '14px',
            outline: 'none',
            fontWeight: '500',
            marginBottom: '16px'
          }}
        >
          {PRESET_LOCATIONS.map((preset, idx) => (
            <option key={idx} value={`${preset.lat},${preset.lng}`}>
              {preset.label}
            </option>
          ))}
        </select>
        
        {/* Connector Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
            Connector Type
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CONNECTOR_OPTIONS.map(c => (
              <button
                key={c}
                onClick={() => setConnectorType(c)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${connectorType === c ? 'var(--primary-accent)' : 'var(--border-color)'}`,
                  background: connectorType === c ? 'rgba(40, 168, 121, 0.1)' : 'transparent',
                  color: connectorType === c ? 'var(--primary-accent)' : 'var(--text-secondary)',
                  fontWeight: '600',
                  fontSize: '12px'
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Search Radius Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Search Radius</label>
            <span style={{ fontSize: '13px', color: 'var(--primary-accent)', fontWeight: '600' }}>{radiusKm} km</span>
          </div>
          <input
            type="range"
            min="10"
            max="80"
            step="5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary-accent)', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Main AI CTA */}
      <button
        onClick={onSearch}
        disabled={loading}
        className="btn-primary"
        style={{ padding: '20px', flexDirection: 'column', gap: '4px', opacity: loading ? 0.7 : 1 }}
      >
        <span style={{ fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {loading ? 'Finding Nearest Stations...' : 'Get Started'}
        </span>
      </button>
      <p style={{ textAlign: 'center', fontSize: '12px', margin: 0, color: 'var(--text-muted)' }}>
        AI-powered recommendation based on distance, compatibility & predicted wait.
      </p>

    </div>
  );
}
