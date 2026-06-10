'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Settings {
  id: string;
  licenseSoPerUser: string;
  licenseSoUsers: number;
  licensePdvPerUnit: string;
  licenseScoPerUnit: string;
  licenseScoUnits: number;
  licenseSiteBase: string;
  licenseSiteCapex: string;
  licenseSecurityBase: string;
  licenseSecurityCapex: string;
  maintenanceFee: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string | number>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.data);
      setFormData(res.data.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', formData);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configurações do Jogo</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Licenças - Sistema Operacional</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço por Usuário (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.licenseSoPerUser || ''}
              onChange={(e) => setFormData({ ...formData, licenseSoPerUser: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de Usuários</label>
            <input
              type="number"
              value={formData.licenseSoUsers || ''}
              onChange={(e) => setFormData({ ...formData, licenseSoUsers: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-6 mt-8">Licenças - PDV</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço por PDV (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.licensePdvPerUnit || ''}
              onChange={(e) => setFormData({ ...formData, licensePdvPerUnit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-6 mt-8">Licenças - Self Checkout</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço por SCO (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.licenseScoPerUnit || ''}
              onChange={(e) => setFormData({ ...formData, licenseScoPerUnit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de SCOs</label>
            <input
              type="number"
              value={formData.licenseScoUnits || ''}
              onChange={(e) => setFormData({ ...formData, licenseScoUnits: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-6 mt-8">Licenças - Site</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.licenseSiteBase || ''}
              onChange={(e) => setFormData({ ...formData, licenseSiteBase: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço CAPEX (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.licenseSiteCapex || ''}
              onChange={(e) => setFormData({ ...formData, licenseSiteCapex: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-6 mt-8">Licenças - Segurança</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.licenseSecurityBase || ''}
              onChange={(e) => setFormData({ ...formData, licenseSecurityBase: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço CAPEX (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.licenseSecurityCapex || ''}
              onChange={(e) => setFormData({ ...formData, licenseSecurityCapex: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-6 mt-8">Manutenção</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Manutenção (R$)</label>
          <input
            type="number"
            step="0.01"
            value={formData.maintenanceFee || ''}
            onChange={(e) => setFormData({ ...formData, maintenanceFee: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}