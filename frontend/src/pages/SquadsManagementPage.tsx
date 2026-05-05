import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import squadService from '../services/squadService';
import userService from '../services/userService';
import AdminLayout from '../components/layout/AdminLayout';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import type { Squad, SquadUser, UserRecord, UserRole } from '../types';
import React from 'react';

const MODAL_OVERLAY: React.CSSProperties = { position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)' };
const MODAL_BOX: React.CSSProperties = { background:'white',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,0.18)',border:'1px solid var(--cenc-gray-200)',width:'100%',maxWidth:440,margin:'0 16px',padding:28,display:'flex',flexDirection:'column',gap:20 };
const fs = (hasError: boolean): React.CSSProperties => ({ borderRadius:10,border:`1.5px solid ${hasError?'var(--cenc-danger)':'var(--cenc-gray-300)'}`,padding:'10px 14px',fontSize:14,color:'var(--cenc-gray-900)',background:hasError?'var(--cenc-danger-bg)':'white',width:'100%',boxSizing:'border-box',outline:'none' });

const ROLE_LABEL: Record<UserRole, string> = { PLAYER: 'Jogador', GAME_MASTER: 'Game Master', OBSERVER: 'Observador' };

function ConfirmModal({ title, message, confirmLabel = 'Confirmar', variant = 'danger', onConfirm, onCancel, loading }: {
  title: string; message: string; confirmLabel?: string; variant?: 'danger' | 'primary' | 'secondary'; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div style={MODAL_OVERLAY}>
      <div className="animate-scale-in" style={MODAL_BOX}>
        <div>
          <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:'var(--cenc-gray-900)' }}>{title}</h2>
          <p style={{ margin:'6px 0 0',fontSize:13,color:'var(--cenc-gray-500)',lineHeight:1.5 }}>{message}</p>
        </div>
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="button" variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal — Criar Squad ─────────────────────────────────────────────────────

const createSquadSchema = z.object({ name: z.string().min(1, 'Nome é obrigatório') });
type SquadFormData = z.infer<typeof createSquadSchema>;

function CreateSquadModal({ onSuccess, onCancel }: { onSuccess: (s: Squad) => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SquadFormData>({
    resolver: zodResolver(createSquadSchema),
  });
  const [serverError, setServerError] = useState('');

  async function onSubmit(data: SquadFormData) {
    setServerError('');
    try {
      const squad = await squadService.createSquad(data);
      onSuccess(squad);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr.response?.data?.message ?? 'Erro ao criar squad');
    }
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div className="animate-scale-in" style={MODAL_BOX}>
        <div>
          <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:'var(--cenc-gray-900)' }}>Novo Squad</h2>
          <p style={{ margin:'4px 0 0',fontSize:13,color:'var(--cenc-gray-500)' }}>Crie um novo squad para a simulação.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Nome do squad</label>
            <input className="input-cenc" style={fs(!!errors.name)} {...register('name')} autoFocus />
            {errors.name && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.name.message}</p>}
          </div>
          {serverError && <div style={{ borderRadius:10,background:'var(--cenc-danger-bg)',border:'1px solid #fecaca',padding:'10px 14px',fontSize:13,color:'var(--cenc-danger)' }}>{serverError}</div>}
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Criar Squad</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal — Editar Squad ────────────────────────────────────────────────────

function EditSquadModal({ squad, onSuccess, onCancel }: { squad: Squad; onSuccess: (s: Squad) => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SquadFormData>({
    resolver: zodResolver(createSquadSchema),
    defaultValues: { name: squad.name },
  });
  const [serverError, setServerError] = useState('');

  async function onSubmit(data: SquadFormData) {
    setServerError('');
    try {
      const updated = await squadService.updateSquad(squad.id, data);
      onSuccess(updated);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr.response?.data?.message ?? 'Erro ao atualizar squad');
    }
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div className="animate-scale-in" style={MODAL_BOX}>
        <div>
          <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:'var(--cenc-gray-900)' }}>Editar Squad</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Nome do squad</label>
            <input className="input-cenc" style={fs(!!errors.name)} {...register('name')} autoFocus />
            {errors.name && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.name.message}</p>}
          </div>
          {serverError && <div style={{ borderRadius:10,background:'var(--cenc-danger-bg)',border:'1px solid #fecaca',padding:'10px 14px',fontSize:13,color:'var(--cenc-danger)' }}>{serverError}</div>}
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal — Criar Usuário ───────────────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['PLAYER', 'GAME_MASTER']),
  squadId: z.string().uuid().nullable().optional(),
});
type CreateUserFormData = z.infer<typeof createUserSchema>;

