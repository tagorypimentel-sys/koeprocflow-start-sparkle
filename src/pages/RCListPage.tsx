import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StatusBadge, Button, EmptyState } from '@/components/ui-pf';
import { STATUS_CONFIG } from '@/lib/constants';
import { PurchaseRequest, RCStatus } from '@/types';

interface Props {
  onSelectRC: (rc: PurchaseRequest) => void;
  onNewRC: () => void;
}

export function RCListPage({ onSelectRC, onNewRC }: Props) {
  const { rcs, calcRC, currentUser } = useApp();
  const [filter, setFilter] = useState<RCStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');

  const filtered = rcs.filter((r) => {
    const matchStatus = filter === 'todos' || r.status === filter;
    const matchSearch =
      !search ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.projectClient.toLowerCase().includes(search.toLowerCase()) ||
      r.projectNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requisições de Compra</h1>
          <p className="text-sm text-gray-500 mt-1">{rcs.length} requisições cadastradas</p>
        </div>
        {currentUser.role === 'solicitante' && (
          <Button variant="primary" onClick={onNewRC}>+ Nova RC</Button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="mb-4 space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por RC, projeto, cliente ou fornecedor..."
          className="w-full max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 flex-wrap">
          {(['todos', ...Object.keys(STATUS_CONFIG)] as Array<RCStatus | 'todos'>).map((s) => {
            const count = s === 'todos' ? rcs.length : rcs.filter((r) => r.status === s).length;
            const active = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                  active ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s === 'todos' ? 'Todos' : STATUS_CONFIG[s as RCStatus].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['RC', 'Projeto', 'Cliente', 'Fornecedor', 'Solicitante', 'Data', 'Valor Total', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rc) => {
                const { total } = calcRC(rc);
                return (
                  <tr
                    key={rc.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => onSelectRC(rc)}
                  >
                    <td className="px-4 py-3 font-bold text-blue-900 text-xs">{rc.id}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{rc.projectNumber}</td>
                    <td className="px-4 py-3 font-medium text-xs">{rc.projectClient}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{rc.supplier.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{rc.requester.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{rc.createdAt}</td>
                    <td className="px-4 py-3 font-bold text-xs">R$ {fmt(total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={rc.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectRC(rc); }}
                        className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100 transition font-medium"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState message="Nenhuma requisição encontrada" icon="🔍" />
        )}
      </div>
    </div>
  );
}
