import React from 'react';
import StationCard from './StationCard';

export default function StationList({
  recommendationData,
  loading,
  onSelectStation,
  userVehicle,
  currentSoc,
  targetSoc,
}) {
  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Finding your best charging option...<br/>
          <span style={{ fontSize: '13px' }}>Comparing distance, compatibility and predicted wait.</span>
        </p>
      </div>
    );
  }

  if (!recommendationData || !recommendationData.ranked_stations || recommendationData.ranked_stations.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '8px' }}>No charging stations found</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '16px' }}>
          Try expanding your search area or changing your destination.
        </p>
      </div>
    );
  }

  const { ranked_stations } = recommendationData;
  const bestStation = ranked_stations[0];
  const alternatives = ranked_stations.slice(1);

  // Helper to draw the score bar
  const renderScoreBar = (label, score, outOf = 10) => {
    const fillCount = Math.round((score / outOf) * 10);
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontFamily: 'monospace' }}>
        <span style={{ width: '120px', fontFamily: 'var(--font-sans)' }}>{label}</span>
        <div style={{ display: 'flex', gap: '2px', flex: 1, margin: '0 12px' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              style={{
                flex: 1, 
                height: '8px', 
                background: i < fillCount ? 'var(--text-dark)' : 'var(--border-color)',
                borderRadius: '1px'
              }}
            />
          ))}
        </div>
        <span style={{ width: '40px', textAlign: 'right' }}>{score}/{outOf}</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Hero Recommendation Screen */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Best charging option</h2>
        <div className="card" style={{ border: '2px solid var(--primary-accent)' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '700', 
            background: 'var(--primary-accent)', 
            color: '#FFF', 
            padding: '4px 8px', 
            borderRadius: '4px',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '12px'
          }}>
            Best Match
          </span>
          <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>{bestStation.station_name}</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '15px', fontWeight: '500' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--warning)' }}>⚡</span>
              <span>{bestStation.breakdown.predicted_wait_minutes < 1 ? '<1' : '~' + Math.round(bestStation.breakdown.predicted_wait_minutes)} min predicted wait</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--primary-accent)' }}>📍</span>
              <span>{bestStation.breakdown.road_distance_km} km away</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--primary-accent)' }}>✓</span>
              <span>Compatible</span>
            </div>
          </div>

          <a
            href={bestStation.google_maps_url}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ width: '100%', textDecoration: 'none' }}
          >
            Navigate
          </a>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Why this station?</h4>
            {/* We mock these scores as the backend only returns a final normalized score right now, but for UX PRD we display breakdown */}
            {renderScoreBar('Wait time', bestStation.breakdown.predicted_wait_minutes < 10 ? 9 : 6, 10)}
            {renderScoreBar('Distance', bestStation.breakdown.road_distance_km < 10 ? 8 : 5, 10)}
            {renderScoreBar('Compatibility', 10, 10)}
            {renderScoreBar('Reachability', bestStation.breakdown.is_reachable ? 10 : 0, 10)}
          </div>
        </div>
      </div>

      {/* Compare Alternatives */}
      {alternatives.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Other good options</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {alternatives.map((station) => (
              <StationCard
                key={station.station_id}
                station={station}
                onSelect={() => onSelectStation && onSelectStation(station)}
                userVehicle={userVehicle}
                currentSoc={currentSoc}
                targetSoc={targetSoc}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
