import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isAuthModalOpen) return null;

  const isLogin = authModalMode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = async () => {
    setEmail('demo@intellicharge.ai');
    setPassword('password123');
    setError(null);
    setLoading(true);
    try {
      await login('demo@intellicharge.ai', 'password123');
    } catch {
      // If demo user doesn't exist yet, try registering it directly!
      try {
        await register('demo@intellicharge.ai', 'password123', 'Demo Driver');
      } catch (err2) {
        setError(err2.message || 'Could not log in with demo credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={closeAuthModal}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(10, 20, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '32px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            fontSize: '18px',
            lineHeight: 1,
          }}
        >
          &times;
        </button>

        {/* Brand Icon & Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              background: 'var(--primary-accent)',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              fontSize: '22px',
              marginBottom: '12px',
            }}
          >
            ⚡
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text-dark)' }}>
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isLogin
              ? 'Sign in to access your EV profiles and active queues'
              : 'Join IntelliCharge to plan smart charging stops'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-primary)',
            padding: '4px',
            borderRadius: 'var(--radius-pill)',
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              background: isLogin ? 'var(--bg-dark-card)' : 'transparent',
              color: isLogin ? 'var(--text-light)' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('register');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              background: !isLogin ? 'var(--bg-dark-card)' : 'transparent',
              color: !isLogin ? 'var(--text-light)' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: '#FEE2E2',
              border: '1px solid #F87171',
              color: '#991B1B',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              padding: '14px',
              fontSize: '15px',
              marginTop: '4px',
              background: 'var(--bg-dark-card)',
            }}
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo Fast Login Button */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleFillDemo}
            disabled={loading}
            style={{
              background: 'transparent',
              border: '1px dashed var(--primary-accent)',
              color: 'var(--primary-accent)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ⚡ Quick 1-Click Demo Login
          </button>
        </div>
      </div>
    </div>
  );
}
