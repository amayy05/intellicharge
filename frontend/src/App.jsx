import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchPanel from './components/SearchPanel';
import MapView from './components/MapView';
import StationList from './components/StationList';
import AgentChat from './components/AgentChat';
import { fetchRecommendations } from './services/api';
import { Zap, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('recommend'); // 'recommend' | 'agent'
  const [location, setLocation] = useState({
    label: '🎓 SJCEM Palghar Campus',
    lat: 19.6967,
    lng: 72.7699,
    region: 'Palghar',
  });
  const [batteryPct, setBatteryPct] = useState(30);
  const [connectorType, setConnectorType] = useState('');
  const [radiusKm, setRadiusKm] = useState(50);
  const [recommendationData, setRecommendationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecommendations(
        location.lat,
        location.lng,
        batteryPct,
        radiusKm,
        connectorType
      );
      setRecommendationData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to connect to IntelliCharge backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [location, connectorType]);

  const topStationId = recommendationData?.top_recommendation?.station_id;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '30px' }}>
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reachableCount={recommendationData?.reachable_count || 0}
        totalCount={recommendationData?.total_found || 0}
      />

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '20px auto', padding: '0 20px', width: '100%', boxSizing: 'border-box' }}>
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#fca5a5',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={18} color="#ef4444" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'recommend' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '360px 1fr 400px',
              gap: '20px',
              alignItems: 'start',
            }}
            className="dashboard-grid"
          >
            {/* Left Column: Trip & Battery Parameters */}
            <div>
              <SearchPanel
                location={location}
                setLocation={setLocation}
                batteryPct={batteryPct}
                setBatteryPct={setBatteryPct}
                connectorType={connectorType}
                setConnectorType={setConnectorType}
                radiusKm={radiusKm}
                setRadiusKm={setRadiusKm}
                onSearch={loadRecommendations}
                loading={loading}
              />
            </div>

            {/* Center Column: Interactive Leaflet OSM Map */}
            <div style={{ height: '700px' }}>
              <MapView
                userLocation={location}
                stations={recommendationData?.ranked_stations || []}
                topStationId={topStationId}
                onSelectStation={(st) => console.log('Selected:', st)}
              />
            </div>

            {/* Right Column: Ranked Recommendations with Wait Breakdown */}
            <div style={{ maxHeight: '700px', overflowY: 'auto', paddingRight: '4px' }}>
              <StationList
                recommendationData={recommendationData}
                loading={loading}
                onSelectStation={(st) => console.log('Selected card:', st)}
              />
            </div>
          </div>
        ) : (
          /* Conversational AI Agent Tab */
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <AgentChat
              currentLat={location.lat}
              currentLng={location.lng}
              currentBattery={batteryPct}
              currentConnector={connectorType}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.75rem' }}>
        <p>
          IntelliCharge MVP • Department of Computer Engineering, St. John College of Engineering and Management (SJCEM), Palghar
        </p>
        <p style={{ marginTop: '4px' }}>
          OpenChargeMap Data Ingestion • Scikit-Learn Predictive Regressor • Battery-Aware Road Routing
        </p>
      </footer>
    </div>
  );
}
