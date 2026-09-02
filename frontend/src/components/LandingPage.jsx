import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ setActiveTab }) {
  const { isAuthenticated, openLoginModal } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', padding: '16px 0 48px 0' }}>
      
      {/* ----------------- HERO SECTION ----------------- */}
      <section
        style={{
          position: 'relative',
          background: 'radial-gradient(120% 120% at 50% -20%, #17382B 0%, var(--bg-dark-card) 60%, #050B08 100%)',
          borderRadius: '32px',
          padding: '64px 48px',
          color: 'var(--text-light)',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(10, 20, 16, 0.4)',
          border: '1px solid rgba(40, 168, 121, 0.2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
        }}
      >
        {/* Background glow effects */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(40,168,121,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Left Column: Hero Text & Call-To-Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 1 }}>
          {/* Eyebrow Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(40, 168, 121, 0.15)',
              border: '1px solid rgba(40, 168, 121, 0.4)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              width: 'fit-content',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              color: '#4ADE80',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ fontSize: '14px' }}>⚡</span> Next-Gen EV Mobility & Grid Intelligence
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: 'clamp(36px, 4.5vw, 56px)',
              fontWeight: '900',
              lineHeight: 1.1,
              margin: 0,
              color: '#FFFFFF',
              letterSpacing: '-1px',
            }}
          >
            Charge Smarter.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #4ADE80 0%, #28A879 60%, #38BDF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Zero Queue Anxiety.
            </span>
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.75)',
              margin: 0,
              maxWidth: '560px',
            }}
          >
            IntelliCharge forecasts charging station queues at your <strong>exact time of arrival</strong>,
            dynamically balances regional grid loads, and guarantees battery reachability across the Mumbai Metropolitan Region.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button
              onClick={() => setActiveTab('recommend')}
              style={{
                background: 'var(--primary-accent)',
                color: '#FFF',
                padding: '16px 32px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '16px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(40, 168, 121, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>Explore Smart Routing</span>
              <span style={{ fontSize: '18px' }}>→</span>
            </button>

            <button
              onClick={() => setActiveTab('agent')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFF',
                padding: '16px 28px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '15px',
                fontWeight: '600',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>💬 Talk to AI Agent</span>
            </button>

            {!isAuthenticated && (
              <button
                onClick={openLoginModal}
                style={{
                  background: 'transparent',
                  color: '#4ADE80',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                }}
              >
                Sign In / Demo Account
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Architecture / Station Preview Card */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: '24px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Card Header with Live Pulse */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#4ADE80',
                    boxShadow: '0 0 12px #4ADE80',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', color: '#4ADE80', textTransform: 'uppercase' }}>
                  Live Recommendation Feed
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>Palghar / MMR Corridor</span>
            </div>

            {/* Top Recommended Hub Mockup */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(40, 168, 121, 0.3)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#FFF', fontWeight: '700' }}>
                    Tata Power - SJCEM Campus Hub
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    4x Fast Chargers (60 kW DC) • CCS2
                  </p>
                </div>
                <div
                  style={{
                    background: 'rgba(40, 168, 121, 0.2)',
                    color: '#4ADE80',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                  }}
                >
                  Score: 94.2
                </div>
              </div>

              {/* Station telemetry pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Transit ETA</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFF' }}>12 mins</div>
                </div>
                <div style={{ background: 'rgba(40, 168, 121, 0.1)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#4ADE80' }}>Predicted Queue</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#4ADE80' }}>0 mins wait</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>Arrival SoC</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#38BDF8' }}>38% (Safe)</div>
                </div>
              </div>
            </div>

            {/* AI Reasoning Preview */}
            <div
              style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'rgba(40, 168, 121, 0.08)',
                padding: '12px',
                borderRadius: '12px',
                borderLeft: '3px solid var(--primary-accent)',
                lineHeight: 1.5,
              }}
            >
              <strong>🤖 AI Dispatch Reason:</strong> Nearest multi-bay hub. ML model estimates bay 2 will open 4 minutes before your arrival, yielding zero dwell delay.
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- STATS STRIP ----------------- */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
        }}
      >
        {[
          { label: 'Curated Regional Hubs', value: '50+', sub: 'MMR & Palghar Highway Grid' },
          { label: 'ML Prediction Error', value: '< 8 mins', sub: 'MAE across 75-day synthetic telemetry' },
          { label: 'Battery Safety Buffer', value: '100%', sub: 'Zero risk of highway stranding' },
          { label: 'Peak Power Supported', value: '350 kW', sub: 'Ultra-fast CCS2 & Type-2 DC ports' },
        ].map((stat, i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary-accent)', letterSpacing: '-0.5px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>{stat.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.sub}</div>
          </div>
        ))}
      </section>

      {/* ----------------- THE 3 PILLARS / ARCHITECTURE INNOVATION ----------------- */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-dark)' }}>
            Engineered for Real-World EV Challenges
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            Existing navigation apps only tell you where a charger is right now. IntelliCharge tells you what the queue will look like when you arrive.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Card 1 */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(40, 168, 121, 0.12)',
                color: 'var(--primary-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              ⏱️
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>
              Arrival-Time Queue Forecasting
            </h3>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
              Instead of naive real-time snapshots, our Random Forest regression pipeline computes your transit ETA and predicts queue bottlenecks at your expected moment of arrival.
            </p>
          </div>

          {/* Card 2 */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              🔋
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>
              Multi-Factor Battery Reachability
            </h3>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
              Considers your current State-of-Charge (SoC), target battery level, road distance winding, and vehicle charging limits to eliminate range anxiety before you depart.
            </p>
          </div>

          {/* Card 3 */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '32px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              🤖
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-dark)' }}>
              Autonomous Natural Language Agent
            </h3>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
              Ask conversational questions like <em>"Find me a 50kW fast charger near Manor with lowest wait"</em>. The agent parses coordinates, battery status, and triggers live tools.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------- HOW IT WORKS STEPS ----------------- */}
      <section
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <h3 style={{ fontSize: '20px', fontWeight: '800', textAlign: 'center', margin: 0 }}>
          How IntelliCharge Works in 4 Simple Steps
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {[
            { step: '01', title: 'Set EV & Location', desc: 'Select your vehicle model and battery percentage.' },
            { step: '02', title: 'Predictive Inference', desc: 'ML models calculate queues at your projected arrival time.' },
            { step: '03', title: 'Smart Ranking', desc: 'Multi-factor algorithm optimizes wait time, distance & charger capacity.' },
            { step: '04', title: 'Drive & Fast Charge', desc: 'Seamless 1-click turn-by-turn navigation via Google Maps.' },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary-accent)' }}>{item.step}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>{item.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------- BOTTOM CALL TO ACTION ----------------- */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--bg-dark-card) 0%, #132E24 100%)',
          borderRadius: '28px',
          padding: '48px 32px',
          textAlign: 'center',
          color: '#FFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: '#FFF' }}>
          Ready to experience frictionless EV charging?
        </h2>
        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.75)', maxWidth: '500px', fontSize: '15px' }}>
          Launch the interactive routing engine now to view live predictions, virtual queues, and charger availability in Palghar and MMR.
        </p>
        <button
          onClick={() => setActiveTab('recommend')}
          style={{
            background: 'var(--primary-accent)',
            color: '#FFF',
            padding: '16px 36px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(40, 168, 121, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          Launch Charging Network Dashboard →
        </button>
      </section>
      
    </div>
  );
}
