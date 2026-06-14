'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/hooks/useToast';
import usePageTitle from '@/components/hooks/usePageTitle';
import { apiFetch, asArray } from '@/components/utils/api';
import {
  ConfirmModal,
  CreateSquadModal,
  EditSquadModal,
  CreateUserModal,
  AddUserModal,
  MembersPanel,
  BulkCreateUsersModal,
} from '@/components/squads/SquadsComponents';
import type { Squad, SquadUser, UserRecord } from '@/components/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function SquadsManagementPage() {
  usePageTitle("Gerenciar Squads");
  const toast = useToast();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [createSquadOpen, setCreateSquadOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editSquad, setEditSquad] = useState<Squad | null>(null);
  const [deleteSquad, setDeleteSquad] = useState<Squad | null>(null);
  const [deletingSquad, setDeletingSquad] = useState(false);
  const [addUserTo, setAddUserTo] = useState<string | null>(null);
  const [removeUser, setRemoveUser] = useState<{ user: SquadUser; squadId: string } | null>(null);
  const [removingUser, setRemovingUser] = useState(false);
  const [bulkCreateSquadId, setBulkCreateSquadId] = useState<string | null>(null);

  async function loadAll() {
    setLoadError('');
    try {
      const [squadRes, userRes] = await Promise.all([
        apiFetch<unknown>(`${API_BASE}/squads`),
        apiFetch<unknown>(`${API_BASE}/users`),
      ]);
      if (squadRes.error && userRes.error) {
        setLoadError(squadRes.error);
        setSquads([]);
        setUsers([]);
        return;
      }
      const squadList: Squad[] = asArray<Squad>(squadRes.data);
      const userList: UserRecord[] = asArray<UserRecord>(userRes.data);
      setSquads(squadList);
      setUsers(userList);
    } catch {
      setLoadError('Não foi possível carregar squads e usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  function handleSquadCreated(squad: Squad) {
    setSquads((prev) => [{ ...squad, users: [], stores: [] }, ...prev]);
    setCreateSquadOpen(false);
    toast.success(`Squad "${squad.name}" criado com sucesso!`);
  }

  function handleSquadUpdated(updated: Squad) {
    setSquads((prev) => prev.map((s) => (s.id === updated.id ? { ...s, name: updated.name } : s)));
    setEditSquad(null);
    toast.success('Squad atualizado com sucesso!');
  }

  async function handleDeleteSquad() {
    if (!deleteSquad) return;
    setDeletingSquad(true);
    try {
      const res = await fetch(`${API_BASE}/squads/${deleteSquad.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao deletar squad');
      }
      setSquads((prev) => prev.filter((s) => s.id !== deleteSquad.id));
      setDeleteSquad(null);
      toast.success('Squad removido.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar squad');
    } finally {
      setDeletingSquad(false);
    }
  }

  function handleUserCreated(user: UserRecord) {
    setUsers((prev) => [...prev, user]);
    if (user.squadId) loadAll();
    setCreateUserOpen(false);
    toast.success(`Usuário "${user.name}" criado com sucesso!`);
  }

  function handleBulkCreated(created: UserRecord[]) {
    if (created.length > 0) {
      loadAll();
      toast.success(`${created.length} jogador(es) gerado(s) com sucesso!`);
    }
  }

  async function handleAddUserSuccess(_userId: string) {
    await loadAll();
    setAddUserTo(null);
    toast.success('Usuário adicionado ao squad.');
  }

  function handleRemoveUser(user: SquadUser, squadId: string) {
    setRemoveUser({ user, squadId });
  }

  async function handleConfirmRemoveUser() {
    if (!removeUser) return;
    setRemovingUser(true);
    try {
      const res = await fetch(`${API_BASE}/squads/${removeUser.squadId}/users/${removeUser.user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao remover usuário');
      }
      setSquads((prev) =>
        prev.map((s) =>
          s.id === removeUser.squadId
            ? { ...s, users: (s.users ?? []).filter((u) => u.id !== removeUser.user.id) }
            : s
        )
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === removeUser.user.id ? { ...u, squadId: null } : u))
      );
      setRemoveUser(null);
      toast.success('Usuário removido do squad.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover usuário');
    } finally {
      setRemovingUser(false);
    }
  }

  const freeUsers = users.filter((u) => !u.squadId);
  const addUserSquad = squads.find((s) => s.id === addUserTo);

  const plusIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--cenc-gray-900)' }}>Squads e Usuários</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-500)' }}>Gerencie squads, membros e contas de acesso.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Button variant="secondary" onClick={() => setCreateUserOpen(true)} icon={plusIcon}>Usuário</Button>
          <Button onClick={() => setCreateSquadOpen(true)} icon={plusIcon}>Squad</Button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : loadError ? (
        <ErrorMessage message={loadError} onRetry={() => { setLoading(true); loadAll(); }} />
      ) : squads.length === 0 ? (
        <div style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', background: 'white', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--cenc-gray-500)' }}>Nenhum squad cadastrado.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-400)' }}>Crie o primeiro squad para começar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {squads.map((squad) => {
            const store = squad.stores?.[0] ?? null;
            const isExpanded = expandedId === squad.id;
            return (
              <div key={squad.id} style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : squad.id)}
                    style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cenc-gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, transition: 'all 0.15s' }}
                    aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                  >
                    <svg style={{ width: 16, height: 16, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--cenc-gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{squad.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cenc-gray-400)' }}>
                      {store ? `Loja: ${store.name}` : 'Sem loja vinculada'} · {squad.users?.length ?? 0} membro(s)
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => setEditSquad(squad)}
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-blue-600)', background: 'var(--cenc-blue-50)', border: '1px solid var(--cenc-blue-100)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-100)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-50)'; }}
                    >Editar</button>
                    <button
                      onClick={() => setDeleteSquad(squad)}
                      style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-danger)', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fecaca'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
                    >Deletar</button>
                  </div>
                </div>
                {isExpanded && (
                  <MembersPanel squad={squad} onRemoveUser={handleRemoveUser} onAddUser={(id) => setAddUserTo(id)} onBulkCreate={(id) => setBulkCreateSquadId(id)} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