function CreateUserModal({ squads, onSuccess, onCancel }: { squads: Squad[]; onSuccess: (u: UserRecord) => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'PLAYER', squadId: '' },
  });
  const [serverError, setServerError] = useState('');

  async function onSubmit(data: CreateUserFormData) {
    setServerError('');
    try {
      const payload = { ...data, squadId: data.squadId || null };
      const user = await userService.createUser(payload);
      onSuccess(user);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = axiosErr.response?.data?.message
        ?? Object.values(axiosErr.response?.data?.errors ?? {}).flat().join(', ')
        ?? 'Erro ao criar usuário';
      setServerError(msg);
    }
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div className="animate-scale-in" style={{ ...MODAL_BOX, maxWidth: 480 }}>
        <div>
          <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:'var(--cenc-gray-900)' }}>Novo Usuário</h2>
          <p style={{ margin:'4px 0 0',fontSize:13,color:'var(--cenc-gray-500)' }}>Crie uma nova conta de acesso.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div style={{ display:'flex',flexDirection:'column',gap:6,gridColumn:'1/-1' }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Nome</label>
              <input className="input-cenc" style={fs(!!errors.name)} {...register('name')} autoFocus />
              {errors.name && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.name.message}</p>}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:6,gridColumn:'1/-1' }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Email</label>
              <input type="email" className="input-cenc" style={fs(!!errors.email)} {...register('email')} />
              {errors.email && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.email.message}</p>}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:6,gridColumn:'1/-1' }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Senha</label>
              <input type="password" className="input-cenc" style={fs(!!errors.password)} {...register('password')} />
              {errors.password && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.password.message}</p>}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Papel</label>
              <select className="input-cenc" style={fs(!!errors.role)} {...register('role')}>
                <option value="PLAYER">Jogador</option>
                <option value="GAME_MASTER">Game Master</option>
              </select>
              {errors.role && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.role.message}</p>}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Squad (opcional)</label>
              <select className="input-cenc" style={fs(false)} {...register('squadId')}>
                <option value="">Sem squad</option>
                {squads.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          {serverError && <div style={{ borderRadius:10,background:'var(--cenc-danger-bg)',border:'1px solid #fecaca',padding:'10px 14px',fontSize:13,color:'var(--cenc-danger)' }}>{serverError}</div>}
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Criar Usuário</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal — Adicionar usuário ao squad ─────────────────────────────────────

function AddUserModal({
  squadId, squadName, freeUsers, onSuccess, onCancel,
}: {
  squadId: string;
  squadName: string;
  freeUsers: UserRecord[];
  onSuccess: (userId: string) => void;
  onCancel: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  async function handleAdd() {
    if (!selectedUserId) return;
    setLoading(true);
    setServerError('');
    try {
      await squadService.addUser(squadId, selectedUserId);
      onSuccess(selectedUserId);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setServerError(axiosErr.response?.data?.message ?? 'Erro ao adicionar usuário');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div className="animate-scale-in" style={MODAL_BOX}>
        <div>
          <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:'var(--cenc-gray-900)' }}>Adicionar membro</h2>
          <p style={{ margin:'4px 0 0',fontSize:13,color:'var(--cenc-gray-500)' }}>Squad: <strong>{squadName}</strong></p>
        </div>
        {freeUsers.length === 0 ? (
          <p style={{ margin:0,fontSize:13,color:'var(--cenc-gray-400)',fontStyle:'italic' }}>Não há usuários sem squad disponíveis.</p>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Selecionar usuário</label>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="input-cenc" style={fs(false)}>
              <option value="">Escolha um usuário...</option>
              {freeUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}) — {ROLE_LABEL[u.role] ?? u.role}</option>
              ))}
            </select>
          </div>
        )}
        {serverError && <div style={{ borderRadius:10,background:'var(--cenc-danger-bg)',border:'1px solid #fecaca',padding:'10px 14px',fontSize:13,color:'var(--cenc-danger)' }}>{serverError}</div>}
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          {freeUsers.length > 0 && (
            <Button type="button" onClick={handleAdd} loading={loading} disabled={!selectedUserId}>Adicionar</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Linha expandida — membros ───────────────────────────────────────────────

function MembersPanel({ squad, onRemoveUser, onAddUser }: {
  squad: Squad; onRemoveUser: (user: SquadUser, squadId: string) => void; onAddUser: (squadId: string) => void;
}) {
  const members = squad.users ?? [];
  return (
    <div style={{ background: 'var(--cenc-gray-50)', borderTop: '1px solid var(--cenc-gray-100)', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--cenc-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Membros</p>
        <button onClick={() => onAddUser(squad.id)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-blue-600)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Adicionar membro</button>
      </div>
      {members.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-gray-400)', fontStyle: 'italic' }}>Nenhum membro neste squad.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Nome','Email','Papel',''].map((h) => (
                <th key={h} style={{ paddingBottom: 6, fontWeight: 600, color: 'var(--cenc-gray-400)', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((user) => (
              <tr key={user.id} style={{ borderTop: '1px solid var(--cenc-gray-100)' }}>
                <td style={{ padding: '6px 12px 6px 0', fontWeight: 600, color: 'var(--cenc-gray-800)' }}>
                  {user.name}
                  {user.leader && <span style={{ marginLeft: 6, borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700, background: 'var(--cenc-gold-100)', color: '#92400e', border: '1px solid #fde68a' }}>Líder</span>}
                </td>
                <td style={{ padding: '6px 12px 6px 0', color: 'var(--cenc-gray-500)' }}>{user.email}</td>
                <td style={{ padding: '6px 12px 6px 0', color: 'var(--cenc-gray-500)' }}>{ROLE_LABEL[user.role] ?? user.role}</td>
                <td style={{ padding: '6px 0', textAlign: 'right' }}>
                  {user.leader ? (
                    <span style={{ color: 'var(--cenc-gray-300)', cursor: 'not-allowed', fontSize: 12 }} title="Transfira a liderança antes de remover">Remover</span>
                  ) : (
                    <button onClick={() => onRemoveUser(user, squad.id)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remover</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

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
      const [squadList, userList] = await Promise.all([
        squadService.getSquads(),
        userService.getUsers(),
      ]);
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
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Erro ao deletar squad');
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
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Erro ao remover usuário');
    } finally {
      setRemovingUser(false);
    }
  }

  const freeUsers = users.filter((u) => !u.squadId);
  const addUserSquad = squads.find((s) => s.id === addUserTo);

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--cenc-gray-900)' }}>Squads e Usuários</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-500)' }}>Gerencie squads, membros e contas de acesso.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <Button variant="secondary" onClick={() => setCreateUserOpen(true)} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>Usuário</Button>
            <Button onClick={() => setCreateSquadOpen(true)} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>Squad</Button>
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
                    <button onClick={() => setExpandedId(isExpanded ? null : squad.id)}
                      style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cenc-gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, transition: 'all 0.15s' }}
                      aria-label={isExpanded ? 'Recolher' : 'Expandir'}>
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
                      <button onClick={() => setEditSquad(squad)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-blue-600)', background: 'var(--cenc-blue-50)', border: '1px solid var(--cenc-blue-100)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-100)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-50)'; }}>Editar</button>
                      <button onClick={() => setDeleteSquad(squad)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-danger)', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fecaca'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}>Deletar</button>
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
      {deleteSquad && <ConfirmModal title={`Deletar "${deleteSquad.name}"?`} message="O squad e todos os seus dados serão removidos permanentemente." confirmLabel="Deletar Squad" onConfirm={handleDeleteSquad} onCancel={() => setDeleteSquad(null)} loading={deletingSquad} />}
      {createUserOpen && <CreateUserModal squads={squads} onSuccess={handleUserCreated} onCancel={() => setCreateUserOpen(false)} />}
      {addUserTo && addUserSquad && <AddUserModal squadId={addUserTo} squadName={addUserSquad.name} freeUsers={freeUsers} onSuccess={handleAddUserSuccess} onCancel={() => setAddUserTo(null)} />}
      {removeUser && <ConfirmModal title={`Remover "${removeUser.user.name}"?`} message={`O usuário será removido do squad. Ele continuará com acesso ao sistema.`} confirmLabel="Remover" onConfirm={handleConfirmRemoveUser} onCancel={() => setRemoveUser(null)} loading={removingUser} />}
    </AdminLayout>
  );
}
