import React, { useState, useRef, useEffect } from 'react';
import { queryAgent } from '../services/api';

const EXAMPLE_QUERIES = [
  'Filter 150kW+ only',
  'Avoid highway tolls',
  'Pre-condition battery',
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await queryAgent(textToSend, currentLat, currentLng, currentBattery, currentConnector);
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
          text: `⚠️ Error: ${err.message}`,
          toolLogs: [],
          card: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:w-[320px] xl:w-[360px] h-full bg-[#FAF8F5] border-l border-[#E8E4DC] flex flex-col shadow-[-8px_0_28px_rgba(0,0,0,0.03)] z-40">
      <div className="p-4 bg-[#FAF8F5] border-b border-[#E8E4DC] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0EBE1] border border-[#E8E4DC] flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[#181A19] text-[22px]">psychology</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[20px] leading-[24px] text-[#181A19] font-extrabold tracking-tight">IntelliCharge AI Co-Pilot</h1>
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            </div>
            <p className="font-body text-xs text-[#6E716E] font-medium">Analyzing live grid & queue telemetry</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAF8F5]">
        {messages.map((msg) => (
          msg.sender === 'user' ? (
            <div key={msg.id} className="flex justify-end items-start gap-2.5 pl-8">
              <div className="flex flex-col items-end">
                <div className="bg-[#EFECE6] border border-[#E8E4DC] text-[#181A19] px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-sm max-w-sm">
                  <p className="font-body text-sm text-[#181A19] font-medium leading-relaxed">{msg.text}</p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#181A19] border border-[#2B2E2C] flex items-center justify-center text-[#FAF8F5] shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[15px]">person</span>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex justify-start items-start gap-2.5 pr-6">
              <div className="w-7 h-7 rounded-full bg-[#F0EBE1] border border-[#E8E4DC] flex items-center justify-center text-[#181A19] shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[15px] font-bold">auto_awesome</span>
              </div>
              <div className="flex flex-col items-start gap-2 max-w-full">
                <div className="bg-[#FFFFFF] border border-[#E8E4DC] text-[#181A19] p-4 rounded-2xl rounded-tl-xs shadow-[0_4px_20px_rgba(0,0,0,0.06)] space-y-3">
                  <p className="font-body text-sm text-[#595C59] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  
                  {msg.card && (
                    <div className="p-3 bg-[#F5F2EB] border border-[#E8E4DC] rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-label-ui">
                        <span className="text-[#181A19] flex items-center gap-1 font-bold">
                          <span className="material-symbols-outlined text-[14px] text-[#181A19]">ev_station</span>
                          {msg.card.station_name}
                        </span>
                        <span className="text-[#181A19] font-bold">~{Math.round(msg.card.breakdown?.predicted_wait_minutes || 0)}m wait</span>
                      </div>
                      <a href={msg.card.google_maps_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#10B981] font-bold">Navigate in Maps →</a>
                    </div>
                  )}
                  {msg.toolLogs && msg.toolLogs.length > 0 && (
                    <div className="text-[11px] text-[#6E716E] font-medium border-t border-[#E8E4DC] pt-2">
                      Used tools: {msg.toolLogs.map(t => t.tool_name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ))}
        {loading && (
          <div className="flex justify-start items-center gap-2 text-[#6E716E] text-xs font-label-ui">
             <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
             Agent reasoning...
          </div>
        )}
        <div ref={messagesEndRef} />
        
        <div className="pt-1 flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((q, i) => (
             <button key={i} onClick={() => handleSend(q)} className="px-4 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E8E4DC] hover:bg-[#F5F2EB] hover:border-[#BDB8AE] text-[#181A19] font-label-ui text-xs font-semibold transition-all shadow-sm">
                {q}
             </button>
          ))}
        </div>
      </div>
      <div className="p-4 bg-[#FAF8F5] border-t border-[#E8E4DC]">
        <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <div className="relative flex items-center bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl px-4 py-2 shadow-sm focus-within:border-[#181A19] transition-all">
            <input 
              className="w-full bg-transparent font-body text-sm text-[#181A19] placeholder:text-[#9E9B93] focus:outline-none pr-20" 
              placeholder="Ask Co-Pilot..." 
              value={inputQuery} 
              onChange={(e) => setInputQuery(e.target.value)} 
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button disabled={loading} type="submit" className="h-8 px-3 bg-[#181A19] hover:bg-[#2B2E2C] text-[#FAF8F5] rounded-xl font-label-ui text-xs font-bold flex items-center gap-1 transition-all shadow-sm">
                Send <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
