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
import CoPilotDashboard from './components/CoPilotDashboard';
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
  const [userVehicles, setUserVehicles] = useState([]);

  // Sync vehicle profile if user has one saved on backend
  useEffect(() => {
    async function loadUserVehicle() {
      try {
        const vehicles = await fetchUserVehicles();
        if (vehicles && vehicles.length > 0) {
          setUserVehicles(vehicles);
          setUserVehicle(vehicles[vehicles.length - 1]);
        } else {
          setUserVehicles([]);
          setUserVehicle(null);
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

  // Load recommendations on mount and whenever search parameters change
  useEffect(() => {
    loadRecommendations();
  }, [location, connectorType, batteryPct, radiusKm]);

  const topStationId = recommendationData?.top_recommendation?.station_id;

  return (
    <>
      <AuthModal />
      {!userVehicle && (
        <EVProfileModal onProfileSaved={(vehicle) => {
          setUserVehicle(vehicle);
          setUserVehicles((prev) => (prev && prev.length > 0 ? [...prev, vehicle] : [vehicle]));
        }} />
      )}
      <CoPilotDashboard
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
        recommendationData={recommendationData}
        onSearch={loadRecommendations}
        loading={loading}
        userVehicle={userVehicle}
        userVehicles={userVehicles}
      />
    </>
  );
}
