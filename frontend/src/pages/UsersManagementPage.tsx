import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import userService from '../services/userService';
import squadService from '../services/squadService';
import AdminLayout from '../components/layout/AdminLayout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import type { Squad, UserRecord, UserRole } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<UserRole, string> = { PLAYER: 'Jogador', GAME_MASTER: 'Game Master', OBSERVER: 'Observador' };
const ROLE_BADGE: Record<UserRole, 'blue' | 'green' | 'gray'> = { PLAYER: 'blue', GAME_MASTER: 'green', OBSERVER: 'gray' };

function fieldClass(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;
}

// ─── Modal de confirmação ─────────────────────────────────────────────────────

function ConfirmModal({
  title, message, confirmLabel = 'Confirmar', onConfirm, onCancel, loading,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Schema e Modal — Criar usuário ──────────────────────────────────────────

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['PLAYER', 'GAME_MASTER']),
  squadId: z.string().nullable().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

function CreateUserModal({
  squads, onSuccess, onCancel,
}: {
  squads: Squad[];
  onSuccess: (user: UserRecord) => void;
  onCancel: () => void;
}) {
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
      const msg =
        axiosErr.response?.data?.message ??
        Object.values(axiosErr.response?.data?.errors ?? {}).flat().join(', ') ??
        'Erro ao criar usuário';
      setServerError(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-gray-900">Novo Usuário</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <input className={fieldClass(!!errors.name)} {...register('name')} autoFocus />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input type="email" className={fieldClass(!!errors.email)} {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Senha inicial</label>
            <input type="password" className={fieldClass(!!errors.password)} {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Papel</label>
              <select className={fieldClass(!!errors.role)} {...register('role')}>
                <option value="PLAYER">Jogador</option>
                <option value="GAME_MASTER">Game Master</option>
              </select>
              {errors.role && <p className="text-xs text-red-600">{errors.role.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Squad (opcional)</label>
              <select className={fieldClass(false)} {...register('squadId')}>
                <option value="">Sem squad</option>
                {squads.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          {serverError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Criar Usuário</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Schema e Modal — Editar usuário ─────────────────────────────────────────

const editUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['PLAYER', 'GAME_MASTER']),
  squadId: z.string().nullable().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

function EditUserModal({
  user, squads, onSuccess, onCancel,
}: {
  user: UserRecord;
  squads: Squad[];
  onSuccess: (user: UserRecord) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      password: '',
      role: user.role as 'PLAYER' | 'GAME_MASTER',
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
        squadId: data.squadId || null,
        ...(data.password ? { password: data.password } : {}),
      };
      const updated = await userService.updateUser(user.id, payload);
      onSuccess(updated);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg =
        axiosErr.response?.data?.message ??
        Object.values(axiosErr.response?.data?.errors ?? {}).flat().join(', ') ??
        'Erro ao atualizar usuário';
      setServerError(msg);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-gray-900">Editar Usuário</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <input className={fieldClass(!!errors.name)} {...register('name')} autoFocus />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input type="email" className={fieldClass(!!errors.email)} {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Nova senha <span className="text-gray-400 font-normal">(deixe em branco para não alterar)</span>
            </label>
            <input type="password" className={fieldClass(!!errors.password)} {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Papel</label>
              <select className={fieldClass(!!errors.role)} {...register('role')}>
                <option value="PLAYER">Jogador</option>
                <option value="GAME_MASTER">Game Master</option>
              </select>
              {errors.role && <p className="text-xs text-red-600">{errors.role.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Squad</label>
              <select className={fieldClass(false)} {...register('squadId')}>
                <option value="">Sem squad</option>
                {squads.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          {serverError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function UsersManagementPage() {
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
      const [userList, squadList] = await Promise.all([
        userService.getUsers(),
        squadService.getSquads(),
      ]);
      setUsers(userList);
      setSquads(squadList);
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
      await userService.deleteUser(deleteUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      setDeleteUser(null);
      toast.success('Usuário removido.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Erro ao deletar usuário');
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
    <AdminLayout>
      <div className="max-w-5xl flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
            <p className="text-sm text-gray-500 mt-0.5">Crie e gerencie contas de jogadores e administradores.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>+ Novo Usuário</Button>
        </div>

        {/* Filtro */}
        {!loading && !loadError && users.length > 0 && (
          <input
            type="text"
            placeholder="Filtrar por nome, email ou squad…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}

        {/* Conteúdo */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" className="h-14" />)}
          </div>
        ) : loadError ? (
          <ErrorMessage message={loadError} onRetry={() => { setLoading(true); loadAll(); }} />
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-12 flex flex-col items-center gap-2">
            <p className="text-gray-500 font-medium">
              {filter ? 'Nenhum usuário encontrado para esta busca.' : 'Nenhum usuário cadastrado.'}
            </p>
            {!filter && <p className="text-sm text-gray-400">Crie o primeiro usuário para começar.</p>}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Papel</th>
                  <th className="px-4 py-3">Squad</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.name}
                      {user.leader && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 border border-yellow-300 px-1.5 py-0.5 text-xs text-yellow-700 font-semibold">
                          Líder
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_BADGE[user.role] ?? 'gray'}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {user.squadId ? squadMap[user.squadId] ?? '—' : <span className="text-gray-300">Sem squad</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditUser(user)}
                          className="text-xs font-medium text-gray-500 hover:text-indigo-700 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteUser(user)}
                          className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                        >
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">
                {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
                {filter && ` encontrado${filtered.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      {createOpen && (
        <CreateUserModal squads={squads} onSuccess={handleCreated} onCancel={() => setCreateOpen(false)} />
      )}
      {editUser && (
        <EditUserModal user={editUser} squads={squads} onSuccess={handleUpdated} onCancel={() => setEditUser(null)} />
      )}
      {deleteUser && (
        <ConfirmModal
          title={`Deletar "${deleteUser.name}"?`}
          message="A conta será removida permanentemente. Esta ação não pode ser desfeita."
          confirmLabel="Deletar Usuário"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteUser(null)}
          loading={deleting}
        />
      )}
    </AdminLayout>
  );
}
