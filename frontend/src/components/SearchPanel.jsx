import React from 'react';
import { MapPin, BatteryCharging, Gauge, Navigation2, SlidersHorizontal, RefreshCw } from 'lucide-react';

const PRESET_LOCATIONS = [
  { label: '🎓 SJCEM Palghar Campus', lat: 19.6967, lng: 72.7699, region: 'Palghar' },
  { label: '🛍️ Viviana Mall (Thane)', lat: 19.2087, lng: 72.9719, region: 'Thane' },
  { label: '💼 BKC Financial Hub (Mumbai)', lat: 19.0657, lng: 72.8682, region: 'Mumbai' },
  { label: '🚇 Andheri WEH Metro (Mumbai)', lat: 19.1197, lng: 72.8576, region: 'Mumbai' },
  { label: '🛣️ Manor Highway Plaza (NH48)', lat: 19.7421, lng: 72.9125, region: 'Palghar' },
  { label: '🏢 Vashi Inorbit (Navi Mumbai)', lat: 19.0652, lng: 72.9984, region: 'Navi Mumbai' },
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
  // Max range constant = 280 km
  const estimatedRangeKm = Math.round((batteryPct / 100) * 280);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            label: '📍 Current Location',
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
            region: 'GPS',
          });
        },
        (err) => {
          alert('Unable to retrieve GPS location: ' + err.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={18} color="#06b6d4" />
          Trip & EV Parameters
        </h2>
        <button
          onClick={handleUseCurrentLocation}
          style={{
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '6px',
            padding: '4px 10px',
            color: '#06b6d4',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Navigation2 size={12} />
          Use GPS
        </button>
      </div>

      {/* Location Preset Selector */}
      <div>
        <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>
          Origin / EV Location
        </label>
        <select
          value={`${location.lat},${location.lng}`}
          onChange={(e) => {
            const [latStr, lngStr] = e.target.value.split(',');
            const matched = PRESET_LOCATIONS.find((p) => p.lat === Number(latStr) && p.lng === Number(lngStr));
            if (matched) {
              setLocation(matched);
            } else {
              setLocation({ label: 'Custom Location', lat: Number(latStr), lng: Number(lngStr), region: 'Custom' });
            }
          }}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        >
          {PRESET_LOCATIONS.map((preset, idx) => (
            <option key={idx} value={`${preset.lat},${preset.lng}`}>
              {preset.label} ({preset.region})
            </option>
          ))}
        </select>
      </div>

      {/* Battery State of Charge Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BatteryCharging size={16} color={batteryPct <= 20 ? '#ef4444' : '#10b981'} />
            Battery Level (SoC)
          </label>
          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: batteryPct <= 20 ? '#ef4444' : '#06b6d4' }}>
            {batteryPct}% <span style={{ fontSize: '0.75rem', fontWeight: '400', color: '#94a3b8' }}> (~{estimatedRangeKm} km safe range)</span>
          </span>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={batteryPct}
          onChange={(e) => setBatteryPct(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: batteryPct <= 20 ? '#ef4444' : '#06b6d4',
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
          <span>5% (14 km)</span>
          <span>50% (140 km)</span>
          <span>100% (280 km)</span>
        </div>
      </div>

      {/* Connector Filter */}
      <div>
        <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', display: 'block' }}>
          Connector Compatibility
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {CONNECTOR_OPTIONS.map((cType) => {
            const isSelected = (cType === 'All' && !connectorType) || connectorType === cType;
            return (
              <button
                key={cType}
                type="button"
                onClick={() => setConnectorType(cType === 'All' ? '' : cType)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: isSelected ? '600' : '400',
                  background: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                  border: isSelected ? '1px solid #06b6d4' : '1px solid #334155',
                  color: isSelected ? '#06b6d4' : '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cType}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Radius Slider */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Search Radius</label>
          <span style={{ fontSize: '0.8rem', color: '#06b6d4', fontWeight: '600' }}>{radiusKm} km</span>
        </div>
        <input
          type="range"
          min="10"
          max="80"
          step="5"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
        />
      </div>

      {/* Execute Button */}
      <button
        onClick={onSearch}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
          border: 'none',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '0.9rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
          transition: 'all 0.2s ease',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <>
            <RefreshCw size={18} className="animate-spin" />
            Computing Arrival Queues...
          </>
        ) : (
          <>
            <Gauge size={18} />
            Find Optimal Stations
          </>
        )}
      </button>
    </div>
  );
}
