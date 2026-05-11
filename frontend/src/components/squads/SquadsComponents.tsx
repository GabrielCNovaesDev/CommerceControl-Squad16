import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import squadService from '../../services/squadService';
import userService, { BulkCreateResult } from '../../services/userService';
import Button from '../ui/Button';
import type { Squad, SquadUser, UserRecord, UserRole } from '../../types';

// ─── Shared styles ────────────────────────────────────────────────────────────

/* Modal appearance is standardized via global CSS classes: .modal-overlay and .modal-box */

export const fieldStyle = (hasError: boolean): React.CSSProperties => ({
  borderRadius: 10,
  border: `1.5px solid ${hasError ? 'var(--cenc-danger)' : 'var(--cenc-gray-300)'}`,
  padding: '10px 14px', fontSize: 14, color: 'var(--cenc-gray-900)',
  background: hasError ? 'var(--cenc-danger-bg)' : 'white',
  width: '100%', boxSizing: 'border-box', outline: 'none',
});

export const ROLE_LABEL: Record<UserRole, string> = {
  PLAYER: 'Jogador', GAME_MASTER: 'Game Master', OBSERVER: 'Observador',
};

export const CARGO_OPTIONS = [
  'Gerente da Loja',
  'Gerente de Serviços',
  'Gerente Abastecimento',
  'Gerente Planejamento Comercial',
  'Gerente Operacional',
] as const;

export type CargoOption = typeof CARGO_OPTIONS[number];

// ─── Confirm Modal ────────────────────────────────────────────────────────────

