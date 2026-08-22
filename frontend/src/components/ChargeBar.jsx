/**
 * ChargeBar — §4 Signature Element
 *
 * A horizontal bar that encodes PREDICTED WAIT TIME, not charge level.
 * Full + Volt Cyan = short wait. Mostly empty + Signal Red = long wait.
 * Same visual grammar as a driver's own dashboard — instinctively readable.
 *
 * Appears in: ranked list cards, map pin tooltips, agent chat responses.
 * One visual vocabulary. Never three different treatments.
 *
 * §8 Accessibility: color is NEVER the only signal — the numeral always sits beside it.
 */

import React from 'react';

const MAX_WAIT_MINUTES = 30; // ceiling — anything >= 30 renders as fully red / empty
const TOTAL_SEGMENTS = 10;

/**
 * Returns the hex color for the filled segments based on wait severity.
 * Volt Cyan = good. Signal Red = poor. Copper amber = mid.
 */
function waitColor(waitMinutes) {
  if (waitMinutes <= 5)  return '#3FD6C4'; // --volt-cyan: short wait
  if (waitMinutes <= 12) return '#5EC9BA'; // volt-cyan → transition
  if (waitMinutes <= 18) return '#C8712E'; // --copper: mid wait
  if (waitMinutes <= 24) return '#D4631A'; // copper → red transition
  return '#E85C4A';                         // --signal-red: long wait
}

/**
 * Returns how many segments are "filled" (good slots remaining).
 * 0 wait = 10 filled. MAX_WAIT+ = 0 filled.
 */
function filledCount(waitMinutes) {
  const ratio = Math.max(0, Math.min(1, 1 - waitMinutes / MAX_WAIT_MINUTES));
  return Math.round(ratio * TOTAL_SEGMENTS);
}

export default function ChargeBar({ waitMinutes = 0, loading = false, size = 'md', showLabel = true }) {
  const filled = filledCount(waitMinutes);
  const color = waitColor(waitMinutes);

  // Size variants
  const segW = size === 'sm' ? 12 : size === 'lg' ? 22 : 18;
  const segH = size === 'sm' ? 5  : size === 'lg' ? 10 : 8;
  const fontSize = size === 'sm' ? '0.7rem' : size === 'lg' ? '0.9rem' : '0.8rem';

  if (loading) {
    return (
      <div className="charge-bar" role="status" aria-label="Loading wait time">
        <div className="charge-bar__segments">
          {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
            <div
              key={i}
              className="charge-bar__seg charge-bar__seg--shimmer"
              style={{ width: segW, height: segH }}
            />
          ))}
        </div>
        {showLabel && (
          <span className="charge-bar__label text-dim font-mono" style={{ fontSize }}>
            — min
          </span>
        )}
      </div>
    );
  }

  const label = waitMinutes === 0
    ? 'Now'
    : waitMinutes < 1
    ? '< 1 min'
    : `${Math.round(waitMinutes)} min`;

  return (
    <div
      className="charge-bar"
      role="meter"
      aria-label={`Predicted wait: ${label}`}
      aria-valuenow={waitMinutes}
      aria-valuemin={0}
      aria-valuemax={MAX_WAIT_MINUTES}
    >
      <div className="charge-bar__segments">
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => {
          const isFilled = i < filled;
          return (
            <div
              key={i}
              className="charge-bar__seg"
              style={{
                width: segW,
                height: segH,
                background: isFilled ? color : undefined,
              }}
            />
          );
        })}
      </div>
      {showLabel && (
        <span
          className="charge-bar__label font-mono"
          style={{ color, fontSize, fontWeight: 500 }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
