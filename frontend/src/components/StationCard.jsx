/**
 * StationCard — §5.1 ranked station card
 * ChargeBar is the ONLY visual vocabulary for "how good is this option."
 * IBM Plex Mono for all data numerals (distance, wait, battery).
 * §3: 6px radius, 1px border. No shadows.
 * §10: "Navigate" not "Go". Copy says what it does.
 * §8: touch target >= 44px.
 */

import React from 'react';
import ChargeBar from './ChargeBar';
import { MapPin, Zap } from 'lucide-react';

export default function StationCard({ station, isTop = false, loading = false, onSelect }) {
  const { breakdown } = station;

  if (loading) {
    return (
      <div className="card" style={{ padding: '14px 16px' }}>
        <ChargeBar loading={true} />
      </div>
    );
  }

  const wait = breakdown.predicted_wait_minutes;
  const isReachable = breakdown.is_reachable;

  // §3: Copper left border on top-ranked card, Signal Red on unreachable
  const leftBorderColor = !isReachable
    ? 'var(--signal-red)'
    : isTop
    ? 'var(--copper)'
    : 'var(--slate-border)';

  // Connector types from comma string or array
  const connectors = Array.isArray(station.connector_types)
    ? station.connector_types
    : station.connector_types?.split(',').map(s => s.trim()) ?? [];

  return (
    <div
      onClick={onSelect}
      className="card"
      style={{
        padding: '14px 16px',
        cursor: 'pointer',
        borderLeft: `3px solid ${leftBorderColor}`,
        transition: 'border-color 0.15s',
        /* §3: no shadows — border is the honest signal */
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
      aria-label={`Station: ${station.station_name}, predicted wait: ${Math.round(wait)} minutes`}
    >
      {/* Rank + optional tag */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.7rem',
              color: isTop ? 'var(--asphalt)' : 'var(--fog-dim)',
              background: isTop ? 'var(--copper)' : 'var(--slate-dim)',
              border: isTop ? 'none' : '1px solid var(--slate-border)',
              padding: '2px 7px',
              borderRadius: 'var(--radius-chip)',
              fontWeight: '600',
            }}
          >
            #{station.rank}
          </span>
          {isTop && (
            <span style={{ fontSize: '0.7rem', color: 'var(--copper)', fontWeight: '500' }}>
              Best match
            </span>
          )}
          {!isReachable && (
            <span style={{ fontSize: '0.7rem', color: 'var(--signal-red)' }}>
              Out of range
            </span>
          )}
        </div>

        {/* Score — plain number, §10: not "score: 0.42" */}
        {isTop && breakdown.time_saved_vs_closest_min > 0 && (
          <span style={{ fontSize: '0.72rem', color: 'var(--volt-cyan)', fontFamily: 'var(--font-data)' }}>
            saves {Math.round(breakdown.time_saved_vs_closest_min)}m vs nearest
          </span>
        )}
      </div>

      {/* Station name & operator */}
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600', fontSize: '0.92rem', color: 'var(--fog)', marginBottom: '2px' }}>
        {station.station_name}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--fog-muted)', marginBottom: '10px' }}>
        {station.operator} · {station.city_region}
      </p>

      {/* §4 THE CHARGE BAR — single visual vocabulary */}
      <ChargeBar waitMinutes={wait} />

      {/* Data row — §3 IBM Plex Mono for numerals */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          marginTop: '10px',
          fontSize: '0.78rem',
        }}
      >
        <span>
          <span style={{ color: 'var(--fog-dim)', marginRight: '3px' }}>dist</span>
          <span className="font-mono" style={{ color: 'var(--fog)' }}>{breakdown.road_distance_km} km</span>
        </span>
        <span>
          <span style={{ color: 'var(--fog-dim)', marginRight: '3px' }}>drive</span>
          <span className="font-mono" style={{ color: 'var(--fog)' }}>{breakdown.travel_time_minutes}m</span>
        </span>
        <span>
          <span style={{ color: 'var(--fog-dim)', marginRight: '3px' }}>SoC on arrival</span>
          <span
            className="font-mono"
            style={{ color: breakdown.battery_after_arrival_pct < 10 ? 'var(--signal-red)' : 'var(--fog)' }}
          >
            {breakdown.battery_after_arrival_pct}%
          </span>
        </span>
      </div>

      {/* Specs + Navigate — §10: "Navigate" not "Go" */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '10px',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '0.72rem', color: 'var(--fog-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={12} color="var(--copper)" />
          {station.power_kw} kW · {station.charger_count} chargers · {connectors.slice(0, 2).join(', ')}
        </span>

        <a
          href={station.google_maps_url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="btn btn-navigate"
          aria-label={`Navigate to ${station.station_name} via Google Maps`}
        >
          <MapPin size={12} />
          Navigate
        </a>
      </div>
    </div>
  );
}
