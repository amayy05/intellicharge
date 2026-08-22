import React from 'react';
import { Clock, Navigation, Zap, ExternalLink, Battery, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function StationCard({ station, isTop = false, onSelect }) {
  const { breakdown } = station;
  const isReachable = breakdown.is_reachable;

  let waitColor = '#10b981';
  let waitBg = 'rgba(16, 185, 129, 0.15)';
  if (breakdown.predicted_wait_minutes > 15) {
    waitColor = '#ef4444';
    waitBg = 'rgba(239, 68, 68, 0.15)';
  } else if (breakdown.predicted_wait_minutes > 5) {
    waitColor = '#f59e0b';
    waitBg = 'rgba(245, 158, 11, 0.15)';
  }

  return (
    <div
      onClick={onSelect}
      className={isTop ? 'glass-panel-glow' : 'glass-panel'}
      style={{
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        borderLeft: isTop ? '4px solid #06b6d4' : (isReachable ? '4px solid #334155' : '4px solid #ef4444'),
      }}
    >
      {/* Top Banner / Tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '6px',
              background: isTop ? '#06b6d4' : '#1e293b',
              color: isTop ? '#090d16' : '#cbd5e1',
            }}
          >
            #{station.rank}
          </span>
          {station.recommendation_tag && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '6px',
                background: isTop ? 'rgba(6, 182, 212, 0.2)' : 'rgba(51, 65, 85, 0.5)',
                color: isTop ? '#06b6d4' : '#94a3b8',
                border: isTop ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid #334155',
              }}
            >
              {station.recommendation_tag}
            </span>
          )}
        </div>

        {/* Predicted Wait Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: waitBg,
            color: waitColor,
            border: `1px solid ${waitColor}40`,
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '700',
          }}
        >
          <Clock size={12} />
          <span>{breakdown.predicted_wait_minutes}m wait</span>
        </div>
      </div>

      {/* Station Name & Operator */}
      <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', marginBottom: '2px' }}>
        {station.station_name}
      </h3>
      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px' }}>
        {station.operator} • {station.city_region}
      </p>

      {/* Metric Breakdown Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '8px',
          borderRadius: '8px',
          marginBottom: '12px',
          border: '1px solid rgba(51, 65, 85, 0.4)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>Driving Dist</span>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f8fafc' }}>
            {breakdown.road_distance_km} km
          </span>
        </div>
        <div>
          <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>Transit Time</span>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f8fafc' }}>
            ~{breakdown.travel_time_minutes} min
          </span>
        </div>
        <div>
          <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block' }}>Arrival SoC</span>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              color: breakdown.battery_after_arrival_pct < 10 ? '#ef4444' : '#34d399',
            }}
          >
            ~{breakdown.battery_after_arrival_pct}%
          </span>
        </div>
      </div>

      {/* Fast Charging & Amenity Specs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
          <Zap size={14} color="#06b6d4" />
          <span>{station.power_kw} kW • {station.charger_count} chargers ({station.connector_types.join(', ')})</span>
        </div>

        {/* 1-Click Navigate Button */}
        <a
          href={station.google_maps_url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '6px',
            background: isTop ? '#06b6d4' : '#1e293b',
            color: isTop ? '#090d16' : '#f8fafc',
            border: isTop ? 'none' : '1px solid #334155',
            fontWeight: '600',
            fontSize: '0.75rem',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Navigation size={12} />
          Navigate
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}
