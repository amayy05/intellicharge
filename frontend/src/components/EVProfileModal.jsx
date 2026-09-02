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
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '90%', padding: '32px' }}>
        <h2 style={{ color: 'var(--text-dark)', marginTop: 0, marginBottom: '8px' }}>Select Your EV</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          To accurately predict your waiting and charging times, we need to know your vehicle's specifications.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Vehicle Model
            </label>
            <select 
              className="input-field"
              value={selectedEv.name}
              onChange={(e) => {
                const ev = POPULAR_EVS.find(x => x.name === e.target.value);
                if (ev) setSelectedEv(ev);
              }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}
            >
              {POPULAR_EVS.map(ev => (
                <option key={ev.name} value={ev.name}>{ev.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Battery Capacity</label>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedEv.capacity} kWh</div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Max Charging Power</label>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedEv.maxPower} kW</div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Connector</label>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{selectedEv.connector}</div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '16px', fontSize: '16px', marginTop: '8px' }}>
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
