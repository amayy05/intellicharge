import React from 'react';
import StationCard from './StationCard';
import { Sparkles, Info, ShieldAlert } from 'lucide-react';

export default function StationList({
  recommendationData,
  loading,
  onSelectStation,
}) {
  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Evaluating live network & predicting arrival queues...</p>
      </div>
    );
  }

  if (!recommendationData || !recommendationData.ranked_stations || recommendationData.ranked_stations.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          No charging stations found. Adjust your origin location, radius, or battery percentage.
        </p>
      </div>
    );
  }

  const { ranked_stations, top_recommendation, summary_insight, reachable_count, total_found } = recommendationData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Insight Summary Banner */}
      {summary_insight && (
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.8rem',
            color: '#e2e8f0',
          }}
        >
          <Sparkles size={18} color="#06b6d4" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#06b6d4', display: 'block', marginBottom: '2px' }}>AI Routing Recommendation</strong>
            <span>{summary_insight}</span>
          </div>
        </div>
      )}

      {/* Reachability Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', fontSize: '0.75rem', color: '#94a3b8' }}>
        <span>
          Showing <strong>{ranked_stations.length}</strong> stations ({reachable_count} safely reachable)
        </span>
        <span>Sorted by multi-factor score (ETA + wait time)</span>
      </div>

      {/* Ranked Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {ranked_stations.map((station, index) => (
          <StationCard
            key={station.station_id}
            station={station}
            isTop={index === 0}
            onSelect={() => onSelectStation && onSelectStation(station)}
          />
        ))}
      </div>
    </div>
  );
}
