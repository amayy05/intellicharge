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

  const getBatteryStatus = (pct) => {
    if (pct >= 70) {
      return {
        label: 'Optimal Condition (High)',
        color: '#34D399',
        textColor: '#A7F3D0',
        gradient: 'linear-gradient(180deg, #34D399 0%, #059669 100%)',
        border: '#6EE7B7',
        shadow: 'rgba(52, 211, 153, 0.35)',
        accent: '#34D399',
      };
    }
    if (pct >= 40) {
      return {
        label: 'Good Range (Normal)',
        color: '#2DD4BF',
        textColor: '#99F6E4',
        gradient: 'linear-gradient(180deg, #2DD4BF 0%, #0D9488 100%)',
        border: '#5EEAD4',
        shadow: 'rgba(45, 212, 191, 0.35)',
        accent: '#2DD4BF',
      };
    }
    if (pct >= 20) {
      return {
        label: 'Moderate (Recharge Recommended)',
        color: '#FBBF24',
        textColor: '#FDE68A',
        gradient: 'linear-gradient(180deg, #FBBF24 0%, #D97706 100%)',
        border: '#FCD34D',
        shadow: 'rgba(251, 191, 36, 0.35)',
        accent: '#FBBF24',
      };
    }
    return {
      label: 'Critical Low Battery',
      color: '#EF4444',
      textColor: '#FECACA',
      gradient: 'linear-gradient(180deg, #EF4444 0%, #B91C1C 100%)',
      border: '#F87171',
      shadow: 'rgba(239, 68, 68, 0.5)',
      accent: '#EF4444',
    };
  };

  const status = getBatteryStatus(batteryPct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Battery / Car Overview Card - DARK THEME WITH DYNAMIC STATE */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(145deg, #0f241a 0%, #06110c 100%)',
          color: '#F9FAFB',
          border: `1px solid ${status.border}44`,
          boxShadow: `0 12px 32px rgba(0, 0, 0, 0.3), 0 0 20px ${status.shadow}`,
          transition: 'all 0.4s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span
              style={{
                fontSize: '11px',
                color: '#6EE7B7',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                display: 'block',
              }}
            >
              Battery Health
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '38px', fontWeight: '700', color: '#FFFFFF', lineHeight: 1 }}>
                {batteryPct}
              </span>
              <span style={{ fontSize: '22px', fontWeight: '600', color: status.color }}>%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: status.color,
                  boxShadow: `0 0 10px ${status.color}`,
                  transition: 'all 0.3s ease',
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: '600', color: status.textColor, transition: 'color 0.3s ease' }}>
                {status.label}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '11px',
                color: '#9CA3AF',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                display: 'block',
              }}
            >
              Remaining Range
            </span>
            <div style={{ marginTop: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', lineHeight: 1 }}>
                {estimatedRangeKm} <span style={{ fontSize: '14px', fontWeight: '500', color: status.color }}>km</span>
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>
              Est. Max 320 km
            </span>
          </div>
        </div>

        {/* Battery visual bar (Segmented) */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', height: '36px', width: '100%' }}>
          {Array.from({ length: 5 }).map((_, i) => {
            const isFilled = (i * 20) < batteryPct;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: isFilled
                    ? status.gradient
                    : 'rgba(255, 255, 255, 0.08)',
                  border: isFilled
                    ? `1px solid ${status.border}`
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isFilled ? `0 0 12px ${status.shadow}` : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {isFilled && (
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#06281b' }}>
                    {(i + 1) * 20}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Interactive slider to adjust battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <span style={{ fontSize: '10px', color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Adjust SoC:</span>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={batteryPct}
            onChange={(e) => setBatteryPct(Number(e.target.value))}
            style={{ flex: 1, accentColor: status.color, cursor: 'pointer', height: '4px' }}
          />
        </div>
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
