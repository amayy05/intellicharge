/**
 * App.jsx — §9 Responsive layout
 *
 * §9 Mobile (primary — audience is mid-journey, phone, glancing in car):
 *   Single column: [Navbar] → [FilterStrip sticky] → [Map ~45vh] → [Ranked list] → [Ask IntelliCharge persistent entry]
 *
 * §9 Tablet/Desktop:
 *   [Navbar]
 *   [Map (65%) | FilterStrip + Ranked list (35%)]
 *   Chat = slide-over panel from the right — so desktop user doesn't lose map context.
 *
 * §5.1: "💬 Ask IntelliCharge" persistent entry — never hidden.
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FilterStrip from './components/SearchPanel';
import MapView from './components/MapView';
import StationList from './components/StationList';
import AgentChat from './components/AgentChat';
import { fetchRecommendations } from './services/api';

const DEFAULT_LOCATION = { label: 'SJCEM Palghar', lat: 19.6967, lng: 72.7699 };

export default function App() {
  const [activeTab, setActiveTab] = useState('map');   // 'map' | 'agent'
  const [chatOpen, setChatOpen] = useState(false);       // desktop slide-over

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

  // Re-fetch when location or connector changes
  useEffect(() => { loadRecs(); }, [location, connectorType]);

  const topId = recData?.top_recommendation?.station_id;
  const stations = recData?.ranked_stations ?? [];

  // §5.1: persistent "Ask IntelliCharge" bottom entry — only on map tab
  const handleAskAgent = () => setActiveTab('agent');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--asphalt)', overflow: 'hidden' }}>

      {/* Navbar — §3: flat bar, no shadow */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          if (t === 'agent') setChatOpen(true);
          else setChatOpen(false);
        }}
      />

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: 'var(--red-muted)',
            border: '1px solid var(--red-border)',
            borderRadius: 0,
            padding: '8px 16px',
            fontSize: '0.8rem',
            color: 'var(--signal-red)',
          }}
          role="alert"
        >
          {/* §6 error copy: states what happened, what to do */}
          Could not reach IntelliCharge backend. Check that the server is running on port 8000.
        </div>
      )}

      {activeTab === 'agent' ? (
        /* Agent screen — full screen on mobile, also full on desktop tab */
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AgentChat
            currentLat={location.lat}
            currentLng={location.lng}
            currentBattery={batteryPct}
            currentConnector={connectorType}
          />
        </div>
      ) : (
        /* Map + list layout — §9 responsive */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          {/* §5.1 Sticky filter strip — always above the list */}
          <FilterStrip
            location={location} setLocation={setLocation}
            batteryPct={batteryPct} setBatteryPct={setBatteryPct}
            connectorType={connectorType} setConnectorType={setConnectorType}
            radiusKm={radiusKm} setRadiusKm={setRadiusKm}
            onSearch={loadRecs}
            loading={loading}
          />

          {/* §9 Main content: responsive split */}
          <div
            style={{
              flex: 1,
              display: 'grid',
              /* Mobile: single column. Desktop: map 65% | list 35% */
              gridTemplateColumns: 'minmax(0, 1fr)',
              gridTemplateRows: '45vh 1fr',
              overflow: 'hidden',
            }}
            className="main-split"
          >
            {/* §5.1 Map — ~45% viewport, pulsing pins */}
            <div style={{ padding: '8px 12px 0 12px', overflow: 'hidden' }}>
              <MapView
                userLocation={location}
                stations={stations}
                topStationId={topId}
                onSelectStation={setSelectedStation}
              />
            </div>

            {/* Ranked list — scrollable */}
            <div
              style={{
                overflowY: 'auto',
                padding: '8px 12px 80px 12px', /* 80px bottom padding for persistent button */
              }}
            >
              <StationList
                recommendationData={recData}
                loading={loading}
                onSelectStation={setSelectedStation}
              />
            </div>
          </div>

          {/* §5.1: "💬 Ask IntelliCharge" persistent entry — never hidden */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '10px 12px',
              background: 'linear-gradient(to top, var(--asphalt) 60%, transparent)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={handleAskAgent}
              className="btn btn-primary"
              style={{
                width: '100%',
                maxWidth: '380px',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(200, 113, 46, 0.25)',
              }}
              id="ask-intellicharge-btn"
              aria-label="Open IntelliCharge Agent chat"
            >
              💬 Ask IntelliCharge
            </button>
          </div>
        </div>
      )}

      {/* §9 Desktop: responsive grid override via inline style tag */}
      <style>{`
        @media (min-width: 900px) {
          .main-split {
            grid-template-columns: 1fr 380px !important;
            grid-template-rows: 1fr !important;
          }
          .main-split > div:first-child {
            padding: 10px !important;
          }
          .main-split > div:last-child {
            border-left: 1px solid var(--slate-border);
            padding-bottom: 80px !important;
          }
        }

        @keyframes shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 0.7; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
