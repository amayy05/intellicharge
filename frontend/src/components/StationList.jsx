/**
 * StationList — §5.1 ranked list + §6 states
 *
 * §6 States handled:
 *   - Loading: ChargeBar shimmer skeletons (same layout, no shift when data lands)
 *   - Empty: "No stations found within X km. Try widening your search radius…" — no apology, no dead end
 *   - Normal: ranked station cards
 */

import React from 'react';
import StationCard from './StationCard';
import ChargeBar from './ChargeBar';

// §6: shimmer skeleton — same shape as real card so layout doesn't shift on load
function SkeletonCard() {
  return (
    <div
      className="card"
      style={{ padding: '14px 16px', borderLeft: '3px solid var(--slate-border)' }}
      aria-hidden="true"
    >
      {/* Fake rank + name lines */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
        <div style={{ width: 28, height: 18, background: 'var(--slate-dim)', borderRadius: 'var(--radius-chip)', animation: 'shimmer 1.6s ease-in-out infinite' }} />
        <div style={{ flex: 1, height: 14, background: 'var(--slate-dim)', borderRadius: 3, animation: 'shimmer 1.6s ease-in-out infinite 0.1s' }} />
      </div>
      <div style={{ height: 10, width: '60%', background: 'var(--slate-dim)', borderRadius: 3, marginBottom: '12px', animation: 'shimmer 1.6s ease-in-out infinite 0.2s' }} />
      {/* §6: ChargeBar shimmer — previews the signature element so nothing looks unfamiliar when data lands */}
      <ChargeBar loading={true} />
    </div>
  );
}

export default function StationList({ recommendationData, loading, onSelectStation }) {

  // §6 Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} aria-label="Loading stations" aria-busy="true">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const stations = recommendationData?.ranked_stations ?? [];

  // §6 Empty state: "No stations found… Try widening your search radius…" — states what happened and what to do next, no apology
  if (!loading && stations.length === 0) {
    return (
      <div
        className="card"
        style={{ padding: '20px 16px', textAlign: 'center' }}
        role="status"
        aria-live="polite"
      >
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--fog)', marginBottom: '6px' }}>
          No stations found within {recommendationData?.radius_km ?? 50} km.
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--fog-muted)', lineHeight: 1.5 }}>
          Try widening your search radius or checking a different connector type.
        </p>
      </div>
    );
  }

  const top = recommendationData?.top_recommendation;
  const insight = recommendationData?.summary_insight;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* AI insight — plain language, §10 */}
      {insight && (
        <p
          style={{
            fontSize: '0.78rem',
            color: 'var(--fog-muted)',
            padding: '8px 12px',
            background: 'var(--slate-dim)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--slate-border)',
            lineHeight: 1.5,
          }}
          role="status"
          aria-live="polite"
        >
          {insight}
        </p>
      )}

      {/* Ranked cards */}
      {stations.map((st, idx) => (
        <StationCard
          key={st.station_id}
          station={st}
          isTop={idx === 0}
          onSelect={() => onSelectStation?.(st)}
        />
      ))}
    </div>
  );
}
