import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;

const createUserIcon = () =>
  L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="width: 16px; height: 16px; background: #000; border: 3px solid #FFF; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const createStationIcon = (type) => {
  let size, bg, border, content;
  
  if (type === 'best') {
    size = 44;
    bg = 'var(--primary-accent)'; // #28A879
    border = '3px solid #FFFFFF';
    content = '⚡';
  } else if (type === 'available') {
    size = 28;
    bg = '#FFFFFF';
    border = '2px solid var(--text-secondary)';
    content = '<span style="color: var(--text-secondary); font-size: 14px;">⚡</span>';
  } else {
    // unavailable
    size = 24;
    bg = '#E5E7EB';
    border = '2px solid #9CA3AF';
    content = '';
  }

  return L.divIcon({
    className: 'custom-station-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bg};
        border: ${border};
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 700;
        font-size: ${type === 'best' ? '20px' : '14px'};
      ">
        ${content}
      </div>
      ${type === 'best' ? `<div style="position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); background: #FFF; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">BEST MATCH</div>` : ''}
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
    <div style={{ height: '100%', minHeight: '460px', position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-card)' }}>
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', minHeight: '100%', width: '100%', zIndex: 1 }}
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
              <p style={{ fontWeight: '700', fontSize: '14px', margin: 0 }}>📍 Origin</p>
            </div>
          </Popup>
        </Marker>

        {/* Station Markers */}
        {stations.map((st) => {
          const isTop = st.station_id === topStationId;
          const isReachable = st.breakdown?.is_reachable;
          let markerType = 'available';

          if (isTop) {
            markerType = 'best';
          } else if (!isReachable) {
            markerType = 'unavailable';
          }

          return (
            <Marker
              key={st.station_id}
              position={[st.latitude, st.longitude]}
              icon={createStationIcon(markerType)}
              eventHandlers={{
                click: () => onSelectStation && onSelectStation(st),
              }}
            >
              <Popup>
                <div style={{ minWidth: '180px', padding: '4px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 4px 0' }}>
                    {st.station_name}
                  </h3>
                  
                  <div style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    <span>{st.breakdown.road_distance_km} km away</span><br/>
                    <span>~{st.breakdown.predicted_wait_minutes} min wait</span>
                  </div>

                  <a
                    href={st.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '12px',
                      textDecoration: 'none',
                    }}
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
