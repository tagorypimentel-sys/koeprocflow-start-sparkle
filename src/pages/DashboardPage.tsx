import React from 'react';
import { useApp } from '@/context/AppContext';
import { StatusBadge, StatCard } from '@/components/ui-pf';
import { PurchaseRequest } from '@/types';

interface Props {
  onSelectRC: (rc: PurchaseRequest) => void;
}

export function DashboardPage({ onSelectRC }: Props) {
  const { rcs, calcRC, currentUser } = useApp();

  const myRCs = currentUser.role === 'solicitante' ? rcs.filter((r) => r.requester.id === currentUser.id) : rcs;
  const pending = rcs.filter((r) => r.status === 'aguardando_aprovacao').length;
  const inProgress = rcs.filter((r) => ['aprovado', 'pedido_emitido', 'aguardando_entrega', 'entregue', 'fatura_recebida'].includes(r.status)).length;
  const paid = rcs.filter((r) => r.status === 'pago').length;
  const totalValue = rcs.reduce((s, r) => s + calcRC(r).total, 0);

  const recent = [...rcs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do sistema de compras</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total de RCs" value={rcs.length} color="#1e3a8a" bg="#eff6ff" />
        <StatCard label="Pendentes" value={pending} color="#92400e" bg="#fffbeb" />
        <StatCard label="Em Andamento" value={inProgress} color="#166534" bg="#f0fdf4" />
        <StatCard label="Pagas" value={paid} color="#5b21b6" bg="#f5f3ff" />
      </div>

      {/* Value Banner */}
      <div className="bg-blue-900 rounded-xl p-5 mb-6 flex justify-between items-center">
        <div>
          <p className="text-blue-300 text-sm mb-1">Valor Total em Compras</p>
          <p className="text-white text-3xl font-bold">R$ {fmt(totalValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-300 text-xs mb-1">Período Atual</p>
          <p className="text-white font-semibold">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Recent */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-sm text-gray-800">Requisições Recentes</h2>
        </div>
        {recent.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Nenhuma RC encontrada</div>
        ) : (
          recent.map((rc) => {
            const { total } = calcRC(rc);
            return (
              <div
                key={rc.id}
                className="px-5 py-3.5 border-b border-gray-50 last:border-0 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => onSelectRC(rc)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-blue-900">{rc.id}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{rc.projectClient} · {rc.supplier.name}</div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">{rc.createdAt}</div>
                <div className="text-sm font-bold text-gray-800 flex-shrink-0">R$ {fmt(total)}</div>
                <StatusBadge status={rc.status} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
