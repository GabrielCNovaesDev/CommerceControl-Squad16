import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import AdminLayout from '../components/layout/AdminLayout';
import PlayerLayout from '../components/layout/PlayerLayout';
import TutorialCard from '../components/tutorials/TutorialCard';
import TutorialModal from '../components/tutorials/TutorialModal';
import { TUTORIALS, CATEGORY_LABELS } from '../components/tutorials/tutorialsData';
import type { Tutorial, TutorialCategory } from '../components/tutorials/tutorialsData';

type FilterCategory = 'all' | TutorialCategory;

const FILTER_TABS: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'platform', label: CATEGORY_LABELS.platform },
  { key: 'game', label: CATEGORY_LABELS.game },
  { key: 'strategy', label: CATEGORY_LABELS.strategy },
];

export default function TutorialsPage() {
  const { user } = useAuthStore();
  const role = user?.role ?? 'PLAYER';
  const isGM = role === 'GAME_MASTER';

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const visibleTutorials = TUTORIALS.filter((t) => {
    const audienceMatch = t.audience === 'BOTH' || t.audience === role;
    const categoryMatch = activeFilter === 'all' || t.category === activeFilter;
    return audienceMatch && categoryMatch;
  });

  const content = (
    <div className="animate-fade-in" style={{ maxWidth: '1100px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'var(--cenc-blue-50)', border: '1px solid var(--cenc-blue-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--cenc-blue-600)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>
              Tutoriais
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-500)' }}>
              {isGM
                ? 'Guias para conduzir a simulação e gerenciar a plataforma'
                : 'Guias para usar a plataforma e dominar a simulação'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {FILTER_TABS.slice(1).map((tab) => {
          const count = TUTORIALS.filter(
            (t) => t.category === tab.key && (t.audience === 'BOTH' || t.audience === role)
          ).length;
          return (
            <div key={tab.key} style={{
              background: 'white', borderRadius: '12px',
              border: '1px solid var(--cenc-gray-200)',
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cenc-blue-600)' }}>{count}</span>
              <span style={{ fontSize: '12px', color: 'var(--cenc-gray-500)', fontWeight: 500 }}>{tab.label}</span>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '24px',
        background: 'white', borderRadius: '12px',
        border: '1px solid var(--cenc-gray-200)',
        padding: '6px', width: 'fit-content',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: isActive ? 'var(--cenc-blue-600)' : 'transparent',
                color: isActive ? 'white' : 'var(--cenc-gray-500)',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {visibleTutorials.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'white', borderRadius: '14px',
          border: '1px solid var(--cenc-gray-200)',
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--cenc-gray-400)' }}>
            Nenhum tutorial encontrado para este filtro.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {visibleTutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              onClick={() => setSelectedTutorial(tutorial)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedTutorial && (
        <TutorialModal
          tutorial={selectedTutorial}
          onClose={() => setSelectedTutorial(null)}
        />
      )}
    </div>
  );

  if (isGM) {
    return <AdminLayout>{content}</AdminLayout>;
  }
  return <PlayerLayout>{content}</PlayerLayout>;
}
