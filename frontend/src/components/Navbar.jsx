import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, isAuthenticated, logout, openLoginModal, openRegisterModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        marginBottom: '8px',
        position: 'relative',
      }}
    >
      {/* Brand / Logo Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            background: 'var(--primary-accent)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF',
            fontWeight: 'bold',
            fontSize: '18px',
            boxShadow: '0 4px 12px rgba(40, 168, 121, 0.3)',
          }}
        >
          ⚡
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', margin: '0', letterSpacing: '0.5px' }}>INTELLICHARGE</h1>
          <p
            style={{
              margin: '0',
              fontSize: '10px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            AI Smart Network
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card)',
          padding: '4px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <button
          onClick={() => setActiveTab('recommend')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeTab === 'recommend' ? 'var(--bg-dark-card)' : 'transparent',
            color: activeTab === 'recommend' ? 'var(--text-light)' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
          }}
        >
          Smart Routing
        </button>
        <button
          onClick={() => setActiveTab('agent')}
          style={{
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            background: activeTab === 'agent' ? 'var(--bg-dark-card)' : 'transparent',
            color: activeTab === 'agent' ? 'var(--text-light)' : 'var(--text-secondary)',
            transition: 'all 0.2s ease',
          }}
        >
          AI Agent
        </button>
      </div>

      {/* Auth / Profile Area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-pill)',
                padding: '6px 14px 6px 8px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--primary-accent)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13px',
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || user?.email?.split('@')[0]}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>▼</span>
            </button>

            {dropdownOpen && (
              <div
                onClick={() => setDropdownOpen(false)}
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-hover)',
                  minWidth: '200px',
                  padding: '12px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>
                    {user?.name || 'EV Driver'}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'transparent',
                    color: 'var(--error)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={openLoginModal}
              style={{
                background: 'transparent',
                color: 'var(--text-dark)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-pill)',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              onClick={openRegisterModal}
              style={{
                background: 'var(--primary-accent)',
                color: '#FFF',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(40, 168, 121, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
