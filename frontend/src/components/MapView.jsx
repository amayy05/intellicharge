/**
 * MapView — §5.1 map (~45% viewport) + §7 Motion
 *
 * §7: ONE animated moment — the recommended station's pin pulses.
 *     Pulse rate tied to wait time: short wait = fast pulse (0.8s), long wait = slow (2.5s).
 *     Everything else is still. No hover bounce, no card-entrance animations.
 *     prefers-reduced-motion: static colored ring.
 *
 * ChargeBar appears inside map tooltips — same visual vocabulary as the list (§4).
 */

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import ChargeBar from './ChargeBar';

delete L.Icon.Default.prototype._getIconUrl;

// §7: pulse duration computed from wait time
function pulseDuration(waitMinutes) {
  if (waitMinutes <= 5)  return '0.8s';   // short wait — fast pulse
  if (waitMinutes <= 15) return '1.4s';   // mid wait
  return '2.5s';                           // long wait — slow and dull
}

// Pin color matches charge-bar color for that station (§7: "pulse rate = charge-bar color")
function pinColor(waitMinutes, isReachable) {
  if (!isReachable) return '#5C5955';       // fog-dim — unreachable
  if (waitMinutes <= 5)  return '#3FD6C4';  // --volt-cyan
  if (waitMinutes <= 12) return '#5EC9BA';
  if (waitMinutes <= 18) return '#C8712E';  // --copper
  if (waitMinutes <= 24) return '#D4631A';
  return '#E85C4A';                         // --signal-red
}

function createStationPin(waitMinutes, isTop, isReachable) {
  const color = pinColor(waitMinutes, isReachable);
  const duration = pulseDuration(waitMinutes);
  const size = isTop ? 20 : 14;

  // §7 prefers-reduced-motion handled via CSS in index.css
  return L.divIcon({
    className: '',
    html: `
      <div
        class="station-pin"
        style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          --pin-color: ${color};
          --pulse-duration: ${duration};
          ${!isReachable ? 'opacity: 0.45;' : ''}
        "
        role="img"
        aria-label="Station with ${Math.round(waitMinutes)} minute wait"
      >
        ${isTop ? '<div class="station-pin__ring" style="--pin-color:' + color + '; --pulse-duration:' + duration + '"></div>' : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function createUserPin() {
  return L.divIcon({
    className: '',
    html: `<div class="user-pin" aria-label="Your location"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ userLocation, stations = [], topStationId, onSelectStation }) {
  const center = [userLocation.lat, userLocation.lng];

  return (
    <div style={{ height: '100%', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <RecenterMap center={center} zoom={11} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* User location — Copper pin */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserPin()}>
          <Popup>
            <div style={{ padding: '10px 12px', minWidth: '140px' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--fog)', fontWeight: '600' }}>
                📍 Your location
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--fog-muted)', marginTop: '2px' }}>
                {userLocation.label ?? 'Origin'}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Station pins — §7 pulse rate tied to wait */}
        {stations.map((st) => {
          const isTop = st.station_id === topStationId;
          const wait = st.breakdown?.predicted_wait_minutes ?? 0;
          const isReachable = st.breakdown?.is_reachable ?? true;
          const connectors = Array.isArray(st.connector_types)
            ? st.connector_types
            : st.connector_types?.split(',').map(s => s.trim()) ?? [];

          return (
            <Marker
              key={st.station_id}
              position={[st.latitude, st.longitude]}
              icon={createStationPin(wait, isTop, isReachable)}
              eventHandlers={{ click: () => onSelectStation?.(st) }}
            >
              <Popup>
                {/* §4 ChargeBar in tooltip — same vocabulary as the list */}
                <div style={{ padding: '12px', minWidth: '210px' }}>
                  {isTop && (
                    <span style={{
                      display: 'inline-block',
                      background: 'var(--copper-muted)',
                      color: 'var(--copper)',
                      border: '1px solid var(--copper-border)',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-chip)',
                      marginBottom: '6px',
                      fontFamily: 'var(--font-body)',
                    }}>
                      Best match
                    </span>
                  )}
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600', fontSize: '0.88rem', color: 'var(--fog)', marginBottom: '2px' }}>
                    {st.station_name}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--fog-muted)', marginBottom: '10px' }}>
                    {st.operator}
                  </p>

                  {/* §4: ChargeBar in tooltip */}
                  <ChargeBar waitMinutes={wait} size="sm" />

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.72rem' }}>
                    <span>
                      <span style={{ color: 'var(--fog-dim)' }}>dist </span>
                      <span className="font-mono" style={{ color: 'var(--fog)' }}>{st.breakdown?.road_distance_km} km</span>
                    </span>
                    <span>
                      <span style={{ color: 'var(--fog-dim)' }}>drive </span>
                      <span className="font-mono" style={{ color: 'var(--fog)' }}>{st.breakdown?.travel_time_minutes}m</span>
                    </span>
                  </div>

                  {!isReachable && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--signal-red)', marginTop: '6px' }}>
                      ⚠ Outside battery range
                    </p>
                  )}

                  <a
                    href={st.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-navigate"
                    style={{ marginTop: '10px', width: '100%', justifyContent: 'center', display: 'flex', gap: '4px' }}
                    aria-label={`Navigate to ${st.station_name}`}
                  >
                    Navigate
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
