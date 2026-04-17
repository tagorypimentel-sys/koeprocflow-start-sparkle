import React from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseRequest } from '../../types';
import { StatusBadge, Button, EmptyState } from '../ui';

interface Props {
  onSelectRC: (rc: PurchaseRequest) => void;
}

export function FinanceiroPage({ onSelectRC }: Props) {
  const { rcs, calcRC, updateRC } = useApp();
  const pending = rcs.filter((r) => r.status === 'fatura_recebida');
  const paid = rcs.filter((r) => r.status === 'pago').slice(0, 5);
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const handlePay = (id: string) => {
    updateRC(id, {
      status: 'pago',
      paid: true,
      paidAt: new Date().toISOString().split('T')[0],
    });
  };

  const totalPending = pending.reduce((s, r) => s + calcRC(r).total, 0);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro — Pagamentos</h1>
        <p className="text-sm text-gray-500 mt-1">{pending.length} fatura(s) pendentes · R$ {fmt(totalPending)} a pagar</p>
      </div>

      {/* Pending */}
      <h2 className="text-sm font-bold text-gray-700 mb-3">Faturas Pendentes</h2>
      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <EmptyState message="Nenhum pagamento pendente" icon="💰" />
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {pending.map((rc) => {
            const { subtotal, taxAmt, total } = calcRC(rc);
            return (
              <div key={rc.id} className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
                <div className="bg-green-50 px-5 py-3 border-b border-green-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-900">{rc.poNumber}</span>
                    <StatusBadge status={rc.status} />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-900">R$ {fmt(total)}</div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { l: 'Fornecedor', v: rc.supplier.name },
                      { l: 'CNPJ', v: rc.supplier.cnpj },
                      { l: 'E-mail Cobrança', v: rc.supplier.contact },
                      { l: 'Nota Fiscal', v: rc.invoice?.name || '—' },
                    ].map((f) => (
                      <div key={f.l}>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{f.l}</p>
                        <p className="text-sm font-medium text-gray-800 break-all">{f.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mb-4 space-y-0.5">
                    <div>Subtotal: R$ {fmt(subtotal)} · Impostos ({rc.tax}%): R$ {fmt(taxAmt)}</div>
                    <div>Projeto: {rc.projectNumber} · {rc.projectClient}</div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => onSelectRC(rc)}>Ver Detalhes</Button>
                    <Button size="sm" variant="success" onClick={() => handlePay(rc.id)}>
                      💰 Registrar Pagamento
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paid History */}
      {paid.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-gray-700 mb-3">Histórico Recente de Pagamentos</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Pedido', 'Projeto', 'Fornecedor', 'Pago em', 'Valor', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paid.map((rc) => {
                  const { total } = calcRC(rc);
                  return (
                    <tr key={rc.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => onSelectRC(rc)}>
                      <td className="px-4 py-3 font-bold text-xs text-blue-900">{rc.poNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{rc.projectNumber}</td>
                      <td className="px-4 py-3 text-xs font-medium">{rc.supplier.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{rc.paidAt || '—'}</td>
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
