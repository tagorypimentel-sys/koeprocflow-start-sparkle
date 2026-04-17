import React, { useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { PurchaseRequest, RCStatus } from '@/types';
import { StatusBadge, Button, EmptyState } from '@/components/ui-pf';

interface Props {
  onSelectRC: (rc: PurchaseRequest) => void;
}

const NEXT_ACTION: Partial<Record<RCStatus, { label: string; nextStatus: RCStatus; variant: 'primary' | 'success' }>> = {
  aprovado: { label: 'Confirmar Emissão do Pedido', nextStatus: 'pedido_emitido', variant: 'primary' },
  pedido_emitido: { label: 'Confirmar Envio ao Fornecedor', nextStatus: 'aguardando_entrega', variant: 'primary' },
  aguardando_entrega: { label: 'Confirmar Entrega', nextStatus: 'entregue', variant: 'success' },
};

export function ConferenciaPage({ onSelectRC }: Props) {
  const { rcs, calcRC, updateRC } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);

  const active = rcs.filter((r) =>
    ['aprovado', 'pedido_emitido', 'aguardando_entrega', 'entregue'].includes(r.status)
  );

  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const handleUploadInvoice = (rcId: string) => {
    setUploadingId(rcId);
    // Simulate file upload — in production connect to Supabase Storage
    setTimeout(() => {
      updateRC(rcId, {
        status: 'fatura_recebida',
        invoice: {
          name: `NF-${Math.floor(Math.random() * 90000 + 10000)}.pdf`,
          date: new Date().toISOString().split('T')[0],
        },
      });
      setUploadingId(null);
    }, 1200);
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conferência de Entregas</h1>
        <p className="text-sm text-gray-500 mt-1">{active.length} pedido(s) em acompanhamento</p>
      </div>

      {active.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState message="Nenhum pedido para conferir no momento" icon="📦" />
        </div>
      ) : (
        active.map((rc) => {
          const { total } = calcRC(rc);
          const action = NEXT_ACTION[rc.status];
          return (
            <div key={rc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
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
                    { l: 'Aprovado em', v: rc.approvedAt || rc.createdAt },
                  ].map((f) => (
                    <div key={f.l}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{f.l}</p>
                      <p className="text-sm font-medium text-gray-800">{f.v}</p>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  {rc.lineItems.length} item(ns) · Total R$ {fmt(total)}
                </div>

                {/* Steps indicator */}
                <div className="flex items-center gap-2 mb-4 text-xs">
                  {(['aprovado', 'pedido_emitido', 'aguardando_entrega', 'entregue', 'fatura_recebida'] as RCStatus[]).map((s, i) => {
                    const done = ['aprovado', 'pedido_emitido', 'aguardando_entrega', 'entregue', 'fatura_recebida', 'pago'].indexOf(rc.status) >= i;
                    return (
                      <React.Fragment key={s}>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold ${done ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                          {done ? '✓' : (i + 1)} {['Aprovado', 'PO Emitido', 'Aguardando', 'Entregue', 'Fatura'][i]}
                        </div>
                        {i < 4 && <div className="h-px w-4 bg-gray-200" />}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="flex gap-3 justify-between items-center">
                  <Button size="sm" variant="secondary" onClick={() => onSelectRC(rc)}>Ver Detalhes</Button>
                  <div className="flex gap-2">
                    {action && (
                      <Button
                        size="sm"
                        variant={action.variant}
                        onClick={() => updateRC(rc.id, { status: action.nextStatus })}
                      >
                        {action.label}
                      </Button>
                    )}
                    {rc.status === 'entregue' && !rc.invoice && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={uploadingId === rc.id}
                        onClick={() => handleUploadInvoice(rc.id)}
                      >
                        {uploadingId === rc.id ? '⏳ Enviando...' : '📎 Anexar Nota Fiscal'}
                      </Button>
                    )}
                    {rc.invoice && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                        <span>📄</span> {rc.invoice.name}
                      </div>
                    )}
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
