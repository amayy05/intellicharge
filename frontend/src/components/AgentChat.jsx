import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Terminal, CheckCircle2, ChevronDown, ChevronUp, Navigation, ExternalLink } from 'lucide-react';
import { queryAgent } from '../services/api';

const EXAMPLE_QUERIES = [
  '⚡ 20% battery at SJCEM Palghar, need CCS2 with low wait',
  '🛍️ Fast charger near Thane Viviana Mall with shortest queue',
  '💼 At BKC Mumbai with 15% charge, where should I go?',
  '🛣️ Traveling on NH48 Manor highway, need 100kW+ fast charger',
];

export default function AgentChat({ currentLat, currentLng, currentBattery, currentConnector }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: "👋 Hello! I'm your **IntelliCharge AI Assistant**. Tell me where you are, your current battery percentage, and connector type — I will query the live queue prediction model and recommend the fastest charging stop!",
      toolLogs: [],
      card: null,
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await queryAgent(
        textToSend,
        currentLat,
        currentLng,
        currentBattery,
        currentConnector
      );

      const agentMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        text: response.reasoned_answer,
        toolLogs: response.tool_executions || [],
        card: response.recommended_station,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'agent',
          text: `⚠️ **Error communicating with AI Agent:** ${err.message}. Please check that the backend is running.`,
          toolLogs: [],
          card: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTools = (msgId) => {
    setExpandedTools((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div className="glass-panel" style={{ height: '700px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={18} color="#090d16" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc' }}>IntelliCharge Conversational Agent</h3>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Real-time tool-calling over predictive queue & ranking models</p>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div
        style={{
          padding: '10px 16px',
          background: 'rgba(15, 23, 42, 0.5)',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} color="#06b6d4" /> Prompts:
        </span>
        {EXAMPLE_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              color: '#cbd5e1',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Area */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#64748b' }}>
              {msg.sender === 'user' ? (
                <>
                  <span>Driver</span>
                  <User size={12} />
                </>
              ) : (
                <>
                  <Bot size={12} color="#10b981" />
                  <span style={{ color: '#10b981', fontWeight: '600' }}>IntelliCharge AI</span>
                </>
              )}
            </div>

            <div
              style={{
                maxWidth: '85%',
                padding: '14px 16px',
                borderRadius: '12px',
                background: msg.sender === 'user' ? 'linear-gradient(135deg, #0284c7, #06b6d4)' : 'rgba(30, 41, 59, 0.8)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                border: msg.sender === 'user' ? 'none' : '1px solid #334155',
                whiteSpace: 'pre-line',
              }}
            >
              {msg.text}

              {/* Tool Execution Logs Accordion */}
              {msg.toolLogs && msg.toolLogs.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <button
                    onClick={() => toggleTools(msg.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <Terminal size={12} color="#06b6d4" />
                    <span>Agent Tool Calls ({msg.toolLogs.length})</span>
                    {expandedTools[msg.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  {expandedTools[msg.id] && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {msg.toolLogs.map((tl, tIdx) => (
                        <div
                          key={tIdx}
                          style={{
                            background: '#0b1120',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            borderLeft: '2px solid #06b6d4',
                          }}
                        >
                          <div style={{ color: '#06b6d4', fontWeight: '600' }}>→ {tl.tool_name}()</div>
                          <div style={{ color: '#94a3b8', marginTop: '2px' }}>{tl.result_summary}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Embedded Recommendation Card if present */}
              {msg.card && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#0f172a',
                    border: '1px solid #06b6d4',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{msg.card.station_name}</strong>
                    <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '700' }}>
                      {msg.card.breakdown.predicted_wait_minutes}m wait
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '8px' }}>
                    {msg.card.breakdown.road_distance_km} km away • ~{msg.card.breakdown.travel_time_minutes}m drive
                  </p>
                  <a
                    href={msg.card.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      background: '#06b6d4',
                      color: '#090d16',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                    }}
                  >
                    <Navigation size={12} />
                    Navigate via Google Maps
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem' }}>
            <Bot size={16} color="#10b981" className="animate-spin" />
            <span>Agent reasoning and predicting station queue...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          padding: '14px 20px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderTop: '1px solid #334155',
          display: 'flex',
          gap: '10px',
        }}
      >
        <input
          type="text"
          placeholder="Ask anything (e.g., '18% battery at Palghar, find best CCS2 fast charger')..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: '#090d16',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          style={{
            padding: '10px 18px',
            background: '#10b981',
            border: 'none',
            borderRadius: '8px',
            color: '#090d16',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: loading || !inputQuery.trim() ? 0.6 : 1,
          }}
        >
          <Send size={16} />
          Send
        </button>
      </form>
    </div>
  );
}
