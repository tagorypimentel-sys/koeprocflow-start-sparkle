import React from 'react';
import { useApp } from '@/context/AppContext';
import { PurchaseRequest } from '@/types';
import { StatusBadge, Button, EmptyState } from '@/components/ui-pf';

interface Props {
  onSelectRC: (rc: PurchaseRequest) => void;
}

export function ConferenciaPage({ onSelectRC }: Props) {
  const { rcs, calcRC, updateRC } = useApp();

  const pending = rcs.filter((r) => r.status === 'fatura_recebida');
  const recent = rcs.filter((r) => r.status === 'enviado_contabilidade').slice(0, 5);

  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const handleSendToAccounting = (rcId: string) => {
    updateRC(rcId, { status: 'enviado_contabilidade' });
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conferência — Envio à Contabilidade</h1>
        <p className="text-sm text-gray-500 mt-1">{pending.length} fatura(s) aguardando envio ao portal contábil</p>
      </div>

      <h2 className="text-sm font-bold text-gray-700 mb-3">Faturas Pendentes</h2>
      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <EmptyState message="Nenhuma fatura para enviar à contabilidade" icon="📤" />
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {pending.map((rc) => {
            const { total } = calcRC(rc);
            return (
              <div key={rc.id} className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
                <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-900">{rc.poNumber || rc.id}</span>
                    <StatusBadge status={rc.status} />
                  </div>
                  <span className="font-bold text-gray-800">R$ {fmt(total)}</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { l: 'Projeto', v: rc.projectNumber },
                      { l: 'Cliente', v: rc.projectClient },
                      { l: 'Fornecedor', v: rc.supplier.name },
                      { l: 'Nota Fiscal', v: rc.invoice?.name || '—' },
                    ].map((f) => (
                      <div key={f.l}>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{f.l}</p>
                        <p className="text-sm font-medium text-gray-800 break-all">{f.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => onSelectRC(rc)}>Ver Detalhes</Button>
                    <Button size="sm" variant="primary" onClick={() => handleSendToAccounting(rc.id)}>
                      📤 Enviar Fatura à Contabilidade
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-gray-700 mb-3">Enviadas Recentemente</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Pedido', 'Projeto', 'Fornecedor', 'NF', 'Valor', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((rc) => {
                  const { total } = calcRC(rc);
                  return (
                    <tr key={rc.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => onSelectRC(rc)}>
                      <td className="px-4 py-3 font-bold text-xs text-blue-900">{rc.poNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{rc.projectNumber}</td>
                      <td className="px-4 py-3 text-xs font-medium">{rc.supplier.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{rc.invoice?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold">R$ {fmt(total)}</td>
                      <td className="px-4 py-3"><StatusBadge status={rc.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
