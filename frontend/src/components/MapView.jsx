import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;

const createUserIcon = () =>
  L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="width: 18px; height: 18px; background: #181A19; border: 3px solid #FFF; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><div style="width: 6px; height: 6px; background: #10B981; border-radius: 50%;"></div></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

const createStationIcon = (type, isSelected) => {
  let size, bg, border, content;

  if (isSelected || type === 'best') {
    size = isSelected ? 48 : 44;
    bg = '#28A879'; // Primary accent
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

  const badgeText = isSelected ? 'ACTIVE ROUTE' : (type === 'best' ? 'BEST MATCH' : '');

  return L.divIcon({
    className: 'custom-station-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bg};
        border: ${border};
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 700;
        font-size: ${isSelected || type === 'best' ? '20px' : '14px'};
        transition: transform 0.2s ease;
      ">
        ${content}
      </div>
      ${badgeText ? `<div style="position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); background: #181A19; color: #FFF; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">${badgeText}</div>` : ''}
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

function FitRouteBounds({ userLocation, targetStation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation?.lat && targetStation?.latitude) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [targetStation.latitude, targetStation.longitude],
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [userLocation?.lat, userLocation?.lng, targetStation?.station_id, map]);
  return null;
}

export default function MapView({
  userLocation,
  stations = [],
  topStationId,
  selectedStationId,
  onSelectStation,
}) {
  const center = [userLocation.lat, userLocation.lng];
  const activeStationId = selectedStationId || topStationId;
  const targetStation = stations.find((st) => st.station_id === activeStationId) || stations[0];

  const [routeGeo, setRouteGeo] = useState(null);
  const [routeMeta, setRouteMeta] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Fetch real road route from OSRM
  useEffect(() => {
    if (!targetStation || !userLocation?.lat || !userLocation?.lng) {
      setRouteGeo(null);
      setRouteMeta(null);
      return;
    }

    let isMounted = true;
    setRouteLoading(true);

    const origin = `${userLocation.lng},${userLocation.lat}`;
    const destination = `${targetStation.longitude},${targetStation.latitude}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Route service returned error');
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data?.routes?.[0]?.geometry?.coordinates) {
          // OSRM returns [lon, lat], Leaflet requires [lat, lon]
          const points = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          setRouteGeo(points);
          setRouteMeta({
            distanceKm: (data.routes[0].distance / 1000).toFixed(1),
            durationMin: Math.round(data.routes[0].duration / 60),
          });
        } else {
          // Fallback to straight line
          setRouteGeo([
            [userLocation.lat, userLocation.lng],
            [targetStation.latitude, targetStation.longitude],
          ]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('OSRM routing failed, using direct coordinate line:', err);
        setRouteGeo([
          [userLocation.lat, userLocation.lng],
          [targetStation.latitude, targetStation.longitude],
        ]);
      })
      .finally(() => {
        if (isMounted) setRouteLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userLocation?.lat, userLocation?.lng, targetStation?.latitude, targetStation?.longitude, targetStation?.station_id]);

  return (
    <div style={{ height: '100%', minHeight: '460px', position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-card)' }}>
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', minHeight: '100%', width: '100%', zIndex: 1 }}
      >
        <ChangeMapView center={center} zoom={11} />
        {targetStation && <FitRouteBounds userLocation={userLocation} targetStation={targetStation} />}
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Real Functional Turn-by-Turn Route Line */}
        {routeGeo && (
          <>
            {/* Glow / Halo Effect */}
            <Polyline
              positions={routeGeo}
              pathOptions={{
                color: '#10B981',
                weight: 8,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            {/* Main Road Route Line */}
            <Polyline
              positions={routeGeo}
              pathOptions={{
                color: '#181A19',
                weight: 4,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '10, 8',
              }}
            />
          </>
        )}

        {/* User Current Location Marker */}
        <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()}>
          <Popup>
            <div style={{ padding: '6px' }}>
              <p style={{ fontWeight: '700', fontSize: '13px', margin: 0 }}>📍 Origin: {userLocation.label || 'Current Location'}</p>
            </div>
          </Popup>
        </Marker>

        {/* Station Markers */}
        {stations.map((st) => {
          const isTop = st.station_id === topStationId;
          const isSelected = st.station_id === activeStationId;
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
              icon={createStationIcon(markerType, isSelected)}
              eventHandlers={{
                click: () => onSelectStation && onSelectStation(st),
              }}
            >
              <Popup>
                <div style={{ minWidth: '190px', padding: '6px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 6px 0' }}>
                    {st.station_name}
                  </h3>
                  
                  <div style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                    <span>📍 {st.breakdown?.road_distance_km} km away</span><br/>
                    <span>⏱ {st.breakdown?.predicted_wait_minutes < 1 ? '<1' : '~' + Math.round(st.breakdown?.predicted_wait_minutes)} min wait</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => onSelectStation && onSelectStation(st)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: isSelected ? '#10B981' : '#181A19',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {isSelected ? 'Selected' : 'Show Route'}
                    </button>
                    <a
                      href={st.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: '#F3EFE9',
                        color: '#181A19',
                        border: '1px solid #E8E4DC',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      Maps ↗
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Active Route HUD */}
      {targetStation && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #E8E4DC',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#181A19',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}>
              ⚡
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6E716E' }}>
                {routeLoading ? 'Calculating Road Route...' : 'Active Navigation Route'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#181A19', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {targetStation.station_name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', fontSize: '12px' }}>
              <span style={{ fontWeight: '700', color: '#181A19' }}>
                {routeMeta?.distanceKm ? `${routeMeta.distanceKm} km` : `${targetStation.breakdown?.road_distance_km} km`}
              </span>
              <span style={{ color: '#6E716E' }}> • </span>
              <span style={{ color: '#059669', fontWeight: '600' }}>
                {routeMeta?.durationMin ? `~${routeMeta.durationMin} min drive` : `Wait ~${Math.round(targetStation.breakdown?.predicted_wait_minutes || 0)}m`}
              </span>
            </div>
            <a
              href={targetStation.google_maps_url}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#181A19',
                color: '#FAF8F5',
                fontSize: '12px',
                fontWeight: '700',
                padding: '6px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              Start Trip
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
