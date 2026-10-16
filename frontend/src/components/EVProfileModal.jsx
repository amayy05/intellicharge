import React, { useState } from 'react';
import { saveEVProfile } from '../services/api';

const POPULAR_EVS = [
  { name: 'Tata Nexon EV', capacity: 40.5, maxPower: 30, connector: 'CCS2' },
  { name: 'MG ZS EV', capacity: 50.3, maxPower: 50, connector: 'CCS2' },
  { name: 'Hyundai IONIQ 5', capacity: 72.6, maxPower: 350, connector: 'CCS2' },
  { name: 'BYD Atto 3', capacity: 60.48, maxPower: 80, connector: 'CCS2' },
  { name: 'Tesla Model 3 (Standard)', capacity: 57.5, maxPower: 170, connector: 'CCS2' }
];

export default function EVProfileModal({ onProfileSaved }) {
  const [selectedEv, setSelectedEv] = useState(POPULAR_EVS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dbVehicle = await saveEVProfile({
        model_name: selectedEv.name,
        battery_capacity_kwh: selectedEv.capacity,
        max_charging_power_kw: selectedEv.maxPower,
        connector_type: selectedEv.connector
      });
      // Pass the saved vehicle ID up to the parent
      onProfileSaved(dbVehicle);
    } catch (err) {
      console.error(err);
      alert('Failed to save EV profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#181A19]/60 backdrop-blur-md">
      <div className="bg-[#FAF8F5] w-[90%] max-w-[500px] rounded-3xl p-8 shadow-[0_16px_40px_rgba(0,0,0,0.1)] border border-[#E8E4DC]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#EFECE6] flex items-center justify-center border border-[#E8E4DC]">
            <span className="material-symbols-outlined text-[#181A19]">electric_car</span>
          </div>
          <div>
            <h2 className="font-display text-[22px] font-extrabold text-[#181A19] leading-tight">Select Your EV</h2>
            <p className="font-body text-xs text-[#6E716E] font-medium">We need this to accurately predict waiting & charging times.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="font-label-ui text-[11px] uppercase tracking-wider text-[#6E716E] font-bold block mb-2">
              Vehicle Model
            </label>
            <div className="relative">
              <select 
                className="w-full bg-[#FFFFFF] border border-[#E8E4DC] text-[#181A19] font-body text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-[#181A19] focus:ring-1 focus:ring-[#181A19] transition-all shadow-sm"
                value={selectedEv.name}
                onChange={(e) => {
                  const ev = POPULAR_EVS.find(x => x.name === e.target.value);
                  if (ev) setSelectedEv(ev);
                }}
              >
                {POPULAR_EVS.map(ev => (
                  <option key={ev.name} value={ev.name}>{ev.name}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#BDB8AE] pointer-events-none">expand_more</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-[#F5F2EB] border border-[#E8E4DC] p-3 rounded-2xl">
            <div className="flex flex-col gap-1">
              <label className="font-label-ui text-[10px] uppercase text-[#6E716E] font-bold tracking-wider">Battery</label>
              <div className="font-metric text-lg font-bold text-[#181A19]">{selectedEv.capacity} <span className="text-sm font-medium text-[#6E716E]">kWh</span></div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-ui text-[10px] uppercase text-[#6E716E] font-bold tracking-wider">Max Power</label>
              <div className="font-metric text-lg font-bold text-[#181A19]">{selectedEv.maxPower} <span className="text-sm font-medium text-[#6E716E]">kW</span></div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-ui text-[10px] uppercase text-[#6E716E] font-bold tracking-wider">Connector</label>
              <div className="font-metric text-lg font-bold text-[#181A19]">{selectedEv.connector}</div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#181A19] hover:bg-[#2B2E2C] text-[#FAF8F5] font-label-ui text-[13px] font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                Saving Profile...
              </>
            ) : (
              <>
                Save & Continue
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
