import React from 'react';

export default function StationCard({ station, onSelect }) {
  const { breakdown } = station;

  return (
    <div
      onClick={onSelect}
      className="card"
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <h3 style={{ fontSize: '16px', margin: 0 }}>{station.station_name}</h3>
      
      {/* Key Information Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid var(--border-color)', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {breakdown.road_distance_km} km
        </span>
        <span style={{ 
          background: 'rgba(245, 158, 11, 0.1)', 
          color: 'var(--warning)', 
          border: '1px solid rgba(245, 158, 11, 0.2)', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          ~{breakdown.predicted_wait_minutes} min wait
        </span>
        <span style={{ 
          background: 'rgba(40, 168, 121, 0.1)', 
          color: 'var(--primary-accent)', 
          border: '1px solid rgba(40, 168, 121, 0.2)', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          Compatible
        </span>
      </div>

      {/* Secondary Information */}
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        • {station.connector_types.join(', ')}<br/>
        • {station.charger_count} chargers ({station.power_kw} kW)
      </div>

      <a
        href={station.google_maps_url}
        target="_blank"
        rel="noreferrer"
        className="btn-secondary"
        style={{ width: '100%', marginTop: '4px', textDecoration: 'none', padding: '10px' }}
        onClick={(e) => e.stopPropagation()}
      >
        View Station
      </a>
    </div>
  );
}
