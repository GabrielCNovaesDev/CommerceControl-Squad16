import React from 'react';
import type { Tutorial } from './tutorialsData';
import { CATEGORY_LABELS, CATEGORY_COLORS } from './tutorialsData';

interface TutorialModalProps {
  tutorial: Tutorial;
  onClose: () => void;
}

export default function TutorialModal({ tutorial, onClose }: TutorialModalProps) {
  const catColor = CATEGORY_COLORS[tutorial.category];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="animate-scale-in"
        style={{
          background: 'white', borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          border: '1px solid var(--cenc-gray-200)',
          width: '100%', maxWidth: '600px',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid var(--cenc-gray-100)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
              background: catColor.bg, border: `1px solid ${catColor.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: catColor.text,
            }}>
              <TutorialIcon name={tutorial.icon} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: catColor.text, background: catColor.bg,
                  border: `1px solid ${catColor.border}`,
                  borderRadius: '6px', padding: '2px 8px',
                }}>
                  {CATEGORY_LABELS[tutorial.category]}
                </span>
                <AudienceBadge audience={tutorial.audience} />
              </div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--cenc-gray-900)', lineHeight: 1.3 }}>
                {tutorial.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: '8px',
              border: '1px solid var(--cenc-gray-200)', background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--cenc-gray-500)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cenc-gray-50)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--cenc-gray-500)', lineHeight: 1.6 }}>
            {tutorial.description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {tutorial.sections.map((section, i) => (
              <div key={i}>
                <h3 style={{
                  margin: '0 0 8px', fontSize: '13px', fontWeight: 700,
                  color: 'var(--cenc-gray-800)', display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--cenc-blue-600)', color: 'white',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700,
                  }}>
                    {i + 1}
                  </span>
                  {section.heading}
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--cenc-gray-600)', lineHeight: 1.65, paddingLeft: '28px' }}>
                  {section.body}
                </p>
                {section.steps && (
                  <ol style={{ margin: 0, paddingLeft: '44px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {section.steps.map((step, si) => (
                      <li key={si} style={{ fontSize: '13px', color: 'var(--cenc-gray-600)', lineHeight: 1.5 }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--cenc-gray-100)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              background: 'var(--cenc-blue-600)', color: 'white', border: 'none',
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function AudienceBadge({ audience }: { audience: Tutorial['audience'] }) {
  if (audience === 'BOTH') {
    return (
      <span style={{
        fontSize: '11px', fontWeight: 600, borderRadius: '6px', padding: '2px 8px',
        background: 'var(--cenc-gray-100)', color: 'var(--cenc-gray-500)',
        border: '1px solid var(--cenc-gray-200)',
      }}>
        Todos
      </span>
    );
  }
  if (audience === 'GAME_MASTER') {
    return (
      <span style={{
        fontSize: '11px', fontWeight: 600, borderRadius: '6px', padding: '2px 8px',
        background: 'rgba(245,166,35,0.12)', color: '#92600a',
        border: '1px solid rgba(245,166,35,0.3)',
      }}>
        Game Master
      </span>
    );
  }
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, borderRadius: '6px', padding: '2px 8px',
      background: '#eff6ff', color: '#1d4ed8',
      border: '1px solid #bfdbfe',
    }}>
      Player
    </span>
  );
}

function TutorialIcon({ name }: { name: string }) {
  const props = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'login':
      return <svg {...props}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
    case 'dashboard':
      return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
    case 'admin':
      return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'config':
      return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>;
    case 'rounds':
      return <svg {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case 'squads':
      return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'results':
      return <svg {...props}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case 'ranking':
      return <svg {...props}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
    case 'game':
      return <svg {...props}><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M7 12h.01"/><path d="M17 12h.01"/></svg>;
    case 'demand':
      return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case 'finance':
      return <svg {...props}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'capex':
      return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
    case 'csat':
      return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case 'cycle':
      return <svg {...props}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
    case 'strategy':
      return <svg {...props}><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>;
    case 'inventory':
      return <svg {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
    case 'balance':
      return <svg {...props}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'monitor':
      return <svg {...props}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
    case 'tips':
      return <svg {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
  }
}
