'use client'

import React, { useEffect, useState } from 'react';

// ============================================================
// THEME VARIABLES — Edit these to change the colour scheme
// ============================================================

// // Purple theme:
// // primary: '#7c3aed', primaryHover: '#6d28d9', primaryLight: '#c4b5fd',
// // bgGrad1: '#1a0530', bgGrad3: '#130520',

// // Blue theme:
// primary: '#0ea5e9', primaryHover: '#0284c7', primaryLight: '#7dd3fc',
// bgGrad1: '#021520', bgGrad3: '#010d15',

// // red
//   // Primary accent colour (used for glow, borders, buttons, dots, etc.)
//   // primary:          '#dc2626',       // e.g. '#7c3aed' for purple, '#0ea5e9' for blue
//   // primaryHover:     '#b91c1c',       // slightly darker shade for hover states
//   // primaryLight:     '#ff8c8c',       // lighter tint used in gradients & headline

//   // // Card background gradient stops
//   // bgGrad0:          '#0a0a0a',       // top-left corner
//   // bgGrad1:          '#1a0505',       // mid tint (should echo primary hue)
//   // bgGrad2:          '#0f0f0f',       // lower area
//   // bgGrad3:          '#150303',       // bottom-right corner (should echo primary hue)
const THEME = {
  // Blue theme:
primary: '#2fa084',       // brand-green
  primaryHover: '#1f6f5f',  // brand-deep
  primaryLight: '#6fcf97',  // brand-mint
  
  // Card background gradient stops
  bgGrad0: '#0f1410',       // brand-black
  bgGrad1: '#0d1f1a',       // deep tinted toward green
  bgGrad2: '#0f1410',       // brand-black
  bgGrad3: '#081410',       // darker tint

  // Overlay backdrop colour
  overlayBg: 'rgba(15, 20, 16, 0.82)',  // brand-black with alpha

  // Text colours
  textBody: 'rgba(255,255,255,0.45)',
  textMuted: 'rgba(255,255,255,0.18)',
  textSecondary: 'rgba(255,255,255,0.35)',
};
// ============================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

