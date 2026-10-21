import React, { useState, useEffect } from 'react';
import {
  fetchStationQueue,
  planQueueArrival,
  joinQueue,
  checkInQueue,
  cancelQueueRequest,
  fetchMyQueueRequests,
} from '../services/api';

export default function VirtualQueueModal({
  isOpen,
  onClose,
  station,
  userVehicle,
  userVehicles = [],
  batteryPct = 25,
  defaultTargetSoc = 80,
  onQueueUpdated,
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(userVehicle?.id || '');
  const [currentSoc, setCurrentSoc] = useState(batteryPct || 25);
  const [targetSoc, setTargetSoc] = useState(defaultTargetSoc || 80);
  const [arrivalOption, setArrivalOption] = useState('now'); // 'now', '15', '30', '45', '60', 'custom'
  const [customArrival, setCustomArrival] = useState('');
  
  const [queueStatus, setQueueStatus] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (userVehicle?.id) {
      setSelectedVehicleId(userVehicle.id);
    } else if (userVehicles.length > 0) {
      setSelectedVehicleId(userVehicles[0].id);
    }
  }, [userVehicle, userVehicles]);

  useEffect(() => {
    setCurrentSoc(batteryPct || 25);
  }, [batteryPct]);

  // Load station queue status & user's active requests when modal opens
  useEffect(() => {
    if (!isOpen || !station) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const loadData = async () => {
      setLoading(true);
      try {
        const q = await fetchStationQueue(station.id || station.station_id);
        setQueueStatus(q);

        const myReqs = await fetchMyQueueRequests(station.id || station.station_id);
        if (myReqs && myReqs.length > 0) {
          // Find active request if any
          const active = myReqs.find((r) => ['PLANNED', 'WAITING', 'CHARGING'].includes(r.status));
          setActiveRequest(active || null);
        } else {
          setActiveRequest(null);
        }
      } catch (err) {
        console.error('Failed to load queue data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isOpen, station]);

  if (!isOpen || !station) return null;

  const stationId = station.id || station.station_id;
  const stationName = station.name || station.station_name;
  const powerKw = station.power_kw || 50;
  const chargerCount = queueStatus?.total_chargers ?? station.charger_count ?? 4;
  const availableChargers = queueStatus?.available_chargers ?? chargerCount;
  const waitingVehicles = queueStatus?.waiting_vehicles ?? 0;
  const plannedRequests = queueStatus?.planned_requests ?? 0;
  const estimatedWait = queueStatus?.estimated_wait_minutes ?? station.breakdown?.predicted_wait_minutes ?? 0;

  // Selected vehicle details
  const currentVehicle = userVehicles.find((v) => String(v.id) === String(selectedVehicleId)) || userVehicle;
  const vehicleConnector = currentVehicle?.connector_type || 'CCS2';

  // Check connector compatibility
  const stationConnectors = (station.connector_types || []).join
    ? station.connector_types.join(', ')
    : String(station.connector_types || '');
  const isCompatible = stationConnectors.toLowerCase().includes(vehicleConnector.toLowerCase().replace(/[\s-_]/g, '')) ||
    stationConnectors.toLowerCase().includes('ccs2') && vehicleConnector.toLowerCase().includes('ccs');

  // Charging duration preview calculation
  const batteryCap = currentVehicle?.battery_capacity_kwh || 40;
  const effectivePower = Math.min(powerKw, currentVehicle?.max_charging_power_kw || 50);
  const energyKwh = Math.max(0, batteryCap * ((targetSoc - currentSoc) / 100));
  const estimatedDurationMins = effectivePower > 0 ? Math.round((energyKwh / effectivePower) * 60 / 0.9) : 30;

  // Compute ISO arrival timestamp based on selection
  const computeArrivalIso = () => {
    const now = new Date();
    if (arrivalOption === 'now') return null; // immediate
    if (arrivalOption === 'custom' && customArrival) {
      return new Date(customArrival).toISOString();
    }
    const mins = parseInt(arrivalOption, 10) || 30;
    return new Date(now.getTime() + mins * 60 * 1000).toISOString();
  };

  const handlePlanOrJoin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const effectiveVehicleId = selectedVehicleId || userVehicle?.id || (userVehicles.length > 0 ? userVehicles[0].id : null);
    if (!effectiveVehicleId) {
      setErrorMsg('Please select an EV profile or create one first.');
      return;
    }
    if (targetSoc <= currentSoc) {
      setErrorMsg('Target battery percentage must be greater than current percentage.');
      return;
    }

    setSubmitting(true);
    try {
      const arrivalTs = computeArrivalIso();
      let res;
      if (arrivalTs) {
        res = await planQueueArrival(stationId, effectiveVehicleId, currentSoc, targetSoc, arrivalTs);
        setSuccessMsg(`Planned request saved! Expected arrival: ${new Date(arrivalTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } else {
        res = await joinQueue(stationId, effectiveVehicleId, currentSoc, targetSoc);
        setSuccessMsg(`Checked in to virtual queue! Estimated wait: ~${Math.round(res.estimated_wait_minutes)} mins`);
      }

      // Refresh state
      const updatedQueue = await fetchStationQueue(stationId);
      setQueueStatus(updatedQueue);
      const myReqs = await fetchMyQueueRequests(stationId);
      const active = myReqs.find((r) => ['PLANNED', 'WAITING', 'CHARGING'].includes(r.status));
      setActiveRequest(active || null);

      if (onQueueUpdated) onQueueUpdated(stationId, updatedQueue);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async () => {
    if (!activeRequest) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await checkInQueue(stationId, activeRequest.id);
      setSuccessMsg(`Arrived and checked in! You are now in the station's virtual queue (Estimated wait: ~${Math.round(res.estimated_wait_minutes)} mins).`);

      const updatedQueue = await fetchStationQueue(stationId);
      setQueueStatus(updatedQueue);
      const myReqs = await fetchMyQueueRequests(stationId);
      const active = myReqs.find((r) => ['PLANNED', 'WAITING', 'CHARGING'].includes(r.status));
      setActiveRequest(active || null);

      if (onQueueUpdated) onQueueUpdated(stationId, updatedQueue);
    } catch (err) {
      setErrorMsg(err.message || 'Check-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRequest) return;
    if (!window.confirm('Cancel your virtual queue request?')) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      await cancelQueueRequest(stationId, activeRequest.id);
      setSuccessMsg('Request cancelled successfully.');
      setActiveRequest(null);

      const updatedQueue = await fetchStationQueue(stationId);
      setQueueStatus(updatedQueue);

      if (onQueueUpdated) onQueueUpdated(stationId, updatedQueue);
    } catch (err) {
      setErrorMsg(err.message || 'Cancellation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-[#F5F2EB] hover:bg-[#E8E4DC] text-[#6E716E] flex items-center justify-center transition-colors"
          aria-label="Close modal"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Modal Header */}
        <div className="pr-10 mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#10B981] text-xs font-bold font-mono uppercase tracking-wider">
              {station.operator || 'EV Network'}
            </span>
            <span className="text-xs text-[#9E9B93] font-mono">
              {powerKw} kW · {chargerCount} Chargers
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-[#181A19]">
            {stationName}
          </h2>
          <p className="text-xs text-[#6E716E] mt-0.5">
            {station.address || 'Palghar / MMR Region'}
          </p>
        </div>

        {/* MANDATORY PRODUCT TRUTH NOTICE */}
        <div className="mb-6 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
          <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">info</span>
          <div>
            <strong className="font-semibold block mb-0.5">Virtual Queue Estimate Only</strong>
            Virtual estimate only — this does not reserve a physical charger. Station availability is not confirmed by the operator.
          </div>
        </div>

        {/* Station Virtual Queue Status Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F5F2EB] border border-[#E8E4DC] mb-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9B93] block">
              In Virtual Queue
            </span>
            <span className="text-xl font-bold font-mono text-[#10B981]">
              {waitingVehicles}
            </span>
            <span className="text-[10px] text-[#6E716E] block">checked in</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9B93] block">
              Planned Arrivals
            </span>
            <span className="text-xl font-bold font-mono text-amber-600">
              {plannedRequests}
            </span>
            <span className="text-[10px] text-[#6E716E] block">incoming (24h)</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9B93] block">
              Charger Stalls
            </span>
            <span className="text-xl font-bold font-mono text-[#181A19]">
              {availableChargers}/{chargerCount}
            </span>
            <span className="text-[10px] text-[#6E716E] block">estimated free</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9B93] block">
              Estimated Wait
            </span>
            <span className="text-xl font-bold font-mono text-[#181A19]">
              ~{Math.round(estimatedWait)}m
            </span>
            <span className="text-[10px] text-[#6E716E] block">prediction</span>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Existing Active Request Banner */}
        {activeRequest ? (
          <div className="p-5 rounded-2xl border-2 border-[#10B981]/30 bg-emerald-50/40 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#10B981] text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {activeRequest.status === 'PLANNED' ? 'Planned Arrival Request' : 'Active in Virtual Queue'}
              </span>
              <span className="text-xs text-[#6E716E] font-mono">
                Req #{activeRequest.id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <span className="text-[#9E9B93] block">Status</span>
                <span className="font-semibold text-[#181A19]">
                  {activeRequest.status === 'PLANNED'
                    ? 'Planned (Pending arrival check-in)'
                    : 'Checked In (Waiting for stall)'}
                </span>
              </div>
              <div>
                <span className="text-[#9E9B93] block">Expected Arrival</span>
                <span className="font-semibold text-[#181A19]">
                  {activeRequest.expected_arrival_at
                    ? new Date(activeRequest.expected_arrival_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Immediate / At Station'}
                </span>
              </div>
              <div>
                <span className="text-[#9E9B93] block">Est. Charging Duration</span>
                <span className="font-semibold text-[#181A19]">
                  ~{Math.round(activeRequest.estimated_duration_minutes)} minutes
                </span>
              </div>
              <div>
                <span className="text-[#9E9B93] block">Est. Start Time</span>
                <span className="font-semibold text-[#181A19]">
                  {activeRequest.estimated_start_at
                    ? new Date(activeRequest.estimated_start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Evaluating queue'}
                </span>
              </div>
            </div>

            {/* Action buttons for active request */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#10B981]/20">
              {activeRequest.status === 'PLANNED' && (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">where_to_vote</span>
                  I’ve arrived — join virtual queue
                </button>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2.5 rounded-full bg-[#FFFFFF] border border-red-300 hover:bg-red-50 text-red-600 font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
                Cancel Request
              </button>
            </div>
          </div>
        ) : (
          /* Request Creation Form */
          <form onSubmit={handlePlanOrJoin} className="space-y-5">
            {/* 1. Vehicle Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E716E] mb-1.5">
                1. Select Vehicle
              </label>
              {userVehicles.length > 0 ? (
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#F5F2EB] border border-[#E8E4DC] text-xs font-semibold text-[#181A19] focus:outline-none focus:border-[#10B981]"
                >
                  {userVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.model_name} ({v.connector_type} · {v.battery_capacity_kwh} kWh)
                    </option>
                  ))}
                </select>
              ) : currentVehicle ? (
                <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#E8E4DC] text-xs text-[#181A19] font-semibold flex items-center justify-between">
                  <span>{currentVehicle.model_name} ({currentVehicle.connector_type || 'CCS2'} · {currentVehicle.battery_capacity_kwh || 40.5} kWh)</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#F5F2EB] border border-[#E8E4DC] text-xs text-[#6E716E] flex items-center justify-between">
                  <span>Demo Vehicle: Nexon EV Max (CCS2 · 40.5 kWh)</span>
                </div>
              )}
              {/* Connector notice */}
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                <span className="text-[#9E9B93]">Station connectors:</span>
                <span className="font-semibold text-[#181A19]">{stationConnectors || 'CCS2, Type 2'}</span>
                {!isCompatible && (
                  <span className="text-red-500 font-bold ml-1">(Warning: Connector may not match!)</span>
                )}
              </div>
            </div>

            {/* 2. Battery SOC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#6E716E] mb-1">
                  <span>Current Battery</span>
                  <span className="text-[#10B981] font-mono">{currentSoc}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="99"
                  value={currentSoc}
                  onChange={(e) => setCurrentSoc(parseInt(e.target.value, 10))}
                  className="w-full accent-[#10B981]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-[#6E716E] mb-1">
                  <span>Target Battery</span>
                  <span className="text-[#10B981] font-mono">{targetSoc}%</span>
                </div>
                <input
                  type="range"
                  min={Math.min(100, currentSoc + 1)}
                  max="100"
                  value={targetSoc}
                  onChange={(e) => setTargetSoc(parseInt(e.target.value, 10))}
                  className="w-full accent-[#10B981]"
                />
              </div>
            </div>

            {/* Estimated energy & duration preview */}
            <div className="p-3 rounded-xl bg-[#F5F2EB] text-xs flex justify-between items-center text-[#6E716E]">
              <span>Estimated Energy Needed: <strong className="text-[#181A19]">{energyKwh.toFixed(1)} kWh</strong></span>
              <span>Estimated Duration: <strong className="text-[#181A19]">~{estimatedDurationMins} mins</strong></span>
            </div>

            {/* 3. Expected Arrival Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E716E] mb-2">
                2. Expected Arrival Time
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { id: 'now', label: 'Now (At Station)' },
                  { id: '15', label: '+15 mins' },
                  { id: '30', label: '+30 mins' },
                  { id: '45', label: '+45 mins' },
                  { id: '60', label: '+1 hour' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setArrivalOption(opt.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                      arrivalOption === opt.id
                        ? 'bg-[#10B981] text-white border-[#10B981] shadow-sm'
                        : 'bg-[#F5F2EB] text-[#6E716E] border-[#E8E4DC] hover:border-[#10B981]/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !isCompatible}
                className="w-full py-3.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all"
              >
                <span className="material-symbols-outlined text-lg">
                  {arrivalOption === 'now' ? 'bolt' : 'schedule'}
                </span>
                {submitting
                  ? 'Submitting…'
                  : arrivalOption === 'now'
                  ? 'Join virtual queue (I have arrived)'
                  : 'Plan charging arrival'}
              </button>
              <p className="text-[11px] text-[#9E9B93] text-center mt-2">
                Based on IntelliCharge requests and historical estimates. Does not reserve physical hardware.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
