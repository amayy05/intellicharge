import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import SearchPanel from './components/SearchPanel';
import MapView from './components/MapView';
import StationList from './components/StationList';
import AgentChat from './components/AgentChat';
import EVProfileModal from './components/EVProfileModal';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { fetchRecommendations, fetchUserVehicles } from './services/api';

export default function App() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'recommend' | 'agent'
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

  // Sync vehicle profile if user has one saved on backend
  useEffect(() => {
    async function loadUserVehicle() {
      try {
        const vehicles = await fetchUserVehicles();
        if (vehicles && vehicles.length > 0) {
          setUserVehicle(vehicles[vehicles.length - 1]);
        }
      } catch (err) {
        console.warn('Could not fetch user vehicles:', err);
      }
    }
    loadUserVehicle();
  }, [user, isAuthenticated]);

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
    if (activeTab === 'recommend') {
      loadRecommendations();
    }
  }, [location, connectorType, activeTab]);

  const topStationId = recommendationData?.top_recommendation?.station_id;

  return (
    <div className="app-container" style={{ padding: '20px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <AuthModal />
      
      {/* Show EV Profile setup modal only when navigating into active charging/routing dashboard */}
      {activeTab === 'recommend' && !userVehicle && (
        <EVProfileModal onProfileSaved={(vehicle) => setUserVehicle(vehicle)} />
      )}

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Landing Page View */}
      {activeTab === 'home' && (
        <LandingPage setActiveTab={setActiveTab} />
      )}

      {/* Smart Routing Dashboard View */}
      {activeTab === 'recommend' && (
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

          {/* Right Column: Map & Station List */}
          <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
          </div>
        </main>
      )}

      {/* AI Agent Chat View */}
      {activeTab === 'agent' && (
        <main style={{ maxWidth: '800px', width: '100%', margin: '0 auto', flex: 1 }}>
          <AgentChat
            currentLat={location.lat}
            currentLng={location.lng}
            currentBattery={batteryPct}
            currentConnector={connectorType}
          />
        </main>
      )}
    </div>
  );
}
