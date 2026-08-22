/**
 * AgentChat — §5.2 Agent screen
 *
 * PRD §5.2 wireframe spec:
 *   - "Checking nearby stations…" as quiet muted meta-text, NOT theatrical spinner
 *   - Same card component as home screen (StationCard / ChargeBar) — one vocabulary
 *   - Reasoning is EXPLICIT TEXT: "Skipped Station C — 0.8 km closer, but 25 min predicted wait"
 *   - Input: [ Type a message… ] ➤
 *
 * §6 Agent unavailable state:
 *   "IntelliCharge Agent is taking longer than usual. Here are your nearby stations directly:"
 *   Falls straight into ranked list — never a blank screen.
 *
 * §10 Copy: explain in plain terms, not scores.
 */

import React, { useState, useRef, useEffect } from 'react';
import ChargeBar from './ChargeBar';
import StationCard from './StationCard';
import { queryAgent } from '../services/api';

const EXAMPLE_QUERIES = [
  '20% battery at SJCEM Palghar, need CCS2 with low wait',
  'Fast charger near Thane Viviana Mall, shortest queue',
  'At BKC Mumbai with 15% charge, where should I go?',
  'Traveling on NH48 Manor highway, 100kW+ charger please',
];

// §5.2: same card as home screen — builds ChargeBar inline in chat
function InlineStationResult({ station }) {
  if (!station) return null;
  const wait = station.breakdown?.predicted_wait_minutes ?? 0;
  const connectors = Array.isArray(station.connector_types)
    ? station.connector_types
    : station.connector_types?.split(',').map(s => s.trim()) ?? [];

  return (
    <div
      className="card"
      style={{
        marginTop: '8px',
        padding: '12px 14px',
        borderLeft: '3px solid var(--copper)',
      }}
    >
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600', fontSize: '0.88rem', color: 'var(--fog)', marginBottom: '2px' }}>
        {station.station_name}
      </p>
      <p style={{ fontSize: '0.72rem', color: 'var(--fog-muted)', marginBottom: '8px' }}>
        {station.operator} · {station.city_region}
      </p>
      {/* §4: same ChargeBar as home screen */}
      <ChargeBar waitMinutes={wait} size="sm" />
      <div style={{ display: 'flex', gap: '12px', marginTop: '7px', fontSize: '0.72rem' }}>
        <span>
          <span style={{ color: 'var(--fog-dim)' }}>dist </span>
          <span className="font-mono">{station.breakdown?.road_distance_km} km</span>
        </span>
        <span>
          <span style={{ color: 'var(--fog-dim)' }}>drive </span>
          <span className="font-mono">{station.breakdown?.travel_time_minutes}m</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <a
          href={station.google_maps_url}
          target="_blank"
          rel="noreferrer"
          className="btn btn-navigate"
          aria-label={`Navigate to ${station.station_name}`}
          style={{ fontSize: '0.75rem' }}
        >
          Navigate
        </a>
      </div>
    </div>
  );
}

// Parse reasoned_answer for explicit skip reasoning lines
function renderReasonedAnswer(text) {
  if (!text) return null;
  // Split on newlines, render each line; bold **text** patterns
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return null;
    // Convert **bold** to <strong>
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ marginBottom: '4px', lineHeight: 1.5 }}>
        {parts.map((part, j) =>
          j % 2 === 1
            ? <strong key={j} style={{ color: 'var(--fog)', fontWeight: '600' }}>{part}</strong>
            : part
        )}
      </p>
    );
  });
}

export default function AgentChat({ currentLat, currentLng, currentBattery, currentConnector }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: "What station do you need? Tell me your battery level, location, and connector — I'll check the predicted queues and recommend the fastest stop.",
      station: null,
      fallbackStations: null,
      isFallback: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (queryText) => {
    const text = queryText ?? input;
    if (!text.trim() || loading) return;
    setInput('');

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
    setLoading(true);

    try {
      const res = await queryAgent(text, currentLat, currentLng, currentBattery, currentConnector);

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'agent',
          text: res.reasoned_answer,
          station: res.recommended_station ?? null,
          fallbackStations: null,
          isFallback: false,
        },
      ]);
    } catch (err) {
      // §6 Agent unavailable: fall back gracefully — never a blank screen
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'agent',
          // §6 exact copy from PRD
          text: 'IntelliCharge Agent is taking longer than usual. Here are your nearby stations directly:',
          station: null,
          fallbackStations: null,
          isFallback: true,
          error: err.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--asphalt)',
      }}
    >
      {/* §5.2 Header: "← IntelliCharge Agent" */}
      <div
        style={{
          background: 'var(--slate)',
          borderBottom: '1px solid var(--slate-border)',
          padding: '10px 16px',
        }}
      >
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600', fontSize: '0.9rem', color: 'var(--fog)' }}>
          IntelliCharge Agent
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--fog-dim)' }}>
          Predicts queues · recommends the fastest stop · explains why
        </p>
      </div>

      {/* Example prompt chips */}
      <div
        style={{
          padding: '8px 12px',
          background: 'var(--slate-dim)',
          borderBottom: '1px solid var(--slate-border)',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
        }}
      >
        {EXAMPLE_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => send(q)}
            className="chip"
            style={{ fontSize: '0.72rem' }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        role="log"
        aria-label="Conversation with IntelliCharge Agent"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {/* Sender label */}
            <span style={{ fontSize: '0.68rem', color: 'var(--fog-dim)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>
              {msg.sender === 'user' ? 'You' : 'IntelliCharge'}
            </span>

            {/* Bubble */}
            <div
              style={{
                background: msg.sender === 'user' ? 'var(--copper)' : 'var(--slate)',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--slate-border)',
                borderRadius: msg.sender === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                padding: '10px 12px',
                fontSize: '0.83rem',
                color: msg.sender === 'user' ? 'var(--asphalt)' : 'var(--fog-muted)',
                fontWeight: msg.sender === 'user' ? '500' : '400',
                lineHeight: 1.5,
                maxWidth: '100%',
              }}
            >
              {renderReasonedAnswer(msg.text)}
            </div>

            {/* §5.2: same card component as home screen */}
            {msg.station && (
              <InlineStationResult station={msg.station} />
            )}
          </div>
        ))}

        {/* §5.2: "Checking nearby stations…" — quiet muted meta-text, not a theatrical spinner */}
        {loading && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--fog-dim)',
              fontStyle: 'italic',
              padding: '4px 0',
            }}
            role="status"
            aria-live="polite"
          >
            Checking nearby stations…
          </p>
        )}

        <div ref={endRef} />
      </div>

      {/* §5.2: "[ Type a message… ] ➤" */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        style={{
          padding: '12px 16px',
          background: 'var(--slate)',
          borderTop: '1px solid var(--slate-border)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={loading}
          style={{
            flex: 1,
            background: 'var(--asphalt)',
            border: '1px solid var(--slate-border)',
            borderRadius: 'var(--radius-chip)',
            padding: '9px 12px',
            color: 'var(--fog)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            outline: 'none',
          }}
          aria-label="Message to IntelliCharge agent"
          id="agent-chat-input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{ padding: '9px 16px', fontSize: '0.85rem', minWidth: '44px' }}
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
