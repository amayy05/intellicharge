/**
 * Navbar — §5.1 "flat top bar, no shadow"
 * PRD: flat top bar, Copper brand mark, "Ask IntelliCharge" persistent entry.
 * §10 Copy: "Ask IntelliCharge" not "Chat now".
 */

import React from 'react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header
      style={{
        background: 'var(--slate)',
        borderBottom: '1px solid var(--slate-border)',
        padding: '0 20px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        /* §3: no shadow — border is the honest separator on dark surfaces */
      }}
    >
      {/* Brand mark — Copper accent, §3 */}
      <button
        onClick={() => setActiveTab('map')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0',
        }}
        aria-label="IntelliCharge — go to map view"
      >
        {/* Copper lightning bolt */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#C8712E" />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: '700',
            color: 'var(--fog)',
            letterSpacing: '-0.02em',
          }}
        >
          IntelliCharge
        </span>
      </button>

      {/* Tab indicator — minimal, no heavy pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => setActiveTab('map')}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 12px',
            borderRadius: 'var(--radius-btn)',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-body)',
            fontWeight: activeTab === 'map' ? '600' : '400',
            color: activeTab === 'map' ? 'var(--fog)' : 'var(--fog-muted)',
            borderBottom: activeTab === 'map' ? '2px solid var(--copper)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'color 0.15s',
          }}
        >
          Stations
        </button>
        {/* §10 Copy: "Ask IntelliCharge" not "Chat now" */}
        <button
          onClick={() => setActiveTab('agent')}
          style={{
            background: activeTab === 'agent' ? 'var(--copper-muted)' : 'none',
            border: activeTab === 'agent' ? '1px solid var(--copper-border)' : '1px solid transparent',
            padding: '6px 12px',
            borderRadius: 'var(--radius-btn)',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-body)',
            fontWeight: activeTab === 'agent' ? '600' : '400',
            color: activeTab === 'agent' ? 'var(--copper)' : 'var(--fog-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          💬 Ask IntelliCharge
        </button>
      </div>

      {/* Right — city indicator */}
      <span style={{ fontSize: '0.75rem', color: 'var(--fog-dim)', fontFamily: 'var(--font-data)' }}>
        MMR · Palghar
      </span>
    </header>
  );
}
