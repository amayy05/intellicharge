import React from 'react';
import { Zap, Compass, Bot, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, reachableCount, totalCount }) {
  return (
    <header className="glass-panel" style={{ margin: '16px 20px 0 20px', padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
            }}
          >
            <Zap size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                IntelliCharge
              </h1>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: '#06b6d4',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  textTransform: 'uppercase',
                }}
              >
                AI Smart Network
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Predictive Queue Estimation & Intelligent Routing • SJCEM Palghar
            </p>
          </div>
        </div>

        {/* Center / Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
          <button
            onClick={() => setActiveTab('recommend')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'recommend' ? '600' : '400',
              background: activeTab === 'recommend' ? '#06b6d4' : 'transparent',
              color: activeTab === 'recommend' ? '#090d16' : '#94a3b8',
              transition: 'all 0.2s ease',
            }}
          >
            <Compass size={16} />
            Smart Routing & Map
          </button>
          <button
            onClick={() => setActiveTab('agent')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'agent' ? '600' : '400',
              background: activeTab === 'agent' ? '#10b981' : 'transparent',
              color: activeTab === 'agent' ? '#090d16' : '#94a3b8',
              transition: 'all 0.2s ease',
            }}
          >
            <Bot size={16} />
            AI Reasoning Agent
          </button>
        </div>

        {/* Live Network Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.75rem',
              color: '#34d399',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span>ML Models Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
