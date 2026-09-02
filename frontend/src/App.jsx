import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchPanel from './components/SearchPanel';
import MapView from './components/MapView';
import StationList from './components/StationList';
import AgentChat from './components/AgentChat';
import EVProfileModal from './components/EVProfileModal';
import { fetchRecommendations } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('recommend'); // 'recommend' | 'agent'
  const [location, setLocation] = useState({
    label: '🎓 SJCEM Palghar Campus',
    lat: 19.6967,
    lng: 72.7699,
    region: 'Palghar',
  });
  const [batteryPct, setBatteryPct] = useState(42);
  const [targetSoc, setTargetSoc] = useState(80);
  const [connectorType, setConnectorType] = useState('All');
  const [radiusKm, setRadiusKm] = useState(50);
  const [recommendationData, setRecommendationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userVehicle, setUserVehicle] = useState(null);

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
      setError(err.message || 'Charging data is temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [location, connectorType]);

  const topStationId = recommendationData?.top_recommendation?.station_id;

  return (
    <div className="app-container" style={{ padding: '20px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!userVehicle && (
        <EVProfileModal onProfileSaved={(vehicle) => setUserVehicle(vehicle)} />
      )}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ display: 'flex', gap: '24px', flex: 1, minHeight: '800px', flexDirection: 'row', flexWrap: 'wrap' }}>
        
        {/* Left Column: Dashboard / Battery Overview */}
        <div style={{ flex: '1 1 400px', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SearchPanel
            location={location}
            setLocation={setLocation}
            batteryPct={batteryPct}
            setBatteryPct={setBatteryPct}
            targetSoc={targetSoc}
            setTargetSoc={setTargetSoc}
            connectorType={connectorType}
            setConnectorType={setConnectorType}
            radiusKm={radiusKm}
            setRadiusKm={setRadiusKm}
            onSearch={loadRecommendations}
            loading={loading}
          />
        </div>

        {/* Right Column: Map & Station List OR Agent Chat */}
        <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeTab === 'recommend' ? (
            <>
              {error ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <h3 style={{ color: 'var(--text-dark)', marginBottom: '8px' }}>API Error</h3>
                  <p>{error}</p>
                  <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={loadRecommendations}>Retry</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  {/* Left sub-column: Map */}
                  <div style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden', height: '600px' }}>
                    <MapView
                      userLocation={location}
                      stations={recommendationData?.ranked_stations || []}
                      topStationId={topStationId}
                      onSelectStation={(st) => console.log('Selected:', st)}
                    />
                  </div>
                  {/* Right sub-column: Station List */}
                  <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
                    <StationList
                      recommendationData={recommendationData}
                      loading={loading}
                      onSelectStation={(st) => console.log('Selected card:', st)}
                      userVehicle={userVehicle}
                      currentSoc={batteryPct}
                      targetSoc={targetSoc}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto' }}>
              <AgentChat
                currentLat={location.lat}
                currentLng={location.lng}
                currentBattery={batteryPct}
                currentConnector={connectorType}
              />
            </div>
          )}
        </div>
        
      </main>
    </div>
  );
}
