import { useEffect, useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useToast } from '../hooks/useToast';
import settingsService, { GameSettings } from '../services/settingsService';
import { formatCurrency } from '../utils/formatters';

export default function AdminSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadSettings() {
    setLoadError('');
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch {
      setLoadError('Nao foi possivel carregar as configuracoes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSettings(); }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await settingsService.updateSettings(settings);
      setSettings(updated);
      toast.success('Configuracoes salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar configuracoes.');
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof GameSettings, value: number) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  if (loading) {
    return <AdminLayout><div className="max-w-2xl"><Skeleton variant="card" className="h-64" /></div></AdminLayout>;
  }

  if (loadError) {
    return <AdminLayout><ErrorMessage message={loadError} onRetry={() => { setLoading(true); loadSettings(); }} /></AdminLayout>;
  }

  if (!settings) return null;

  const fields: Array<{ key: keyof GameSettings; label: string; hint?: string; isInt?: boolean }> = [
    { key: 'licenseSoPerUser', label: 'Sistema Operacional (por usuario/mes)', hint: `Atual: ${formatCurrency(settings.licenseSoPerUser)}` },
    { key: 'licenseSoUsers', label: 'Qtd usuarios SO', isInt: true },
    { key: 'licensePdvPerUnit', label: 'PDV (por unidade/mes)', hint: `Atual: ${formatCurrency(settings.licensePdvPerUnit)}` },
    { key: 'licenseScoPerUnit', label: 'Self Checkout (por unidade/mes)', hint: `Atual: ${formatCurrency(settings.licenseScoPerUnit)}` },
    { key: 'licenseScoUnits', label: 'Qtd unidades Self Checkout', isInt: true },
    { key: 'licenseSiteBase', label: 'Site (sem CAPEX)', hint: `Atual: ${formatCurrency(settings.licenseSiteBase)}` },
    { key: 'licenseSiteCapex', label: 'Site (com CAPEX)', hint: `Atual: ${formatCurrency(settings.licenseSiteCapex)}` },
    { key: 'licenseSecurityBase', label: 'Seguranca (sem CAPEX)', hint: `Atual: ${formatCurrency(settings.licenseSecurityBase)}` },
    { key: 'licenseSecurityCapex', label: 'Seguranca (com CAPEX)', hint: `Atual: ${formatCurrency(settings.licenseSecurityCapex)}` },
    { key: 'maintenanceFee', label: 'Manutencao de equipamentos (mensal)', hint: `Atual: ${formatCurrency(settings.maintenanceFee)}` },
  ];

  return (
    <AdminLayout>
      <div className="max-w-2xl flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configuracoes do Jogo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie os valores de licencas de software e manutencao.</p>
        </div>

        <div className="rounded-xl bg-white border border-gray-200 shadow-sm px-5 py-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-700">Licencas de Software e Manutencao</h2>
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ key, label, hint, isInt }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">{label}</label>
                <input
                  type="number"
                  step={isInt ? '1' : '0.01'}
                  min="0"
                  value={settings[key]}
                  onChange={(e) => update(key, Number(e.target.value))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                {hint && <p className="text-xs text-gray-400">{hint}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>Salvar Configuracoes</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
