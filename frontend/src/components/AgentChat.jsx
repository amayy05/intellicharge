import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Terminal, ChevronDown, ChevronUp, Navigation, ExternalLink } from 'lucide-react';
import { queryAgent } from '../services/api';

const EXAMPLE_QUERIES = [
  '⚡ 20% battery at Palghar, need CCS2',
  '🛍️ Fast charger near Thane Viviana Mall',
  '💼 BKC Mumbai with 15% charge',
  '🛣️ Traveling NH48 Manor, 100kW+',
];

export default function AgentChat({ currentLat, currentLng, currentBattery, currentConnector }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: "👋 Hello! I'm your IntelliCharge AI Assistant. Tell me where you are, your current battery percentage, and connector type — I will query the live queue prediction model and recommend the fastest charging stop!",
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
    <div className="card" style={{ height: '700px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={20} color="#FFFFFF" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)', margin: 0 }}>AI Agent</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Real-time tool-calling over predictive models</p>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
          <Sparkles size={14} color="var(--primary-accent)" /> Prompts:
        </span>
        {EXAMPLE_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '6px 12px',
              fontSize: '12px',
              color: 'var(--text-dark)',
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
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-primary)' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {msg.sender === 'user' ? (
                <>
                  <span>Driver</span>
                  <User size={14} />
                </>
              ) : (
                <>
                  <Bot size={14} color="var(--primary-accent)" />
                  <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>IntelliCharge AI</span>
                </>
              )}
            </div>

            <div
              style={{
                maxWidth: '85%',
                padding: '16px',
                borderRadius: '16px',
                background: msg.sender === 'user' ? 'var(--primary-accent)' : 'var(--bg-dark-card)',
                color: msg.sender === 'user' ? '#FFFFFF' : 'var(--text-light)',
                fontSize: '14px',
                lineHeight: '1.5',
                border: msg.sender === 'user' ? 'none' : '1px solid var(--bg-dark-card)',
                whiteSpace: 'pre-line',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              {msg.text}

              {/* Tool Execution Logs Accordion */}
              {msg.toolLogs && msg.toolLogs.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <button
                    onClick={() => toggleTools(msg.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <Terminal size={14} color="var(--primary-accent)" />
                    <span>Agent Tool Calls ({msg.toolLogs.length})</span>
                    {expandedTools[msg.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {expandedTools[msg.id] && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {msg.toolLogs.map((tl, tIdx) => (
                        <div
                          key={tIdx}
                          style={{
                            background: '#1F2937',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            borderLeft: '3px solid var(--primary-accent)',
                          }}
                        >
                          <div style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>→ {tl.tool_name}()</div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{tl.result_summary}</div>
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
                    marginTop: '16px',
                    padding: '16px',
                    background: '#1F2937',
                    border: '1px solid var(--primary-accent)',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#FFFFFF', fontSize: '15px' }}>{msg.card.station_name}</strong>
                    <span style={{ color: 'var(--primary-accent)', fontSize: '13px', fontWeight: '700' }}>
                      {msg.card.breakdown.predicted_wait_minutes < 1 ? '<1' : '~' + Math.round(msg.card.breakdown.predicted_wait_minutes)}m wait
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {msg.card.breakdown.road_distance_km} km away • ~{msg.card.breakdown.travel_time_minutes}m drive
                  </p>
                  <a
                    href={msg.card.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: 'var(--primary-accent)',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      textDecoration: 'none',
                    }}
                  >
                    <Navigation size={14} />
                    Navigate via Maps
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <Bot size={18} color="var(--primary-accent)" className="animate-spin" />
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
          padding: '16px 24px',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '12px',
        }}
      >
        <input
          type="text"
          placeholder="Ask anything (e.g., '18% battery, find best CCS2 fast charger')..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            color: 'var(--text-dark)',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          style={{
            padding: '12px 24px',
            background: 'var(--bg-dark-card)',
            border: 'none',
            borderRadius: '12px',
            color: 'var(--text-light)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: loading || !inputQuery.trim() ? 0.6 : 1,
          }}
        >
          <Send size={18} />
          Send
        </button>
      </form>
    </div>
  );
}
