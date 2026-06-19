import React from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { PurchaseRequest } from '@/types';
import { StatusBadge, Button, EmptyState } from '@/components/ui-pf';

interface Props {
  onSelectRC: (rc: PurchaseRequest) => void;
}

export function FinanceiroPage({ onSelectRC }: Props) {
  const { rcs, calcRC, updateRC } = useApp();
  const { t } = useLanguage();
  const pending = rcs.filter((r) => r.status === 'nota_fiscal_recebida');
  const toSendToAccountant = rcs.filter((r) => r.status === 'pagamento_realizado');
  const finished = rcs.filter((r) => r.status === 'nota_enviada_contador').slice(0, 5);
  const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2 });

  const handlePay = (id: string) => {
    updateRC(id, {
      status: 'pagamento_realizado',
      paid: true,
      paidAt: new Date().toISOString().split('T')[0],
    });
  };

  const handleSendToAccountant = (id: string) => {
    updateRC(id, { status: 'nota_enviada_contador' });
  };

  const totalPending = pending.reduce((s, r) => s + calcRC(r).total, 0);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('financeiro_title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pending.length} {t('financeiro_subtitle_pending')} · € {fmt(totalPending)} {t('financeiro_subtitle_to_pay')} · {toSendToAccountant.length} {t('financeiro_subtitle_to_send')}
        </p>
      </div>

      {/* Pending Payment */}
      <h2 className="text-sm font-bold text-gray-700 mb-3">{t('pending_payments')}</h2>
      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <EmptyState message={t('no_pending_payment')} icon="💰" />
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
                    <StatusBadge status={rc.status} label={t('status_nota_fiscal_recebida')} />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-900">€ {fmt(total)}</div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { l: t('col_supplier'), v: rc.supplier.name },
                      { l: t('cnpj'), v: rc.supplier.cnpj },
                      { l: t('col_billing_email'), v: rc.supplier.contact },
                      { l: t('col_invoice'), v: rc.invoice?.name || '—' },
                    ].map((f) => (
                      <div key={f.l}>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{f.l}</p>
                        <p className="text-sm font-medium text-gray-800 break-all">{f.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mb-4 space-y-0.5">
                    <div>Subtotal: € {fmt(subtotal)} · {t('col_tax')} ({rc.tax}%): € {fmt(taxAmt)}</div>
                    <div>{t('col_project')}: {rc.projectNumber} · {rc.projectClient}</div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => onSelectRC(rc)}>{t('btn_view_details')}</Button>
                    <Button size="sm" variant="success" onClick={() => handlePay(rc.id)}>
                      {t('btn_register_payment')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Waiting accountant */}
      <h2 className="text-sm font-bold text-gray-700 mb-3">{t('waiting_accountant')}</h2>
      {toSendToAccountant.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <EmptyState message={t('no_pending_accountant')} icon="📤" />
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {toSendToAccountant.map((rc) => {
            const { total } = calcRC(rc);
            return (
              <div key={rc.id} className="bg-white rounded-xl border border-teal-200 shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-blue-900">{rc.poNumber}</span>
                  <span className="text-xs text-gray-500">{rc.supplier.name} · {t('col_paid_at')} {rc.paidAt}</span>
                  <StatusBadge status={rc.status} label={t('status_pagamento_realizado')} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-800">€ {fmt(total)}</span>
                  <Button size="sm" variant="secondary" onClick={() => onSelectRC(rc)}>{t('btn_view')}</Button>
                  <Button size="sm" variant="primary" onClick={() => handleSendToAccountant(rc.id)}>
                    {t('btn_send_accountant')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Finished */}
      {finished.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-gray-700 mb-3">{t('finished_processes')}</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[t('col_order'), t('col_project'), t('col_supplier'), t('col_paid_at'), t('col_value'), t('col_status')].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {finished.map((rc) => {
                  const { total } = calcRC(rc);
                  return (
                    <tr key={rc.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => onSelectRC(rc)}>
                      <td className="px-4 py-3 font-bold text-xs text-blue-900">{rc.poNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{rc.projectNumber}</td>
                      <td className="px-4 py-3 text-xs font-medium">{rc.supplier.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{rc.paidAt || '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold">€ {fmt(total)}</td>
                      <td className="px-4 py-3"><StatusBadge status={rc.status} label={t('status_nota_enviada_contador')} /></td>
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
