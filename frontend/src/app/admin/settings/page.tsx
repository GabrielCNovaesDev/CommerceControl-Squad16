'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/hooks/useToast';
import { formatCurrency } from '@/components/utils/formatters';
import usePageTitle from '@/components/hooks/usePageTitle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface GameSettings {
  id: string;
  licenseSoPerUser: number;
  licenseSoUsers: number;
  licensePdvPerUnit: number;
  licenseScoPerUnit: number;
  licenseScoUnits: number;
  licenseSiteBase: number;
  licenseSiteCapex: number;
  licenseSecurityBase: number;
  licenseSecurityCapex: number;
  maintenanceFee: number;
}

export default function AdminSettingsPage() {
  usePageTitle("Configurações do Jogo");
  const toast = useToast();
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadSettings() {
    setLoadError('');
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      setSettings(data.data ?? data);
    } catch {
      setLoadError('Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSettings(); }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Erro ao salvar');
      }
      const updated = await res.json();
      setSettings(updated.data ?? updated);
      toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof GameSettings, value: number) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  if (loading) {
    return <div style={{ maxWidth: 600 }}><Skeleton variant="card" /></div>;
  }

  if (loadError) {
    return <ErrorMessage message={loadError} onRetry={() => { setLoading(true); loadSettings(); }} />;
  }

  if (!settings) return null;

  const fields: Array<{ key: keyof GameSettings; label: string; hint?: string; isInt?: boolean }> = [
    { key: 'licenseSoPerUser', label: 'Sistema Operacional (por usuário/mês)', hint: `Atual: ${formatCurrency(settings.licenseSoPerUser)}` },
    { key: 'licenseSoUsers', label: 'Qtd usuários SO', isInt: true },
    { key: 'licensePdvPerUnit', label: 'PDV (por unidade/mês)', hint: `Atual: ${formatCurrency(settings.licensePdvPerUnit)}` },
    { key: 'licenseScoPerUnit', label: 'Self Checkout (por unidade/mês)', hint: `Atual: ${formatCurrency(settings.licenseScoPerUnit)}` },
    { key: 'licenseScoUnits', label: 'Qtd unidades Self Checkout', isInt: true },
    { key: 'licenseSiteBase', label: 'Site (sem CAPEX)', hint: `Atual: ${formatCurrency(settings.licenseSiteBase)}` },
    { key: 'licenseSiteCapex', label: 'Site (com CAPEX)', hint: `Atual: ${formatCurrency(settings.licenseSiteCapex)}` },
    { key: 'licenseSecurityBase', label: 'Segurança (sem CAPEX)', hint: `Atual: ${formatCurrency(settings.licenseSecurityBase)}` },
    { key: 'licenseSecurityCapex', label: 'Segurança (com CAPEX)', hint: `Atual: ${formatCurrency(settings.licenseSecurityCapex)}` },
    { key: 'maintenanceFee', label: 'Manutenção de equipamentos (mensal)', hint: `Atual: ${formatCurrency(settings.maintenanceFee)}` },
  ];

  return (
    <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--cenc-gray-900)' }}>Configurações do Jogo</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--cenc-gray-500)' }}>Gerencie os valores de licenças de software e manutenção.</p>
      </div>

      <div style={{ borderRadius: '14px', background: 'white', border: '1px solid var(--cenc-gray-200)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--cenc-gray-700)' }}>Licenças de Software e Manutenção</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fields.map(({ key, label, hint, isInt }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cenc-gray-600)' }}>{label}</label>
              <input
                type="number"
                step={isInt ? '1' : '0.01'}
                min="0"
                value={settings[key]}
                onChange={(e) => update(key, Number(e.target.value))}
                style={{ borderRadius: '10px', border: '1.5px solid var(--cenc-gray-300)', padding: '10px 14px', fontSize: '14px', color: 'var(--cenc-gray-900)', background: 'white', outline: 'none', boxSizing: 'border-box' }}
              />
              {hint && <p style={{ margin: 0, fontSize: '12px', color: 'var(--cenc-gray-400)' }}>{hint}</p>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={handleSave} loading={saving}>Salvar Configurações</Button>
      </div>
    </div>
  );
}