export function ConfirmModal({ title, message, confirmLabel = 'Confirmar', variant = 'danger', onConfirm, onCancel, loading }: {
  title: string; message: string; confirmLabel?: string;
  variant?: 'danger' | 'primary' | 'secondary';
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-box animate-scale-in">
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--cenc-gray-900)' }}>{title}</h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--cenc-gray-500)', lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="button" variant={variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Squad Modal ───────────────────────────────────────────────────────

const createSquadSchema = z.object({ name: z.string().min(1, 'Nome é obrigatório') });
type SquadFormData = z.infer<typeof createSquadSchema>;

export function CreateSquadModal({ onSuccess, onCancel }: { onSuccess: (s: Squad) => void; onCancel: () => void }) {
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
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      setServerError(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao criar squad');
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box animate-scale-in">
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Novo Squad</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-500)' }}>Crie um novo squad para a simulação.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Nome do squad</label>
            <input className="input-cenc" style={fieldStyle(!!errors.name)} {...register('name')} autoFocus />
            {errors.name && <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-danger)' }}>{errors.name.message}</p>}
          </div>
          {serverError && <div style={{ borderRadius: 10, background: 'var(--cenc-danger-bg)', border: '1px solid #fecaca', padding: '10px 14px', fontSize: 13, color: 'var(--cenc-danger)' }}>{serverError}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Criar Squad</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Squad Modal ─────────────────────────────────────────────────────────

export function EditSquadModal({ squad, onSuccess, onCancel }: { squad: Squad; onSuccess: (s: Squad) => void; onCancel: () => void }) {
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
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      setServerError(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao atualizar squad');
    }
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div className="animate-scale-in" style={MODAL_BOX}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Editar Squad</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Nome do squad</label>
            <input className="input-cenc" style={fieldStyle(!!errors.name)} {...register('name')} autoFocus />
            {errors.name && <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-danger)' }}>{errors.name.message}</p>}
          </div>
          {serverError && <div style={{ borderRadius: 10, background: 'var(--cenc-danger-bg)', border: '1px solid #fecaca', padding: '10px 14px', fontSize: 13, color: 'var(--cenc-danger)' }}>{serverError}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create User Modal ────────────────────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['PLAYER', 'GAME_MASTER']),
  cargo: z.string().nullable().optional(),
  squadId: z.string().nullable().optional(),
});
type CreateUserFormData = z.infer<typeof createUserSchema>;

export function CreateUserModal({ squads, onSuccess, onCancel }: { squads: Squad[]; onSuccess: (u: UserRecord) => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'PLAYER', squadId: '' },
  });
  const [serverError, setServerError] = useState('');

  async function onSubmit(data: CreateUserFormData) {
    setServerError('');
    try {
      const payload = { ...data, squadId: data.squadId || null, cargo: data.cargo || null };
      const user = await userService.createUser(payload);
      onSuccess(user);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string; errors?: Record<string, string[]> } } };
      const msg = axiosErr.response?.data?.error?.message
        ?? axiosErr.response?.data?.message
        ?? Object.values(axiosErr.response?.data?.errors ?? {}).flat().join(', ')
        ?? 'Erro ao criar usuário';
      setServerError(msg);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box animate-scale-in" style={{ maxWidth: 480 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Novo Usuário</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-500)' }}>Crie uma nova conta de acesso.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1/-1' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Nome</label>
              <input className="input-cenc" style={fieldStyle(!!errors.name)} {...register('name')} autoFocus />
              {errors.name && <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-danger)' }}>{errors.name.message}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1/-1' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Email</label>
              <input type="email" className="input-cenc" style={fieldStyle(!!errors.email)} {...register('email')} />
              {errors.email && <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-danger)' }}>{errors.email.message}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1/-1' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Senha</label>
              <input type="password" className="input-cenc" style={fieldStyle(!!errors.password)} {...register('password')} />
              {errors.password && <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-danger)' }}>{errors.password.message}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Papel</label>
              <select className="input-cenc" style={fieldStyle(!!errors.role)} {...register('role')}>
                <option value="PLAYER">Jogador</option>
                <option value="GAME_MASTER">Game Master</option>
              </select>
              {errors.role && <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-danger)' }}>{errors.role.message}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Squad (opcional)</label>
              <select className="input-cenc" style={fieldStyle(false)} {...register('squadId')}>
                <option value="">Sem squad</option>
                {squads.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1/-1' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Cargo (opcional)</label>
              <select className="input-cenc" style={fieldStyle(false)} {...register('cargo')}>
                <option value="">Sem cargo</option>
                {CARGO_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {serverError && <div style={{ borderRadius: 10, background: 'var(--cenc-danger-bg)', border: '1px solid #fecaca', padding: '10px 14px', fontSize: 13, color: 'var(--cenc-danger)' }}>{serverError}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Criar Usuário</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

export function AddUserModal({
  squadId, squadName, freeUsers, onSuccess, onCancel,
}: {
  squadId: string; squadName: string; freeUsers: UserRecord[];
  onSuccess: (userId: string) => void; onCancel: () => void;
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
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      setServerError(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao adicionar usuário');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={MODAL_OVERLAY}>
      <div className="animate-scale-in" style={MODAL_BOX}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Adicionar membro</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-500)' }}>Squad: <strong>{squadName}</strong></p>
        </div>
        {freeUsers.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--cenc-gray-400)', fontStyle: 'italic' }}>Não há usuários sem squad disponíveis.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Selecionar usuário</label>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="input-cenc" style={fieldStyle(false)}>
              <option value="">Escolha um usuário...</option>
              {freeUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}) — {ROLE_LABEL[u.role] ?? u.role}</option>
              ))}
            </select>
          </div>
        )}
        {serverError && <div style={{ borderRadius: 10, background: 'var(--cenc-danger-bg)', border: '1px solid #fecaca', padding: '10px 14px', fontSize: 13, color: 'var(--cenc-danger)' }}>{serverError}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          {freeUsers.length > 0 && (
            <Button type="button" onClick={handleAdd} loading={loading} disabled={!selectedUserId}>Adicionar</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Create Users Modal ──────────────────────────────────────────────────

export function BulkCreateUsersModal({ squad, onSuccess, onCancel }: {
  squad: Squad;
  onSuccess: (created: UserRecord[]) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<'config' | 'result'>('config');
  const [count, setCount] = useState(1);
  const [countError, setCountError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState<BulkCreateResult | null>(null);

  async function handleGenerate() {
    setCountError('');
    setServerError('');
    if (!count || count < 1 || count > 50) {
      setCountError('Informe um número entre 1 e 50.');
      return;
    }
    setLoading(true);
    try {
      const res = await userService.bulkCreateUsers(squad.id, count);
      setResult(res);
      setStep('result');
      if (res.created.length > 0) {
        onSuccess(res.created as UserRecord[]);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
      setServerError(axiosErr.response?.data?.error?.message ?? axiosErr.response?.data?.message ?? 'Erro ao gerar usuários');
    } finally {
      setLoading(false);
    }
  }

  const storeName = squad.stores?.[0]?.name ?? squad.name;

  return (
    <div style={MODAL_OVERLAY}>
      <div className="animate-scale-in" style={{ ...MODAL_BOX, maxWidth: 500 }}>
        {step === 'config' ? (
          <>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Gerar Jogadores em Lote</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-500)' }}>
                Squad: <strong>{squad.name}</strong> · Loja: <strong>{storeName}</strong>
              </p>
            </div>
            <div style={{ background: 'var(--cenc-gray-50)', borderRadius: 10, border: '1px solid var(--cenc-gray-200)', padding: '12px 14px', fontSize: 12, color: 'var(--cenc-gray-600)', lineHeight: 1.6 }}>
              Os jogadores serão criados com:
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                <li>Nome: <strong>Jogador 1</strong>, <strong>Jogador 2</strong>, ...</li>
                <li>Email baseado no nome da loja do squad</li>
                <li>Senha padrão: <strong>jogador123</strong></li>
                <li>Papel: <strong>Jogador</strong>, vinculado a este squad</li>
              </ul>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--cenc-gray-700)' }}>Quantos jogadores gerar?</label>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="input-cenc"
                style={fieldStyle(!!countError)}
                autoFocus
              />
              {countError && <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-danger)' }}>{countError}</p>}
            </div>
            {serverError && (
              <div style={{ borderRadius: 10, background: 'var(--cenc-danger-bg)', border: '1px solid #fecaca', padding: '10px 14px', fontSize: 13, color: 'var(--cenc-danger)' }}>
                {serverError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
              <Button type="button" onClick={handleGenerate} loading={loading}>Gerar</Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--cenc-gray-900)' }}>Jogadores Gerados</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--cenc-gray-500)' }}>
                {result!.created.length} criado(s){result!.errors.length > 0 ? `, ${result!.errors.length} com erro` : ''}.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
              {result!.created.map((u) => (
                <div key={(u as UserRecord).id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12 }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                  <span style={{ color: 'var(--cenc-gray-700)', fontFamily: 'monospace' }}>{(u as UserRecord).email}</span>
                </div>
              ))}
              {result!.errors.map((e) => (
                <div key={e.index} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'var(--cenc-danger-bg)', border: '1px solid #fecaca', fontSize: 12 }}>
                  <span style={{ color: 'var(--cenc-danger)', fontWeight: 700 }}>✗</span>
                  <span style={{ color: 'var(--cenc-gray-700)', fontFamily: 'monospace' }}>{e.email}</span>
                  <span style={{ color: 'var(--cenc-gray-400)', marginLeft: 'auto' }}>{e.reason}</span>
                </div>
              ))}
            </div>
            {result!.created.length > 0 && (
              <div style={{ borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 14px', fontSize: 13, color: '#92400e' }}>
                Senha padrão de todos os jogadores: <strong style={{ fontFamily: 'monospace' }}>{result!.password}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="button" onClick={onCancel}>Fechar</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Members Panel ────────────────────────────────────────────────────────────

export function MembersPanel({ squad, onRemoveUser, onAddUser, onBulkCreate }: {
  squad: Squad;
  onRemoveUser: (user: SquadUser, squadId: string) => void;
  onAddUser: (squadId: string) => void;
  onBulkCreate: (squadId: string) => void;
}) {
  const members = squad.users ?? [];
  const [editingCargo, setEditingCargo] = useState<string | null>(null);
  const [savingCargo, setSavingCargo] = useState(false);

  async function handleSaveCargo(userId: string, cargo: string) {
    setSavingCargo(true);
    try {
      await userService.updateUser(userId, { cargo: cargo || null });
      // Update local state by mutating the squad users array
      const user = members.find((u) => u.id === userId);
      if (user) user.cargo = cargo || null;
    } catch {
      // silently ignore — user can retry
    } finally {
      setSavingCargo(false);
      setEditingCargo(null);
    }
  }

  return (
    <div style={{ background: 'var(--cenc-gray-50)', borderTop: '1px solid var(--cenc-gray-100)', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--cenc-gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Membros</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={() => onBulkCreate(squad.id)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-blue-600)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>⚡ Gerar Jogadores</button>
          <button onClick={() => onAddUser(squad.id)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--cenc-blue-600)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Adicionar membro</button>
        </div>
      </div>
      {members.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--cenc-gray-400)', fontStyle: 'italic' }}>Nenhum membro neste squad.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['Nome', 'Email', 'Papel', 'Cargo', ''].map((h) => (
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
                <td style={{ padding: '6px 12px 6px 0', minWidth: 180 }}>
                  {editingCargo === user.id ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <select
                        defaultValue={user.cargo ?? ''}
                        id={`cargo-select-${user.id}`}
                        style={{ fontSize: 12, borderRadius: 6, border: '1px solid var(--cenc-gray-300)', padding: '2px 6px', color: 'var(--cenc-gray-800)', background: 'white' }}
                      >
                        <option value="">Sem cargo</option>
                        {CARGO_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button
                        disabled={savingCargo}
                        onClick={() => {
                          const sel = document.getElementById(`cargo-select-${user.id}`) as HTMLSelectElement;
                          handleSaveCargo(user.id, sel.value);
                        }}
                        style={{ fontSize: 11, fontWeight: 700, color: 'white', background: 'var(--cenc-blue-600)', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}
                      >{savingCargo ? '...' : 'OK'}</button>
                      <button
                        onClick={() => setEditingCargo(null)}
                        style={{ fontSize: 11, color: 'var(--cenc-gray-400)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingCargo(user.id)}
                      style={{ fontSize: 12, color: user.cargo ? 'var(--cenc-gray-700)' : 'var(--cenc-gray-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontStyle: user.cargo ? 'normal' : 'italic' }}
                      title="Clique para editar o cargo"
                    >
                      {user.cargo ?? 'Sem cargo'} <span style={{ fontSize: 10, color: 'var(--cenc-blue-400)' }}>✎</span>
                    </button>
                  )}
                </td>
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
