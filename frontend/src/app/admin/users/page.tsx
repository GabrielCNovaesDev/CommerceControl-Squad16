'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { CARGO_OPTIONS } from '@/components/squads/SquadsComponents';
import { useToast } from '@/components/hooks/useToast';
import { apiFetch, asArray } from '@/components/utils/api';
import type { Squad, UserRecord, UserRole } from '@/components/types';
import React from 'react';
import usePageTitle from '@/components/hooks/usePageTitle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const MODAL_OVERLAY: React.CSSProperties = { position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)' };
const MODAL_BOX: React.CSSProperties = { background:'white',borderRadius:20,boxShadow:'0 24px 64px rgba(0,0,0,0.18)',border:'1px solid var(--cenc-gray-200)',width:'100%',maxWidth:460,margin:'0 16px',padding:28,display:'flex',flexDirection:'column',gap:20 };
const fs = (hasError: boolean): React.CSSProperties => ({ borderRadius:10,border:`1.5px solid ${hasError?'var(--cenc-danger)':'var(--cenc-gray-300)'}`,padding:'10px 14px',fontSize:14,color:'var(--cenc-gray-900)',background:hasError?'var(--cenc-danger-bg)':'white',width:'100%',boxSizing:'border-box',outline:'none' });

const ROLE_LABEL: Record<UserRole, string> = { PLAYER: 'Jogador', GAME_MASTER: 'Game Master', OBSERVER: 'Observador' };
const ROLE_BADGE: Record<UserRole, 'blue' | 'green' | 'gray'> = { PLAYER: 'blue', GAME_MASTER: 'green', OBSERVER: 'gray' };

function ConfirmModal({ title, message, confirmLabel = 'Confirmar', onConfirm, onCancel, loading }: {
  title: string; message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div style={MODAL_OVERLAY}>
      <div style={MODAL_BOX}>
        <div>
          <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:'var(--cenc-gray-900)' }}>{title}</h2>
          <p style={{ margin:'6px 0 0',fontSize:13,color:'var(--cenc-gray-500)',lineHeight:1.5 }}>{message}</p>
        </div>
        <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['PLAYER', 'GAME_MASTER']),
  cargo: z.string().nullable().optional(),
  squadId: z.string().nullable().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

function CreateUserModal({ squads, onSuccess, onCancel }: { squads: Squad[]; onSuccess: (user: UserRecord) => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'PLAYER', squadId: '' },
  });
  const [serverError, setServerError] = useState('');

  async function onSubmit(data: CreateUserFormData) {
    setServerError('');
    try {
      const payload = { ...data, squadId: data.squadId || null, cargo: data.cargo || null };
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao criar usuário');
      }
      const user = await res.json();
      onSuccess(user);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao criar usuário');
    }
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div style={MODAL_BOX}>
        <div>
          <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:'var(--cenc-gray-900)' }}>Novo Usuário</h2>
          <p style={{ margin:'4px 0 0',fontSize:13,color:'var(--cenc-gray-500)' }}>Preencha os dados para criar uma nova conta.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Nome</label>
            <input style={fs(!!errors.name)} {...register('name')} autoFocus />
            {errors.name && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.name.message}</p>}
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Email</label>
            <input type="email" style={fs(!!errors.email)} {...register('email')} />
            {errors.email && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.email.message}</p>}
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Senha inicial</label>
            <input type="password" style={fs(!!errors.password)} {...register('password')} />
            {errors.password && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.password.message}</p>}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Papel</label>
              <select style={fs(!!errors.role)} {...register('role')}>
                <option value="PLAYER">Jogador</option>
                <option value="GAME_MASTER">Game Master</option>
              </select>
              {errors.role && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.role.message}</p>}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Squad (opcional)</label>
              <select style={fs(false)} {...register('squadId')}>
                <option value="">Sem squad</option>
                {squads.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:6,gridColumn:'1/-1' }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Cargo (opcional)</label>
              <select style={fs(false)} {...register('cargo')}>
                <option value="">Sem cargo</option>
                {CARGO_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {serverError && <div style={{ borderRadius:10,background:'var(--cenc-danger-bg)',border:'1px solid #fecaca',padding:'10px 14px',fontSize:13,color:'var(--cenc-danger)' }}>{serverError}</div>}
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4 }}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Criar Usuário</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const editUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['PLAYER', 'GAME_MASTER']),
  cargo: z.string().nullable().optional(),
  squadId: z.string().nullable().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

