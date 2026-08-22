import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FilterStrip from './components/SearchPanel';
import MapView from './components/MapView';
import StationList from './components/StationList';
import AgentChat from './components/AgentChat';
import { fetchRecommendations } from './services/api';

const DEFAULT_LOCATION = { label: 'SJCEM Palghar', lat: 19.6967, lng: 72.7699 };

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [batteryPct, setBatteryPct] = useState(30);
  const [connectorType, setConnectorType] = useState('');
  const [radiusKm, setRadiusKm] = useState(50);
  const [recData, setRecData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);

  const loadRecs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecommendations(location.lat, location.lng, batteryPct, radiusKm, connectorType);
      setRecData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecs(); }, [location, connectorType]);

  const topId = recData?.top_recommendation?.station_id;
  const stations = recData?.ranked_stations ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--asphalt)', overflow: 'hidden' }}>
      <style>{`
        /* ── Desktop layout ────────────────────────────────────── */
        @media (min-width: 900px) {
          .map-view-area {
            /* map fills the full remaining height, full width */
            height: 100% !important;
          }
          .desktop-body {
            flex: 1;
            display: grid !important;
            grid-template-columns: 1fr 400px !important;
            grid-template-rows: 1fr !important;
            overflow: hidden;
          }
          .desktop-left {
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden;
            border-right: 1px solid var(--slate-border);
          }
          .desktop-right {
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden;
          }
          .mobile-map-row { display: none !important; }
          .desktop-map-area {
            flex: 1;
            padding: 10px;
            overflow: hidden;
          }
          .station-list-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 10px 12px 80px 12px;
          }
          .filter-strip-desktop {
            border-bottom: 1px solid var(--slate-border);
          }
        }

        /* ── Mobile layout ─────────────────────────────────────── */
        @media (max-width: 899px) {
          .desktop-left { display: contents !important; }
          .desktop-right { display: contents !important; }
          .desktop-body {
            flex: 1;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden;
          }
          .mobile-map-row {
            height: 42vmax;
            min-height: 220px;
            max-height: 45vh;
            flex-shrink: 0;
            padding: 8px 10px 0 10px;
          }
          .desktop-map-area { display: none !important; }
          .station-list-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 8px 10px 80px 10px;
          }
        }

        @keyframes shimmer {
          0%   { opacity: 0.35; }
          50%  { opacity: 0.65; }
          100% { opacity: 0.35; }
        }
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ── Error banner ────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--red-muted)', border: '1px solid var(--red-border)',
            padding: '8px 16px', fontSize: '0.8rem', color: 'var(--signal-red)',
          }}
        >
          Could not reach IntelliCharge backend. Check that the server is running on port 8000.
        </div>
      )}

      {/* ── Agent view ──────────────────────────────────────────── */}
      {activeTab === 'agent' ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AgentChat
            currentLat={location.lat} currentLng={location.lng}
            currentBattery={batteryPct} currentConnector={connectorType}
          />
        </div>
      ) : (
        /* ── Map + list view ─────────────────────────────────── */
        <div className="desktop-body" style={{ position: 'relative' }}>

          {/* LEFT COLUMN — filter strip (desktop) + map */}
          <div className="desktop-left">
            {/* Filter strip sits above the map on desktop */}
            <div className="filter-strip-desktop">
              <FilterStrip
                location={location} setLocation={setLocation}
                batteryPct={batteryPct} setBatteryPct={setBatteryPct}
                connectorType={connectorType} setConnectorType={setConnectorType}
                radiusKm={radiusKm} setRadiusKm={setRadiusKm}
                onSearch={loadRecs} loading={loading}
              />
            </div>

            {/* Mobile: map sits in a fixed-height row here */}
            <div className="mobile-map-row">
              <MapView
                userLocation={location} stations={stations}
                topStationId={topId} onSelectStation={setSelectedStation}
              />
            </div>

            {/* Desktop: map fills remaining height */}
            <div className="desktop-map-area">
              <MapView
                userLocation={location} stations={stations}
                topStationId={topId} onSelectStation={setSelectedStation}
              />
            </div>
          </div>

          {/* RIGHT COLUMN — ranked list */}
          <div className="desktop-right">
            <div className="station-list-scroll">
              <StationList
                recommendationData={recData} loading={loading}
                onSelectStation={setSelectedStation}
              />
            </div>
          </div>

          {/* §5.1: "💬 Ask IntelliCharge" — persistent, never hidden */}
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '10px 12px',
              background: 'linear-gradient(to top, var(--asphalt) 55%, transparent)',
              display: 'flex', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <button
              onClick={() => setActiveTab('agent')}
              className="btn btn-primary"
              id="ask-intellicharge-btn"
              aria-label="Open IntelliCharge Agent chat"
              style={{
                width: '100%', maxWidth: '320px',
                boxShadow: '0 4px 20px rgba(200, 113, 46, 0.3)',
                pointerEvents: 'all',
              }}
            >
              💬 Ask IntelliCharge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
