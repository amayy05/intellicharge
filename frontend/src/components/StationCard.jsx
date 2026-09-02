import React, { useState } from 'react';
import { joinQueue } from '../services/api';

export default function StationCard({ station, onSelect, userVehicle, currentSoc, targetSoc }) {
  const { breakdown } = station;
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  return (
    <div
      onClick={onSelect}
      className="card"
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <h3 style={{ fontSize: '16px', margin: 0 }}>{station.station_name}</h3>
      
      {/* Key Information Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ 
          background: 'var(--bg-primary)', 
          border: '1px solid var(--border-color)', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {breakdown.road_distance_km} km
        </span>
        <span style={{ 
          background: 'rgba(245, 158, 11, 0.1)', 
          color: 'var(--warning)', 
          border: '1px solid rgba(245, 158, 11, 0.2)', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {breakdown.predicted_wait_minutes < 1 ? '<1' : '~' + Math.round(breakdown.predicted_wait_minutes)} min wait
        </span>
        <span style={{ 
          background: 'rgba(40, 168, 121, 0.1)', 
          color: 'var(--primary-accent)', 
          border: '1px solid rgba(40, 168, 121, 0.2)', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          Compatible
        </span>
      </div>

      {/* Secondary Information */}
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        • {station.connector_types.join(', ')}<br/>
        • {station.charger_count} chargers ({station.power_kw} kW)
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <a
          href={station.google_maps_url}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ flex: 1, textDecoration: 'none', padding: '10px', textAlign: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          View Map
        </a>
        <button
          className="btn-primary"
          style={{ flex: 1, padding: '10px' }}
          disabled={joining || joined || !userVehicle}
          onClick={async (e) => {
            e.stopPropagation();
            if (!userVehicle) {
              alert("Please configure your EV profile first");
              return;
            }
            setJoining(true);
            try {
              const res = await joinQueue(station.station_id, userVehicle.id, currentSoc, targetSoc);
              setJoined(true);
              alert(`Success! You have joined the virtual queue.\nEstimated Start Time: ${new Date(res.estimated_start_time).toLocaleTimeString()}\nEstimated Wait: ${res.estimated_wait_minutes} mins`);
            } catch (err) {
              console.error(err);
              alert('Failed to join queue');
            } finally {
              setJoining(false);
            }
          }}
        >
          {joined ? 'Queue Joined ✅' : joining ? 'Joining...' : 'Join Queue'}
        </button>
      </div>
    </div>
  );
}
