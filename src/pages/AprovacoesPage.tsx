import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PurchaseRequest } from '@/types';
import { StatusBadge, Button, EmptyState, TotalsBox } from '@/components/ui-pf';
import CartaoConsolidadoProjeto from '@/components/CartaoConsolidadoProjeto';

interface Props {
  onSelectRC: (rc: PurchaseRequest) => void;
}

export function AprovacoesPage({ onSelectRC }: Props) {
  const { rcs, calcRC, approveRC, returnRC } = useApp();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pending = rcs.filter((r) => r.status === 'aguardando_aprovacao');
  const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2 });

  const handleReject = (id: string) => {
    returnRC(id, rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aprovações Pendentes</h1>
        <p className="text-sm text-gray-500 mt-1">{pending.length} requisição(ões) aguardando sua decisão</p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState message="Nenhuma aprovação pendente" icon="✅" />
        </div>
      ) : (
        pending.map((rc) => {
          const { subtotal, taxAmt, total } = calcRC(rc);
          return (
            <div key={rc.id} className="mb-5">
            <CartaoConsolidadoProjeto numeroProjeto={rc.projectNumber} rcAtualId={rc.id} />
            <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <StatusBadge status={rc.status} />
                  <span className="font-bold text-blue-900">{rc.id}</span>
                  <span className="text-gray-400 text-xs">· criado em {rc.createdAt}</span>
                </div>
                <span className="font-bold text-blue-900 text-lg">R$ {fmt(total)}</span>
              </div>

              <div className="p-5">
                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {[
                    { l: 'Número do Projeto', v: rc.projectNumber },
                    { l: 'Cliente', v: rc.projectClient },
                    { l: 'Fornecedor', v: rc.supplier.name },
                    { l: 'Solicitante', v: rc.requester.name },
                    { l: 'Solicitado a', v: rc.approver.name },
                    { l: 'Imposto', v: `${rc.tax}%` },
                  ].map((f) => (
                    <div key={f.l}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{f.l}</p>
                      <p className="text-sm font-semibold text-gray-800">{f.v}</p>
                    </div>
                  ))}
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Código', 'Descrição', 'Qtd', 'Unit. (R$)', 'Desc.', 'Total (R$)'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rc.lineItems.map((li) => {
                        const t = li.unitPrice * li.qty * (1 - li.discount / 100);
                        return (
                          <tr key={li.id} className="border-b border-gray-50">
                            <td className="px-3 py-2 font-mono text-gray-400">{li.item.codigo}</td>
                            <td className="px-3 py-2 font-medium text-gray-800">{li.item.descricao}</td>
                            <td className="px-3 py-2 text-center">{li.qty}</td>
                            <td className="px-3 py-2">R$ {fmt(li.unitPrice)}</td>
                            <td className="px-3 py-2 text-green-700">{li.discount > 0 ? `${li.discount}%` : '—'}</td>
                            <td className="px-3 py-2 font-bold">R$ {fmt(t)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <TotalsBox subtotal={subtotal} tax={taxAmt} taxRate={rc.tax} total={total} />

                {rc.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                    <span className="font-semibold">Obs:</span> {rc.notes}
                  </div>
                )}

                {/* Return form */}
                {rejectingId === rc.id && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs font-semibold text-orange-700 mb-2">Motivo da devolução (opcional)</p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      placeholder="Descreva o motivo da devolução ao solicitante..."
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="danger" onClick={() => handleReject(rc.id)}>Confirmar Devolução</Button>
                      <Button size="sm" variant="secondary" onClick={() => setRejectingId(null)}>Cancelar</Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end mt-4">
                  <Button size="sm" variant="secondary" onClick={() => onSelectRC(rc)}>Ver Detalhes</Button>
                  <Button size="sm" variant="danger" onClick={() => setRejectingId(rc.id)}>↩ Devolver ao Solicitante</Button>
                  <Button size="sm" variant="success" onClick={() => approveRC(rc.id)}>✓ Aprovar</Button>
                </div>
              </div>
            </div>
            </div>
          );
        })
      )}
    </div>
  );
}
