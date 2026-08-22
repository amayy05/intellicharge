import React from 'react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '12px 0',
      marginBottom: '8px'
    }}>
      {/* Brand / Logo Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'var(--primary-accent)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFF',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          ⚡
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: '0', letterSpacing: '0.5px' }}>CHARGEMATE</h1>
          <p style={{ margin: '0', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Smart Network</p>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        background: 'var(--bg-card)',
        padding: '4px',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        <button
          onClick={() => setActiveTab('recommend')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeTab === 'recommend' ? 'var(--bg-dark-card)' : 'transparent',
            color: activeTab === 'recommend' ? 'var(--text-light)' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          Smart Routing
        </button>
        <button
          onClick={() => setActiveTab('agent')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeTab === 'agent' ? 'var(--bg-dark-card)' : 'transparent',
            color: activeTab === 'agent' ? 'var(--text-light)' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          AI Agent
        </button>
      </div>

      {/* Profile Avatar / Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer' }}>
          <span style={{ width: '24px', height: '2px', background: 'var(--text-dark)' }}></span>
          <span style={{ width: '24px', height: '2px', background: 'var(--text-dark)' }}></span>
        </button>
      </div>
    </header>
  );
}