function EditUserModal({ user, squads, onSuccess, onCancel }: { user: UserRecord; squads: Squad[]; onSuccess: (user: UserRecord) => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      password: '',
      role: user.role as 'PLAYER' | 'GAME_MASTER',
      cargo: user.cargo ?? '',
      squadId: user.squadId ?? '',
    },
  });
  const [serverError, setServerError] = useState('');

  async function onSubmit(data: EditUserFormData) {
    setServerError('');
    try {
      const payload = {
        name: data.name,
        email: data.email,
        role: data.role,
        cargo: data.cargo || null,
        squadId: data.squadId || null,
        ...(data.password ? { password: data.password } : {}),
      };
      const res = await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao atualizar usuário');
      }
      const updated = await res.json();
      onSuccess(updated);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    }
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div style={MODAL_BOX}>
        <div>
          <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:'var(--cenc-gray-900)' }}>Editar Usuário</h2>
          <p style={{ margin:'4px 0 0',fontSize:13,color:'var(--cenc-gray-500)' }}>Atualize os dados da conta.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Nome</label>
            <input style={fs(!!errors.name)} {...register('name')} autoFocus />
            {errors.name && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.name.message}</p>}
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Email</label>
            <input type="email" style={fs(!!errors.email)} {...register('email')} />
            {errors.email && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.email.message}</p>}
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
            <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Nova senha <span style={{ fontWeight:400,color:'var(--cenc-gray-400)' }}>(deixe em branco para não alterar)</span></label>
            <input type="password" style={fs(!!errors.password)} {...register('password')} />
            {errors.password && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.password.message}</p>}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Papel</label>
              <select style={fs(!!errors.role)} {...register('role')}>
                <option value="PLAYER">Jogador</option>
                <option value="GAME_MASTER">Game Master</option>
              </select>
              {errors.role && <p style={{ margin:0,fontSize:12,color:'var(--cenc-danger)' }}>{errors.role.message}</p>}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Squad</label>
              <select style={fs(false)} {...register('squadId')}>
                <option value="">Sem squad</option>
                {squads.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:6,gridColumn:'1/-1' }}>
              <label style={{ fontSize:13,fontWeight:600,color:'var(--cenc-gray-700)' }}>Cargo (opcional)</label>
              <select style={fs(false)} {...register('cargo')}>
                <option value="">Sem cargo</option>
                {CARGO_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {serverError && <div style={{ borderRadius:10,background:'var(--cenc-danger-bg)',border:'1px solid #fecaca',padding:'10px 14px',fontSize:13,color:'var(--cenc-danger)' }}>{serverError}</div>}
          <div style={{ display:'flex',gap:10,justifyContent:'flex-end',paddingTop:4 }}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersManagementPage() {
  usePageTitle("Gerenciar Usuários");
  const toast = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    setLoadError('');
    try {
      const [userRes, squadRes] = await Promise.all([
        apiFetch<unknown>(`${API_BASE}/users`),
        apiFetch<unknown>(`${API_BASE}/squads`),
      ]);
      if (userRes.error && squadRes.error) {
        setLoadError(userRes.error);
        setUsers([]);
        setSquads([]);
        return;
      }
      setUsers(asArray<UserRecord>(userRes.data));
      setSquads(asArray<Squad>(squadRes.data));
    } catch {
      setLoadError('Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  function handleCreated(user: UserRecord) {
    setUsers((prev) => [user, ...prev]);
    setCreateOpen(false);
    toast.success(`Usuário "${user.name}" criado com sucesso!`);
  }

  function handleUpdated(updated: UserRecord) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditUser(null);
    toast.success('Usuário atualizado com sucesso!');
  }

  async function handleConfirmDelete() {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/users/${deleteUser.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao deletar usuário');
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteUser(null);
      toast.success('Usuário removido.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar usuário');
    } finally {
      setDeleting(false);
    }
  }

  const squadMap = Object.fromEntries(squads.map((s) => [s.id, s.name]));

  const filtered = users.filter((u) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.squadId != null && squadMap[u.squadId]?.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--cenc-gray-900)' }}>Usuários</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-500)' }}>Crie e gerencie contas de jogadores e administradores.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>Novo Usuário</Button>
      </div>

      {!loading && !loadError && users.length > 0 && (
        <input type="text" placeholder="Filtrar por nome, email ou squad…" value={filter} onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: 320, borderRadius: 10, border: '1.5px solid var(--cenc-gray-300)', padding: '10px 14px', fontSize: 13, color: 'var(--cenc-gray-900)', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : loadError ? (
        <ErrorMessage message={loadError} onRetry={() => { setLoading(true); loadAll(); }} />
      ) : filtered.length === 0 ? (
        <div style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', background: 'white', padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--cenc-gray-500)' }}>
            {filter ? 'Nenhum usuário encontrado para esta busca.' : 'Nenhum usuário cadastrado.'}
          </p>
          {!filter && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-400)' }}>Crie o primeiro usuário para começar.</p>}
        </div>
      ) : (
        <div style={{ borderRadius: 14, border: '1px solid var(--cenc-gray-200)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--cenc-gray-50)', borderBottom: '1px solid var(--cenc-gray-200)' }}>
                {['Nome','Email','Papel','Cargo','Squad','Ações'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 16px', fontWeight: 700, fontSize: 11, color: 'var(--cenc-gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="table-row-hover" style={{ borderTop: '1px solid var(--cenc-gray-100)', background: 'white' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cenc-gray-900)' }}>
                    {user.name}
                    {user.leader && (
                      <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700, background: 'var(--cenc-gold-100)', color: '#92400e', border: '1px solid #fde68a' }}>Líder</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--cenc-gray-500)' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px' }}><Badge variant={ROLE_BADGE[user.role] ?? 'gray'}>{ROLE_LABEL[user.role] ?? user.role}</Badge></td>
                  <td style={{ padding: '12px 16px', color: 'var(--cenc-gray-500)', fontSize: 12 }}>
                    {user.cargo ?? <span style={{ color: 'var(--cenc-gray-300)', fontStyle: 'italic' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--cenc-gray-500)' }}>
                    {user.squadId ? squadMap[user.squadId] ?? '—' : <span style={{ color: 'var(--cenc-gray-300)' }}>Sem squad</span>}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={() => setEditUser(user)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-blue-600)', background: 'var(--cenc-blue-50)', border: '1px solid var(--cenc-blue-100)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-100)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--cenc-blue-50)'; }}>Editar</button>
                      <button onClick={() => setDeleteUser(user)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-danger)', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fecaca'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}>Deletar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--cenc-gray-100)', background: 'var(--cenc-gray-50)' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-gray-400)' }}>
              {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}{filter && ` encontrado${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
