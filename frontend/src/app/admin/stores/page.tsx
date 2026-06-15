'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/hooks/useToast';
import usePageTitle from '@/components/hooks/usePageTitle';
import { apiFetch, asArray } from '@/components/utils/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface Squad {
  id: string;
  name: string;
  _count?: { users: number; stores: number };
}
interface Store {
  id: string;
  name: string;
  initialCapital: number;
  currentCash: number;
  squad: { id: string; name: string };
}

const createStoreSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
});
type CreateStoreFormData = z.infer<typeof createStoreSchema>;

export default function AdminStoresPage() {
  usePageTitle('Lojas');
  const toast = useToast();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeSquad, setActiveSquad] = useState<Squad | null>(null);
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
  });

  async function load() {
    setLoadError('');
    try {
      const [squadsRes, storesRes] = await Promise.all([
        apiFetch<unknown>(`${API_BASE}/squads`),
        apiFetch<unknown>(`${API_BASE}/stores`),
      ]);
      if (squadsRes.error) throw new Error(squadsRes.error);
      if (storesRes.error) throw new Error(storesRes.error);
      setSquads(asArray<Squad>(squadsRes.data));
      setStores(asArray<Store>(storesRes.data));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Squads que ainda não têm loja
  const squadsWithoutStore = squads.filter(
    (sq) => !stores.some((s) => s.squad.id === sq.id),
  );

  async function onCreate(data: CreateStoreFormData) {
    if (!activeSquad) return;
    setCreating(true);
    try {
      const res = await apiFetch<Store>(`${API_BASE}/stores`, {
        method: 'POST',
        body: JSON.stringify({ name: data.name, squadId: activeSquad.id }),
      });
      if (res.error) throw new Error(res.error);
      toast.success(`Loja "${data.name}" criada para o squad ${activeSquad.name}`);
      reset();
      setActiveSquad(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar loja');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton variant="line" width="200px" height="28px" />
        <Skeleton variant="table" rows={4} />
      </div>
    );
  }

  if (loadError) {
    return <ErrorMessage message={loadError} onRetry={() => { setLoading(true); load(); }} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>Lojas</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)' }}>
          Crie e gerencie as lojas dos squads. O capital inicial é predefinido em R$ 700.000.
        </p>
      </div>

      {/* Lojas existentes */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--cenc-gray-200)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--cenc-gray-100)' }}>
          <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--cenc-gray-700)' }}>
            Lojas Cadastradas ({stores.length})
          </h2>
        </div>
        {stores.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>Nenhuma loja cadastrada ainda.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cenc-gray-100)' }}>
                  {['Loja', 'Squad', 'Capital Inicial', 'Caixa Atual'].map((h, i) => (
                    <th key={h} style={{ padding: '10px 16px', fontWeight: 600, fontSize: '11px', color: 'var(--cenc-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stores.map((s) => (
                  <tr key={s.id} style={{ borderTop: '1px solid var(--cenc-gray-50)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--cenc-gray-700)', fontWeight: 500 }}>{s.name}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--cenc-gray-900)' }}>{s.squad.name}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--cenc-gray-500)' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.initialCapital)}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--cenc-gray-500)' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.currentCash)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Squads sem loja */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--cenc-gray-200)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--cenc-gray-100)' }}>
          <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--cenc-gray-700)' }}>
            Squads sem loja ({squadsWithoutStore.length})
          </h2>
        </div>
        {squadsWithoutStore.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--cenc-gray-400)' }}>
              {squads.length === 0 ? 'Nenhum squad cadastrado.' : 'Todos os squads já possuem loja.'}
            </p>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {squadsWithoutStore.map((sq) => {
              const isActive = activeSquad?.id === sq.id;
              return (
                <div key={sq.id} style={{ borderTop: '1px solid var(--cenc-gray-50)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--cenc-gray-800)' }}>{sq.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cenc-gray-500)' }}>
                        {sq._count?.users ?? 0} usuário(s)
                      </p>
                    </div>
                    <Button
                      onClick={() => setActiveSquad(isActive ? null : sq)}
                      variant={isActive ? 'secondary' : 'primary'}
                    >
                      {isActive ? 'Cancelar' : 'Criar Loja'}
                    </Button>
                  </div>
                  {isActive && (
                    <form onSubmit={handleSubmit(onCreate)} style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--cenc-gray-50)' }}>
                      <div style={{ padding: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Input
                          label="Nome da loja"
                          placeholder={`Ex: Supermercado ${sq.name}`}
                          error={errors.name?.message}
                          {...register('name')}
                        />
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--cenc-gray-500)' }}>
                          Capital inicial: <strong>R$ 700.000,00</strong> (predefinido)
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <Button type="submit" loading={creating || isSubmitting}>Criar Loja</Button>
                          <Button type="button" variant="secondary" onClick={() => { setActiveSquad(null); reset(); }}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