// Helper: convert hex to rgb triplet string e.g. "220,38,38"
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const ComingSoonPopup = () => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Pre-compute rgb string once
  const primaryRgb = hexToRgb(THEME.primary);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('siraa_popup_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const p: Particle[] = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 6 + 4,
      delay: Math.random() * 4,
    }));
    setParticles(p);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      sessionStorage.setItem('siraa_popup_dismissed', '1');
    }, 350);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Rajdhani:wght@400;500;600;700&display=swap');

        @keyframes overlayFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes overlayFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.88) translateY(24px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes popupOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to   { opacity: 0; transform: scale(0.88) translateY(24px); }
        }
        @keyframes scanLine      { 0% { transform: translateY(-100%); } 100% { transform: translateY(3000%); } }
        @keyframes marqueeLeft   { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1);    opacity: 0.5; }
          50%       { transform: translateY(-10px) scale(1.2); opacity: 1; }
        }
        @keyframes rotateSlow        { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes rotateSlowReverse { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
        @keyframes borderRun   { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes megaphoneWiggle {
          0%, 100% { transform: rotate(-5deg) scale(1);    }
          25%       { transform: rotate(5deg)  scale(1.05); }
          50%       { transform: rotate(-3deg) scale(1);    }
          75%       { transform: rotate(4deg)  scale(1.03); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%       { transform: scale(1.8); opacity: 0.5; }
        }
        @keyframes blink        { 0%, 49% { opacity: 1; } 50%, 99% { opacity: 0; } }
        @keyframes shimmerSweep { 0% { left: -60%; } 100% { left: 120%; } }
        @keyframes warningStripes {
          0%   { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes ping         { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(${primaryRgb},0.3), 0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(${primaryRgb},0.15); }
          50%       { box-shadow: 0 0 0 1px rgba(${primaryRgb},0.5), 0 25px 60px rgba(0,0,0,0.8), 0 0 70px rgba(${primaryRgb},0.30); }
        }

        .popup-overlay        { animation: overlayFadeIn  0.35s ease forwards; }
        .popup-overlay.closing{ animation: overlayFadeOut 0.35s ease forwards; }
        .popup-card           { animation: popupIn  0.45s cubic-bezier(0.16,1,0.3,1) forwards; }
        .popup-card.closing   { animation: popupOut 0.35s ease forwards; }

        .cs-scan-line {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(${primaryRgb},0.9), transparent);
          animation: scanLine 3s linear infinite;
          pointer-events: none; z-index: 5;
        }
        .cs-marquee-track {
          animation: marqueeLeft 20s linear infinite;
          display: flex; white-space: nowrap; width: max-content;
        }
        .cs-particle {
          position: absolute; border-radius: 50%;
          background: rgba(${primaryRgb},0.55);
          pointer-events: none;
        }
        .cs-shimmer {
          position: absolute; top: 0; bottom: 0; width: 55%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          animation: shimmerSweep 3.5s ease-in-out infinite;
          pointer-events: none;
        }
        .cs-stripe {
          background: repeating-linear-gradient(
            -45deg,
            rgba(${primaryRgb},0.18) 0px, rgba(${primaryRgb},0.18) 10px,
            transparent 10px, transparent 20px
          );
          background-size: 40px 40px;
          animation: warningStripes 1.5s linear infinite;
        }
        .cs-border-run {
          background: linear-gradient(90deg, transparent, ${THEME.primary}, ${THEME.primaryLight}, ${THEME.primary}, transparent);
          background-size: 200% 100%;
          animation: borderRun 2s linear infinite;
        }
        .cs-headline {
          background: linear-gradient(90deg, #fff 0%, ${THEME.primary} 40%, ${THEME.primaryLight} 60%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: borderRun 3s linear infinite;
        }
        .cs-gear-main  { animation: rotateSlow 9s linear infinite; }
        .cs-gear-small { animation: rotateSlowReverse 6s linear infinite; }
        .cs-mega       { animation: megaphoneWiggle 2.5s ease-in-out infinite; }
        .cs-dot1       { animation: dotPulse 1.2s ease-in-out 0s   infinite; }
        .cs-dot2       { animation: dotPulse 1.2s ease-in-out 0.4s infinite; }
        .cs-dot3       { animation: dotPulse 1.2s ease-in-out 0.8s infinite; }
        .cs-blink      { animation: blink 1s step-end infinite; }
        .cs-pulse-card { animation: pulseGlow 2.5s ease-in-out infinite; }

        .cs-close-btn { transition: background 0.15s, transform 0.15s, color 0.15s; }
        .cs-close-btn:hover  { background: rgba(${primaryRgb},0.2) !important; color: #fff !important; transform: scale(1.1); }
        .cs-close-btn:active { transform: scale(0.95); }

        .cs-dismiss-btn { transition: background 0.2s, transform 0.15s; cursor: pointer; }
        .cs-dismiss-btn:hover  { background: ${THEME.primaryHover} !important; transform: translateY(-1px); }
        .cs-dismiss-btn:active { transform: translateY(0) scale(0.97); }
      `}</style>

      {/* ── OVERLAY ── */}
      <div
        className={`popup-overlay ${closing ? 'closing' : ''}`}
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: THEME.overlayBg,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* ── POPUP CARD ── */}
        <div
          className={`popup-card cs-pulse-card ${closing ? 'closing' : ''}`}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '520px',
            borderRadius: '20px',
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${THEME.bgGrad0} 0%, ${THEME.bgGrad1} 45%, ${THEME.bgGrad2} 75%, ${THEME.bgGrad3} 100%)`,
            fontFamily: "'Rajdhani', sans-serif",
          }}
        >
          <div className="cs-scan-line" />
          <div className="cs-shimmer" />

          {particles.map(p => (
            <div key={p.id} className="cs-particle" style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: `${p.size}px`, height: `${p.size}px`,
              animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }} />
          ))}

          {/* Radial glow */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 70% 60% at 50% 100%, rgba(${primaryRgb},0.12) 0%, transparent 70%)`,
          }} />

          {/* ── TOP STRIPE ── */}
          <div className="cs-stripe" style={{ height: '5px' }} />

          {/* ── CLOSE BUTTON ── */}
          <button
            className="cs-close-btn"
            onClick={handleClose}
            style={{
              position: 'absolute', top: '14px', right: '14px', zIndex: 20,
              width: '30px', height: '30px', borderRadius: '50%',
              border: `1px solid rgba(${primaryRgb},0.35)`,
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 700, lineHeight: 1,
            }}
            aria-label="Close"
          >
            ✕
          </button>

          {/* ── TICKER MARQUEE ── */}
          <div style={{
            borderBottom: `1px solid rgba(${primaryRgb},0.2)`,
            background: `rgba(${primaryRgb},0.05)`,
            overflow: 'hidden', padding: '5px 0',
          }}>
            <div className="cs-marquee-track">
              {[...Array(2)].map((_, ri) => (
                <React.Fragment key={ri}>
                  {['🔧 UNDER CONSTRUCTION','⚡ COMING SOON','🚗 Siraa.LK','🛠️ LAUNCHING SHORTLY','🔥 STAY TUNED','📢 BIG THINGS AHEAD'].map((item, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '10px',
                      padding: '0 24px',
                      fontSize: '10px', fontWeight: 700,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: i % 2 === 0 ? `rgba(${primaryRgb},0.9)` : THEME.textSecondary,
                    }}>
                      {item}
                      <span style={{ color: `rgba(${primaryRgb},0.35)`, fontSize: '7px' }}>◆</span>
                    </span>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── MAIN BODY ── */}
          <div style={{ padding: '28px 24px 24px', position: 'relative', zIndex: 2 }}>

            {/* Top row: gears + megaphone */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>

              {/* Gear cluster */}
              <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
                <svg className="cs-gear-main" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '52px', height: '52px', opacity: 0.75 }}>
                  <path fill={`rgba(${primaryRgb},0.85)`} d="M43.3,5.7l-3.5,8.1c-1.9,0.4-3.7,1-5.4,1.8l-7.5-4.7l-8.5,8.5l4.7,7.5c-0.8,1.7-1.4,3.5-1.8,5.4l-8.1,3.5v12l8.1,3.5c0.4,1.9,1,3.7,1.8,5.4l-4.7,7.5l8.5,8.5l7.5-4.7c1.7,0.8,3.5,1.4,5.4,1.8l3.5,8.1h12l3.5-8.1c1.9-0.4,3.7-1,5.4-1.8l7.5,4.7l8.5-8.5l-4.7-7.5c0.8-1.7,1.4-3.5,1.8-5.4l8.1-3.5v-12l-8.1-3.5c-0.4-1.9-1-3.7-1.8-5.4l4.7-7.5l-8.5-8.5l-7.5,4.7c-1.7-0.8-3.5-1.4-5.4-1.8L55.3,5.7H43.3z M49.3,35c7.9,0,14.3,6.4,14.3,14.3s-6.4,14.3-14.3,14.3S35,57.2,35,49.3S41.4,35,49.3,35z"/>
                </svg>
                <svg className="cs-gear-small" viewBox="0 0 100 100" style={{ position: 'absolute', top: '28px', left: '28px', width: '28px', height: '28px' }}>
                  <path fill="rgba(255,255,255,0.55)" d="M43.3,5.7l-3.5,8.1c-1.9,0.4-3.7,1-5.4,1.8l-7.5-4.7l-8.5,8.5l4.7,7.5c-0.8,1.7-1.4,3.5-1.8,5.4l-8.1,3.5v12l8.1,3.5c0.4,1.9,1,3.7,1.8,5.4l-4.7,7.5l8.5,8.5l7.5-4.7c1.7,0.8,3.5,1.4,5.4,1.8l3.5,8.1h12l3.5-8.1c1.9-0.4,3.7-1,5.4-1.8l7.5,4.7l8.5-8.5l-4.7-7.5c0.8-1.7,1.4-3.5,1.8-5.4l8.1-3.5v-12l-8.1-3.5c-0.4-1.9-1-3.7-1.8-5.4l4.7-7.5l-8.5-8.5l-7.5,4.7c-1.7-0.8-3.5-1.4-5.4-1.8L55.3,5.7H43.3z M49.3,35c7.9,0,14.3,6.4,14.3,14.3s-6.4,14.3-14.3,14.3S35,57.2,35,49.3S41.4,35,49.3,35z"/>
                </svg>
              </div>

              {/* Megaphone */}
              <div className="cs-mega" style={{ flexShrink: 0 }}>
                <svg viewBox="0 0 80 64" width="68" height="54">
                  <rect x="22" y="6" width="52" height="32" rx="9" fill={THEME.primary}/>
                  <text x="48" y="19" textAnchor="middle" fontFamily="'Black Ops One', cursive" fontSize="9" fill="white" letterSpacing="0.5">COMING</text>
                  <text x="48" y="31" textAnchor="middle" fontFamily="'Black Ops One', cursive" fontSize="9" fill="white" letterSpacing="0.5">SOON</text>
                  <polygon points="20,20 6,25 6,39 20,44" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1"/>
                  <polygon points="20,20 38,12 38,52 20,44" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1"/>
                  <ellipse cx="38.5" cy="32" rx="2.5" ry="20" fill={THEME.primary} opacity="0.65"/>
                  <path d="M 42 22 Q 49 32 42 43" fill="none" stroke={`rgba(${primaryRgb},0.7)`} strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M 47 17 Q 57 32 47 47" fill="none" stroke={`rgba(${primaryRgb},0.4)`} strokeWidth="2" strokeLinecap="round"/>
                  <rect x="4" y="39" width="5" height="12" rx="2.5" fill="#6b7280"/>
                </svg>
              </div>
            </div>

            {/* Status badge */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                background: `rgba(${primaryRgb},0.1)`,
                border: `1px solid rgba(${primaryRgb},0.3)`,
                borderRadius: '999px',
                padding: '4px 14px 4px 9px',
              }}>
                <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
                  <span style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: THEME.primary, opacity: 0.7,
                    animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
                  }} />
                  <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', width: '8px', height: '8px', background: THEME.primary }} />
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', color: `rgba(${primaryRgb},0.9)`, textTransform: 'uppercase' as const }}>
                  In Development
                </span>
              </div>
            </div>

            {/* Headline */}
            <h2 className="cs-headline" style={{
              fontFamily: "'Black Ops One', cursive",
              fontSize: 'clamp(22px, 5vw, 32px)',
              letterSpacing: '0.03em',
              lineHeight: 1.05,
              margin: '0 0 10px',
            }}>
              Siraa.LK IS<br />COMING SOON
            </h2>

            {/* Description */}
            <p style={{
              fontSize: '18px', fontWeight: 500,
              color: THEME.textBody,
              letterSpacing: '0.04em',
              lineHeight: 1.6,
              marginBottom: '22px',
            }}>
              Siraa.LK&apos;s Premier Vehicle Selling Platform is under construction.
              Dummy data is currently displayed for testing purposes.
              <span className="cs-blink" style={{ marginLeft: '2px', color: THEME.primary }}>█</span>
            </p>

            {/* Loading dots row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
              {[
                ['cs-dot1', THEME.primary],
                ['cs-dot2', `rgba(${primaryRgb},0.55)`],
                ['cs-dot3', `rgba(${primaryRgb},0.25)`],
              ].map(([cls, bg], i) => (
                <div key={i} className={cls} style={{ width: '7px', height: '7px', borderRadius: '50%', background: bg }} />
              ))}
            </div>

            {/* Dismiss button */}
            <button
              className="cs-dismiss-btn"
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                border: 'none',
                background: THEME.primary,
                color: 'white',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              Ok, Got It
            </button>

            <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px', color: THEME.textMuted, letterSpacing: '0.06em' }}>
              &copy; 2026 Siraa.LK - All Rights Reserved
            </p>
          </div>

          {/* Bottom animated border */}
          <div style={{ height: '3px', position: 'relative', overflow: 'hidden' }}>
            <div className="cs-border-run" style={{ position: 'absolute', inset: 0 }} />
          </div>

          {/* Bottom stripe */}
          <div className="cs-stripe" style={{ height: '4px' }} />
        </div>
      </div>

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
      `}</style>
    </>
  );
};

export default ComingSoonPopup;