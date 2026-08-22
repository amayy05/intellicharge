import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ExternalLink, Zap, Clock, BatteryCharging, ShieldAlert } from 'lucide-react';

// Fix Leaflet default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;

const createUserIcon = () =>
  L.divIcon({
    className: 'custom-user-marker',
    html: `<div class="user-pulse-marker"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const createStationIcon = (colorHex, isTop = false) => {
  const size = isTop ? 36 : 28;
  return L.divIcon({
    className: 'custom-station-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${colorHex};
        border: 2px solid #ffffff;
        box-shadow: 0 0 ${isTop ? '15px' : '8px'} ${colorHex};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 700;
        font-size: ${isTop ? '14px' : '11px'};
      ">
        ⚡
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function ChangeMapView({ center, zoom = 11 }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ userLocation, stations = [], topStationId, onSelectStation }) {
  const center = [userLocation.lat, userLocation.lng];

  return (
    <div className="glass-panel" style={{ height: '100%', minHeight: '460px', position: 'relative', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', minHeight: '460px', width: '100%' }}
      >
        <ChangeMapView center={center} zoom={11} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Location Marker */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()}>
          <Popup>
            <div style={{ padding: '4px' }}>
              <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#06b6d4' }}>📍 Your Location</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{userLocation.label || 'Origin Point'}</p>
            </div>
          </Popup>
        </Marker>

        {/* Station Markers */}
        {stations.map((st) => {
          const isTop = st.station_id === topStationId;
          const isReachable = st.breakdown?.is_reachable;
          let markerColor = '#10b981'; // Green (Low wait)

          if (!isReachable) {
            markerColor = '#64748b'; // Gray (Unreachable)
          } else if (isTop) {
            markerColor = '#06b6d4'; // Cyan (Top Pick)
          } else if (st.breakdown.predicted_wait_minutes > 15) {
            markerColor = '#ef4444'; // Red (Congested)
          } else if (st.breakdown.predicted_wait_minutes > 5) {
            markerColor = '#f59e0b'; // Amber (Moderate)
          }

          return (
            <Marker
              key={st.station_id}
              position={[st.latitude, st.longitude]}
              icon={createStationIcon(markerColor, isTop)}
              eventHandlers={{
                click: () => onSelectStation && onSelectStation(st),
              }}
            >
              <Popup>
                <div style={{ minWidth: '220px', padding: '6px' }}>
                  {isTop && (
                    <span
                      style={{
                        display: 'inline-block',
                        background: 'rgba(6, 182, 212, 0.2)',
                        color: '#06b6d4',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        marginBottom: '4px',
                      }}
                    >
                      ⭐ TOP RECOMMENDATION
                    </span>
                  )}
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f8fafc', marginBottom: '2px' }}>
                    {st.station_name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px' }}>
                    {st.operator} • {st.city_region}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', marginBottom: '10px' }}>
                    <div style={{ background: '#1e293b', padding: '4px 8px', borderRadius: '6px' }}>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Est. Wait:</span>
                      <strong style={{ color: markerColor }}>{st.breakdown.predicted_wait_minutes} min</strong>
                    </div>
                    <div style={{ background: '#1e293b', padding: '4px 8px', borderRadius: '6px' }}>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Driving Dist:</span>
                      <strong style={{ color: '#f8fafc' }}>{st.breakdown.road_distance_km} km</strong>
                    </div>
                  </div>

                  {!isReachable && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.7rem', marginBottom: '8px' }}>
                      <ShieldAlert size={12} />
                      <span>Exceeds remaining battery range!</span>
                    </div>
                  )}

                  <a
                    href={st.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      width: '100%',
                      padding: '6px',
                      borderRadius: '6px',
                      background: '#06b6d4',
                      color: '#090d16',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      textDecoration: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <ExternalLink size={12} />
                    Navigate via Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #334155',
          fontSize: '0.7rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
          <span>Top Pick</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span>Low Wait (&lt; 5m)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
          <span>Moderate (5-15m)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
          <span>High / Queue (&gt; 15m)</span>
        </div>
      </div>
    </div>
  );
}
