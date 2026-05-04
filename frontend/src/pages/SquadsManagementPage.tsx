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

// ─── Helpers ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<UserRole, string> = { PLAYER: 'Jogador', GAME_MASTER: 'Game Master', OBSERVER: 'Observador' };

function fieldClass(hasError: boolean) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`;
}

// ─── Modal genérico de confirmação ──────────────────────────────────────────

function ConfirmModal({
  title, message, confirmLabel = 'Confirmar', variant = 'danger', onConfirm, onCancel, loading,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary' | 'secondary';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-gray-900">Novo Squad</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nome do squad</label>
            <input className={fieldClass(!!errors.name)} {...register('name')} autoFocus />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          {serverError && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{serverError}</p>}
          <div className="flex gap-3 justify-end">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-gray-900">Editar Squad</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nome do squad</label>
            <input className={fieldClass(!!errors.name)} {...register('name')} autoFocus />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          {serverError && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{serverError}</p>}
          <div className="flex gap-3 justify-end">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-gray-900">Novo Usuário</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <input className={fieldClass(!!errors.name)} {...register('name')} autoFocus />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input type="email" className={fieldClass(!!errors.email)} {...register('email')} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <input type="password" className={fieldClass(!!errors.password)} {...register('password')} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
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
          {serverError && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{serverError}</p>}
          <div className="flex gap-3 justify-end">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 p-6 flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Adicionar membro</h2>
          <p className="text-sm text-gray-500 mt-0.5">Squad: {squadName}</p>
        </div>
        {freeUsers.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Não há usuários sem squad disponíveis.</p>
        ) : (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Selecionar usuário</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className={fieldClass(false)}
            >
              <option value="">Escolha um usuário...</option>
              {freeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — {ROLE_LABEL[u.role] ?? u.role}
                </option>
              ))}
            </select>
          </div>
        )}
        {serverError && <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{serverError}</p>}
        <div className="flex gap-3 justify-end">
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

function MembersPanel({
  squad, onRemoveUser, onAddUser,
}: {
  squad: Squad;
  onRemoveUser: (user: SquadUser, squadId: string) => void;
  onAddUser: (squadId: string) => void;
}) {
  const members = squad.users ?? [];

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Membros</p>
        <button
          onClick={() => onAddUser(squad.id)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          + Adicionar membro
        </button>
      </div>
      {members.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-1">Nenhum membro neste squad.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pb-1.5 font-medium">Nome</th>
              <th className="pb-1.5 font-medium">Email</th>
              <th className="pb-1.5 font-medium">Papel</th>
              <th className="pb-1.5 font-medium text-right"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((user) => (
              <tr key={user.id} className="border-t border-gray-100">
                <td className="py-1.5 pr-3 text-gray-800 font-medium">
                  {user.name}
                  {user.leader && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-yellow-100 border border-yellow-300 px-1.5 py-0.5 text-yellow-700 font-semibold">
                      Líder
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-3 text-gray-500">{user.email}</td>
                <td className="py-1.5 pr-3 text-gray-500">{ROLE_LABEL[user.role] ?? user.role}</td>
                <td className="py-1.5 text-right">
                  {user.leader ? (
                    <span className="text-gray-300 cursor-not-allowed" title="Transfira a liderança antes de remover este usuário do squad">
                      Remover
                    </span>
                  ) : (
                    <button
                      onClick={() => onRemoveUser(user, squad.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remover
                    </button>
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
      <div className="max-w-5xl flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Squads e Usuários</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gerencie squads, membros e contas de acesso.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" onClick={() => setCreateUserOpen(true)}>+ Usuário</Button>
            <Button onClick={() => setCreateSquadOpen(true)}>+ Squad</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} variant="card" className="h-16" />)}
          </div>
        ) : loadError ? (
          <ErrorMessage message={loadError} onRetry={() => { setLoading(true); loadAll(); }} />
        ) : squads.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-6 py-12 flex flex-col items-center gap-2">
            <p className="text-gray-500 font-medium">Nenhum squad cadastrado.</p>
            <p className="text-sm text-gray-400">Crie o primeiro squad para começar.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {squads.map((squad) => {
              const store = squad.stores?.[0] ?? null;
              const isExpanded = expandedId === squad.id;
              return (
                <div key={squad.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : squad.id)}
                      className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors w-5 h-5 flex items-center justify-center"
                      aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                    >
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{squad.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {store ? `Loja: ${store.name}` : 'Sem loja vinculada'}
                        {' · '}
                        {squad.users?.length ?? 0} membro(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setEditSquad(squad)} className="text-xs font-medium text-gray-500 hover:text-indigo-700 transition-colors px-2 py-1 rounded hover:bg-indigo-50">Editar</button>
                      <button onClick={() => setDeleteSquad(squad)} className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50">Deletar</button>
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
      {createUserOpen && <CreateUserModal squads={squads} onSuccess={handleUserCreated} onCancel={() => setCreateUserOpen(false)} />}
      {editSquad && <EditSquadModal squad={editSquad} onSuccess={handleSquadUpdated} onCancel={() => setEditSquad(null)} />}
      {deleteSquad && (
        <ConfirmModal
          title={`Deletar squad "${deleteSquad.name}"?`}
          message="Esta ação removerá o squad permanentemente. Não será possível desfazer."
          confirmLabel="Deletar Squad"
          onConfirm={handleDeleteSquad}
          onCancel={() => setDeleteSquad(null)}
          loading={deletingSquad}
        />
      )}
      {removeUser && (
        <ConfirmModal
          title={`Remover ${removeUser.user.name} do squad?`}
          message="O usuário perderá o vínculo com o squad e não poderá mais participar da rodada como membro deste grupo."
          confirmLabel="Remover"
          onConfirm={handleConfirmRemoveUser}
          onCancel={() => setRemoveUser(null)}
          loading={removingUser}
        />
      )}
      {addUserTo && addUserSquad && (
        <AddUserModal
          squadId={addUserTo}
          squadName={addUserSquad.name}
          freeUsers={freeUsers}
          onSuccess={handleAddUserSuccess}
          onCancel={() => setAddUserTo(null)}
        />
      )}
    </AdminLayout>
  );
}
