'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Squad {
  id: string;
  name: string;
  createdAt: string;
  userCount: number;
  storeCount: number;
}

export default function SquadsManagementPage() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Squad | null>(null);
  const [squadName, setSquadName] = useState('');

  useEffect(() => {
    fetchSquads();
  }, []);

  const fetchSquads = async () => {
    try {
      const res = await api.get('/squads');
      setSquads(res.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar squads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!squadName.trim()) return;
    try {
      if (editingSquad) {
        await api.put(`/squads/${editingSquad.id}`, { name: squadName });
      } else {
        await api.post('/squads', { name: squadName });
      }
      setShowModal(false);
      setEditingSquad(null);
      setSquadName('');
      fetchSquads();
    } catch (error) {
      console.error('Erro ao salvar squad:', error);
      alert('Erro ao salvar squad');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este squad?')) return;
    try {
      await api.delete(`/squads/${id}`);
      fetchSquads();
    } catch (error) {
      console.error('Erro ao deletar squad:', error);
      alert('Não é possível deletar um squad com usuários ou lojas associadas.');
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Squads</h1>
        <button
          onClick={() => { setEditingSquad(null); setSquadName(''); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Novo Squad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads.map((squad) => (
          <div key={squad.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{squad.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Criado em {new Date(squad.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setEditingSquad(squad); setSquadName(squad.name); setShowModal(true); }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(squad.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Deletar
                </button>
              </div>
            </div>
            <div className="mt-4 flex space-x-4">
              <div className="text-sm">
                <span className="font-medium text-gray-900">{squad.userCount}</span>
                <span className="text-gray-500 ml-1">usuários</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-900">{squad.storeCount}</span>
                <span className="text-gray-500 ml-1">lojas</span>
              </div>
            </div>
          </div>
        ))}
        {squads.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            Nenhum squad encontrado
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingSquad ? 'Editar' : 'Novo'} Squad</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Squad</label>
              <input
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex: Squad Alpha"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}