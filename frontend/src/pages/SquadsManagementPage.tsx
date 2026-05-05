import { useEffect, useState } from 'react';
import squadService from '../services/squadService';
import userService from '../services/userService';
import AdminLayout from '../components/layout/AdminLayout';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import {
  ConfirmModal,
  CreateSquadModal,
  EditSquadModal,
  CreateUserModal,
  AddUserModal,
  MembersPanel,
} from '../components/squads/SquadsComponents';
import type { Squad, SquadUser, UserRecord } from '../types';

export default function SquadsManagementPage() {
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

  async function loadAll() {
    setLoadError('');
    try {
      const [squadData, userData] = await Promise.all([
        squadService.getSquads(),
        userService.getUsers(),
      ]);
      const squadList = Array.isArray(squadData) ? squadData : (squadData as { content?: Squad[] }).content ?? [];
      const userList = Array.isArray(userData) ? userData : (userData as { content?: UserRecord[] }).content ?? [];
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
      await squadService.deleteSquad(deleteSquad.id);
      setSquads((prev) => prev.filter((s) => s.id !== deleteSquad.id));
      setDeleteSquad(null);
      toast.success('Squad removido.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      toast.error(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao deletar squad');
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
      await squadService.removeUser(removeUser.squadId, removeUser.user.id);
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      toast.error(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao remover usuário');
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
    <AdminLayout>
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
                    <MembersPanel squad={squad} onRemoveUser={handleRemoveUser} onAddUser={(id) => setAddUserTo(id)} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {createSquadOpen && <CreateSquadModal onSuccess={handleSquadCreated} onCancel={() => setCreateSquadOpen(false)} />}
      {editSquad && <EditSquadModal squad={editSquad} onSuccess={handleSquadUpdated} onCancel={() => setEditSquad(null)} />}
      {deleteSquad && (
        <ConfirmModal
          title={`Deletar "${deleteSquad.name}"?`}
          message="O squad e todos os seus dados serão removidos permanentemente."
          confirmLabel="Deletar Squad"
          onConfirm={handleDeleteSquad}
          onCancel={() => setDeleteSquad(null)}
          loading={deletingSquad}
        />
      )}
      {createUserOpen && <CreateUserModal squads={squads} onSuccess={handleUserCreated} onCancel={() => setCreateUserOpen(false)} />}
      {addUserTo && addUserSquad && (
        <AddUserModal
          squadId={addUserTo}
          squadName={addUserSquad.name}
          freeUsers={freeUsers}
          onSuccess={handleAddUserSuccess}
          onCancel={() => setAddUserTo(null)}
        />
      )}
      {removeUser && (
        <ConfirmModal
          title={`Remover "${removeUser.user.name}"?`}
          message="O usuário será removido do squad. Ele continuará com acesso ao sistema."
          confirmLabel="Remover"
          onConfirm={handleConfirmRemoveUser}
          onCancel={() => setRemoveUser(null)}
          loading={removingUser}
        />
      )}
    </AdminLayout>
  );
}
