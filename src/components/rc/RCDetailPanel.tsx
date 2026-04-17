import React from 'react';
import { PurchaseRequest, RCStatus } from '@/types';
import { StatusBadge, Avatar, Button } from '@/components/ui-pf';
import { RC_STATUS_FLOW } from '@/lib/constants';
import { useApp } from '@/context/AppContext';
import { generatePOPdf } from '@/lib/generatePO';

const TIMELINE_LABELS: Partial<Record<RCStatus, string>> = {
  aguardando_aprovacao: 'Aguardando Aprovação',
  aprovado: 'Aprovada',
  pedido_emitido: 'Pedido Emitido',
  aguardando_entrega: 'Aguardando Entrega',
  entregue: 'Entregue',
  fatura_recebida: 'Fatura Recebida',
  pago: 'Pagamento Realizado',
};

interface Props {
  rc: PurchaseRequest;
  onClose: () => void;
}

export function RCDetailPanel({ rc, onClose }: Props) {
  const { calcRC } = useApp();
  const { subtotal, taxAmt, total } = calcRC(rc);
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const currentIdx = RC_STATUS_FLOW.indexOf(rc.status);

  return (
    <div className="w-[440px] bg-white border-l border-gray-200 flex flex-col flex-shrink-0 h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <div className="font-bold text-base text-blue-900">{rc.id}</div>
          <div className="text-xs text-gray-500 mt-0.5">{rc.projectClient} · {rc.projectNumber}</div>
          <div className="mt-2"><StatusBadge status={rc.status} /></div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1">×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Timeline */}
        {rc.status !== 'rejeitado' && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Progresso</p>
            <div className="space-y-2">
              {RC_STATUS_FLOW.map((s, i) => {
                const done = i <= currentIdx;
                const current = i === currentIdx;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        done ? 'bg-green-700 border-green-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      {done && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs ${current ? 'font-semibold text-gray-900' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                      {TIMELINE_LABELS[s]}
                    </span>
                    {current && <span className="ml-auto text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">Atual</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {rc.status === 'rejeitado' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-bold text-red-700 mb-1">Requisição Rejeitada</p>
            {rc.rejectionReason && <p className="text-xs text-red-600">{rc.rejectionReason}</p>}
          </div>
        )}

        {/* Info Grid */}
        <div className="p-4 border border-gray-100 rounded-lg space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dados da RC</p>
          {[
            { l: 'Projeto', v: rc.projectNumber },
            { l: 'Cliente', v: rc.projectClient },
            { l: 'Fornecedor', v: rc.supplier.name },
            { l: 'Aprovador', v: rc.approver.name },
            { l: 'Solicitante', v: rc.requester.name },
            { l: 'Criada em', v: rc.createdAt },
            ...(rc.approvedAt ? [{ l: 'Aprovada em', v: rc.approvedAt }] : []),
            ...(rc.paidAt ? [{ l: 'Pago em', v: rc.paidAt }] : []),
          ].map((f) => (
            <div key={f.l} className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
              <span className="text-gray-500 text-xs">{f.l}</span>
              <span className="font-medium text-xs text-right max-w-[55%]">{f.v}</span>
            </div>
          ))}
        </div>

        {/* Line Items */}
        <div className="p-4 border border-gray-100 rounded-lg">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Itens</p>
          <div className="space-y-3">
            {rc.lineItems.map((li) => {
              const t = li.unitPrice * li.qty * (1 - li.discount / 100);
              return (
                <div key={li.id} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="font-medium text-sm text-gray-800 mb-1">{li.item.name}</div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{li.qty} × R$ {fmt(li.unitPrice)}{li.discount > 0 ? ` (-${li.discount}%)` : ''}</span>
                    <span className="font-semibold text-gray-800">R$ {fmt(t)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-xs text-right">
            <div className="text-gray-500">Subtotal: <span className="font-semibold text-gray-800">R$ {fmt(subtotal)}</span></div>
            <div className="text-gray-500">Impostos ({rc.tax}%): <span className="font-semibold text-gray-800">R$ {fmt(taxAmt)}</span></div>
            <div className="text-base font-bold text-blue-900 pt-1">Total: R$ {fmt(total)}</div>
          </div>
        </div>

        {/* Notes */}
        {rc.notes && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Observações</p>
            <p className="text-xs text-amber-800">{rc.notes}</p>
          </div>
        )}

        {/* Invoice */}
        {rc.invoice && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-2">Nota Fiscal Anexada</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">📄</span>
              <div>
                <p className="font-semibold text-sm text-blue-900">{rc.invoice.name}</p>
                <p className="text-[10px] text-blue-500">Recebido em {rc.invoice.date}</p>
              </div>
            </div>
          </div>
        )}

        {/* PO Number */}
        {rc.poNumber && (
          <div className="p-4 bg-blue-900 rounded-xl text-white">
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Pedido de Compra</p>
            <p className="text-xl font-bold">{rc.poNumber}</p>
            <p className="text-[10px] opacity-60 mt-1 mb-3">PDF gerado · E-mail enviado ao solicitante</p>
            <button
              onClick={() => generatePOPdf(rc, { subtotal, taxAmt, total })}
              className="w-full bg-white text-blue-900 font-semibold text-xs py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              ⬇ Baixar PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
