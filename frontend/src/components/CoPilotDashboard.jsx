import React, { useState } from "react";
import MapView from "./MapView";
import AgentChat from "./AgentChat";
import SmartStationHub from "./SmartStationHub";
import QueuePredictor from "./QueuePredictor";
import DriverAuth from "./DriverAuth";
import SearchPanel from "./SearchPanel";
import StationList from "./StationList";
import { useAuth } from "../context/AuthContext";
import { estimatedRangeKm } from "../utils/stationDisplay";

export default function CoPilotDashboard({ location, setLocation, batteryPct, setBatteryPct, targetSoc, setTargetSoc, connectorType, setConnectorType, radiusKm, setRadiusKm, recommendationData, onSearch, loading, userVehicle, userVehicles = [] }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStation, setSelectedStation] = useState(null);
  const { isAuthenticated, user, openLoginModal } = useAuth();
  const rangeKm = estimatedRangeKm(batteryPct, userVehicle, recommendationData?.estimated_range_km);
  const vehicleLabel = userVehicle?.model_name || 'No EV profile';

  // Default selected station to top recommendation when data refreshes
  React.useEffect(() => {
    if (recommendationData?.top_recommendation) {
      setSelectedStation(recommendationData.top_recommendation);
    }
  }, [recommendationData]);

  const navItemClass = (tabId) => 
    activeTab === tabId 
      ? "transition-all bg-[#181A19] text-[#FAF8F5] font-bold rounded-full px-4 py-1.5 shadow-md font-label-ui text-xs cursor-pointer"
      : "font-label-ui text-xs text-[#595C59] hover:text-[#181A19] px-4 py-1.5 transition-colors rounded-full hover:bg-[#F5F2EB] cursor-pointer";

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-body text-[#181A19] antialiased selection:bg-[#E8E4DC] selection:text-[#181A19]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-2xl border-b border-[#E8E4DC] shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="h-20 w-full px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-auto flex items-center cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <svg fill="none" height="38" viewBox="0 0 200 48" width="160" xmlns="http://www.w3.org/2000/svg"><rect fill="#181A19" height="40" rx="12" stroke="#2B2E2C" strokeWidth="1" width="40" x="4" y="4" /><path d="M25 10L16 26H24L21 38L32 22H24L25 10Z" fill="#FAF8F5" stroke="#E8E4DC" strokeLinejoin="round" strokeWidth="1.5" /><circle cx="34" cy="14" fill="#10B981" r="3" /><text fill="#181A19" fontFamily="'Outfit', sans-serif" fontSize="22" fontWeight="800" letterSpacing="-0.5px" x="54" y="27">Intelli<tspan fill="#4A4E4B">Charge</tspan></text><text fill="#6E716E" fontFamily="'Space Grotesk', sans-serif" fontSize="8.5" fontWeight="700" letterSpacing="2px" x="54" y="39">AI EV CO-PILOT</text></svg>
              </div>
            </div>
            <div className="hidden xl:flex items-center gap-2 bg-[#F5F2EB] border border-[#E8E4DC] px-4 py-1.5 rounded-full shadow-sm">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#181A19] animate-pulse"></span><span className="font-label-ui text-[11px] uppercase tracking-wider text-[#181A19] font-bold">{batteryPct <= 30 ? 'Low range' : 'Live vehicle'}</span></div>
              <span className="text-[#BDB8AE] text-xs">•</span><span className="font-label-ui text-xs text-[#181A19] font-semibold">{vehicleLabel}</span>
              <span className="text-[#BDB8AE] text-xs">•</span><span className="font-label-ui text-xs text-[#181A19] font-bold">{batteryPct}% SoC</span>
              <span className="text-[#BDB8AE] text-xs">•</span><span className="font-label-ui text-xs text-[#6E716E]">{rangeKm} km range</span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-2">
            <span className={navItemClass('dashboard')} onClick={() => setActiveTab('dashboard')}>Co-Pilot Dashboard</span>
            <span className={navItemClass('smart-station-hub')} onClick={() => setActiveTab('smart-station-hub')}>Smart Station Hub</span>
            <span className={navItemClass('queue-predictor')} onClick={() => setActiveTab('queue-predictor')}>Queue Predictor</span>
            <span className={navItemClass('driver-auth')} onClick={() => setActiveTab('driver-auth')}>Driver Auth</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-[#F5F2EB] border border-[#E8E4DC] px-4 py-1.5 rounded-full">
              <span className="font-label-ui text-[11px] uppercase text-[#6E716E] tracking-wider font-semibold">{location.region || 'Location'}</span>
              <span className="font-label-ui text-xs text-[#181A19] font-bold truncate max-w-[160px]">{location.label}</span>
            </div>
            <button
              type="button"
              onClick={() => (isAuthenticated ? setActiveTab('driver-auth') : openLoginModal())}
              className="w-9 h-9 rounded-full bg-[#181A19] flex items-center justify-center shadow-md cursor-pointer"
              title={user?.email || 'Sign in'}
            >
              <span className="material-symbols-outlined text-[#FAF8F5] text-[20px]">
                {isAuthenticated ? 'person' : 'login'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'dashboard' && (
        <main className="w-full pt-20 bg-[#F9F7F2] min-h-[calc(100vh-140px)]">
          <div className="flex flex-col w-full">
            <div className="relative w-full h-[calc(100vh-5rem)] overflow-hidden flex flex-col lg:flex-row">
              <div className="hidden lg:flex w-[360px] xl:w-[380px] h-full bg-[#FAF8F5]/95 backdrop-blur-xl border-r border-[#E8E4DC] overflow-y-auto p-4 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.03)] flex-col gap-6">
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
                  onSearch={onSearch}
                  loading={loading}
                />
                <StationList
                  recommendationData={recommendationData}
                  loading={loading}
                  onSelectStation={(st) => setSelectedStation(st)}
                  userVehicle={userVehicle}
                  currentSoc={batteryPct}
                  targetSoc={targetSoc}
                />
              </div>
              <div className="relative flex-1 h-full w-full bg-[#F3EFE9] overflow-hidden">
                <div className="absolute inset-0 w-full h-full z-0">
                  <MapView
                    userLocation={location}
                    stations={recommendationData?.ranked_stations || []}
                    topStationId={recommendationData?.top_recommendation?.station_id}
                    selectedStationId={selectedStation?.station_id}
                    onSelectStation={(st) => setSelectedStation(st)}
                  />
                </div>
                <div className="absolute top-4 left-4 right-4 lg:right-auto z-20 flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 bg-[#FFFFFF]/90 border border-[#E8E4DC] backdrop-blur-2xl px-4 py-1.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                    <div className="relative flex items-center justify-center">
                      <span className="w-3 h-3 rounded-full bg-[#181A19] animate-ping absolute opacity-50"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#181A19]"></span>
                    </div>
                    <span className="font-label-ui text-xs text-[#181A19]">Vehicle: <strong className="text-[#181A19] font-bold">{batteryPct}% SoC</strong> ({rangeKm} km)</span>
                    <span className="text-[#BDB8AE] text-xs">•</span>
                    <span className="font-label-ui text-[11px] uppercase tracking-wider text-[#6E716E] font-semibold">{vehicleLabel}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#FFFFFF]/90 border border-[#E8E4DC] backdrop-blur-2xl p-1 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                    <button
                      type="button"
                      onClick={() => setConnectorType(connectorType === 'CCS2' ? 'All' : 'CCS2')}
                      className={`flex items-center gap-1.5 px-4 py-1 rounded-full font-label-ui text-xs font-bold transition-all shadow-sm ${
                        connectorType === 'CCS2' ? 'bg-[#181A19] text-[#FAF8F5]' : 'text-[#595C59] hover:bg-[#F5F2EB]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">ev_station</span><span>CCS2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConnectorType('All')}
                      className={`flex items-center gap-1.5 px-4 py-1 rounded-full font-label-ui text-xs font-medium transition-all ${
                        connectorType === 'All' ? 'bg-[#181A19] text-[#FAF8F5]' : 'text-[#595C59] hover:bg-[#F5F2EB]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">bolt</span><span>All connectors</span>
                    </button>
                  </div>
                </div>
                <div className="absolute right-4 top-4 z-20 hidden sm:flex flex-col gap-1 bg-[#FFFFFF]/90 border border-[#E8E4DC] backdrop-blur-2xl p-1.5 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                  <button className="w-9 h-9 flex items-center justify-center rounded-xl text-[#181A19] hover:bg-[#F5F2EB] transition-colors" title="Zoom In"><span className="material-symbols-outlined text-[20px]">add</span></button>
                  <div className="w-full h-px bg-[#E8E4DC]"></div>
                  <button className="w-9 h-9 flex items-center justify-center rounded-xl text-[#181A19] hover:bg-[#F5F2EB] transition-colors" title="Zoom Out"><span className="material-symbols-outlined text-[20px]">remove</span></button>
                  <div className="w-full h-px bg-[#E8E4DC]"></div>
                  <button className="w-9 h-9 flex items-center justify-center rounded-xl text-[#181A19] hover:bg-[#F5F2EB] transition-colors" title="Recenter GPS"><span className="material-symbols-outlined text-[20px]">my_location</span></button>
                </div>
                {recommendationData?.top_recommendation && (
                  <div className="absolute bottom-4 left-4 right-4 lg:right-auto lg:w-[360px] xl:w-[400px] z-30">
                    <div className="bg-[#FFFFFF]/92 backdrop-blur-2xl border border-[rgba(220,215,205,0.7)] p-4 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] flex flex-col gap-4 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F5F2EB] border border-[#E8E4DC] text-[#181A19] font-label-ui text-[11px] uppercase tracking-wider flex items-center gap-1 font-bold">
                              <span className="material-symbols-outlined text-[12px] text-[#181A19]">verified</span> IntelliCharge Network
                            </span>
                          </div>
                          <h2 className="font-display text-[26px] leading-[30px] text-[#181A19] font-extrabold tracking-tight">{recommendationData.top_recommendation.station_name}</h2>
                          <p className="font-body text-xs text-[#6E716E] mt-0.5 font-medium">{recommendationData.top_recommendation.power_kw} kW · {recommendationData.top_recommendation.charger_count} chargers · {(recommendationData.top_recommendation.connector_types || []).join(', ')}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="px-3 py-1 rounded-full bg-[#181A19] text-[#FAF8F5] font-label-ui text-xs font-bold shadow-sm">Top Pick</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-[#F5F2EB] border border-[#E8E4DC] p-2 rounded-xl">
                        <div className="flex flex-col px-1">
                          <span className="font-label-ui text-[11px] uppercase text-[#6E716E] flex items-center gap-1 font-bold tracking-wider"><span className="material-symbols-outlined text-[14px]">directions_car</span> Distance</span>
                          <span className="font-metric text-[28px] leading-8 text-[#181A19] font-extrabold mt-0.5">{recommendationData.top_recommendation.breakdown.road_distance_km} km</span>
                        </div>
                        <div className="flex flex-col px-1 bg-[#FFFFFF] border border-[#E8E4DC] rounded-lg py-1 shadow-sm">
                          <span className="font-label-ui text-[11px] uppercase text-[#181A19] flex items-center gap-1 font-bold tracking-wider"><span className="material-symbols-outlined text-[14px] text-[#181A19]">hourglass_empty</span> Queue Time</span>
                          <span className="font-metric text-[28px] leading-8 text-[#181A19] font-extrabold mt-0.5">{recommendationData.top_recommendation.breakdown.predicted_wait_minutes < 1 ? '<1' : '~' + Math.round(recommendationData.top_recommendation.breakdown.predicted_wait_minutes)} mins</span>
                        </div>
                      </div>
                      <div className="bg-[#F5F2EB] border border-[#E8E4DC] px-3 py-2.5 rounded-xl flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#181A19] text-[18px] mt-0.5 shrink-0 font-bold">auto_awesome</span>
                        <p className="font-body text-xs text-[#595C59] leading-relaxed"><strong className="text-[#181A19] font-bold">AI Note:</strong> Chosen based on real-time traffic, queue prediction models, and live charger status telemetry.</p>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <a className="flex-1 flex items-center justify-center gap-2 bg-[#181A19] hover:bg-[#2B2E2C] text-[#FAF8F5] py-2.5 px-4 rounded-xl font-display text-[13px] font-extrabold tracking-tight transition-all shadow-md" href={recommendationData.top_recommendation.google_maps_url || "https://maps.google.com"} rel="noopener noreferrer" target="_blank">
                          <span className="material-symbols-outlined text-[18px]">near_me</span>
                          <span className="">Navigate via Google Maps</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <AgentChat currentLat={location.lat} currentLng={location.lng} currentBattery={batteryPct} currentConnector={connectorType} />
            </div>
          </div>
        </main>
      )}

      {activeTab === 'smart-station-hub' && (
        <div className="pt-20">
          <SmartStationHub
            recommendationData={recommendationData}
            loading={loading}
            batteryPct={batteryPct}
            targetSoc={targetSoc}
            userVehicle={userVehicle}
            userVehicles={userVehicles}
          />
        </div>
      )}

      {activeTab === 'queue-predictor' && (
        <div className="pt-20">
          <QueuePredictor
            recommendationData={recommendationData}
            loading={loading}
            batteryPct={batteryPct}
            targetSoc={targetSoc}
            userVehicle={userVehicle}
            userVehicles={userVehicles}
          />
        </div>
      )}

      {activeTab === 'driver-auth' && (
        <div className="pt-20">
          <DriverAuth userVehicle={userVehicle} batteryPct={batteryPct} targetSoc={targetSoc} />
        </div>
      )}

      <footer className="w-full bg-[#FAF8F5] border-t border-[#E8E4DC] py-4 shadow-sm z-40 relative">
        <div className="w-full px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
            <span className="font-label-ui text-xs text-[#6E716E] font-medium">
              {recommendationData ? `${recommendationData.reachable_count} reachable of ${recommendationData.total_found} stations` : 'Connecting to station network…'}
            </span>
          </div>
          <div className="font-body text-xs text-[#9E9B93]">© 2024 IntelliCharge Autonomous Network. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

