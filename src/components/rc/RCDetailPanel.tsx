import React from 'react';
import { PurchaseRequest } from '@/types';
import { StatusBadge, Button } from '@/components/ui-pf';
import { useApp } from '@/context/AppContext';
import { generatePOPdf } from '@/lib/generatePO';
import ProgressoRC from '@/components/ProgressoRC';
import {
  StatusRC,
  proximoStatus,
  responsavelProximaAcao,
  responsavelDoUsuario,
  LABEL_BOTAO_AVANCO,
  labelStatus,
} from '@/lib/fluxoRC';

interface Props {
  rc: PurchaseRequest;
  onClose: () => void;
}

export function RCDetailPanel({ rc, onClose }: Props) {
  const { calcRC, resubmitRC, updateRC, currentUser } = useApp();
  const { subtotal, taxAmt, total } = calcRC(rc);
  const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2 });

  const status = rc.status as StatusRC;
  const papel = responsavelDoUsuario(currentUser.role);
  const proximo = proximoStatus(status);
  const responsavel = responsavelProximaAcao(status);

  // "aguardando_aprovacao → aprovada" é avançado pelo botão de Aprovar na AprovacoesPage,
  // não pelo botão genérico daqui (precisa gerar PO + PDF).
  const podeAvancar =
    responsavel === papel &&
    proximo !== null &&
    status !== 'aguardando_aprovacao';

  const podeReenviar = papel === 'Solicitante' && status === 'devolvida';

  const handleAvancar = () => {
    if (!proximo) return;
    const updates: Partial<PurchaseRequest> = { status: proximo };
    if (proximo === 'pagamento_realizado') {
      updates.paid = true;
      updates.paidAt = new Date().toISOString().split('T')[0];
    }
    updateRC(rc.id, updates);
  };

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
        {/* Progresso (novo) */}
        <ProgressoRC statusAtual={status} />

        {/* Devolução */}
        {status === 'devolvida' && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-xs font-bold text-orange-700 mb-1">↩ Devolvida pelo Aprovador</p>
            {rc.rejectionReason && <p className="text-xs text-orange-700 mb-2">{rc.rejectionReason}</p>}
            {podeReenviar && (
              <button
                onClick={() => resubmitRC(rc.id)}
                className="w-full mt-1 bg-orange-600 text-white font-semibold text-xs py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Reenviar para Aprovação
              </button>
            )}
          </div>
        )}

        {/* Botão de avanço (responsável pela próxima etapa) */}
        {podeAvancar && proximo && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-bold text-blue-700 mb-2">Próxima etapa: {labelStatus(proximo)}</p>
            <Button variant="primary" className="w-full" onClick={handleAvancar}>
              {LABEL_BOTAO_AVANCO[status] ?? `Avançar: ${labelStatus(proximo)}`}
            </Button>
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
            {
              l: 'Modo de entrega',
              v:
                rc.deliveryMode === 'retirada'
                  ? 'Retirada na loja'
                  : rc.deliveryCarrier === 'transportadora'
                  ? 'Entrega via transportadora'
                  : 'Entrega pelo fornecedor',
            },
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
                  <div className="font-medium text-sm text-gray-800 mb-1">{li.item.descricao}</div>
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
