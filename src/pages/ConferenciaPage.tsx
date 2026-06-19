import React from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { PurchaseRequest } from '@/types';
import { StatusBadge, Button, EmptyState } from '@/components/ui-pf';

interface Props {
  onSelectRC: (rc: PurchaseRequest) => void;
}

export function ConferenciaPage({ onSelectRC }: Props) {
  const { rcs, calcRC, updateRC } = useApp();
  const { t } = useLanguage();

  const pending = rcs.filter((r) => r.status === 'entrega_confirmada');
  const recent = rcs.filter((r) => r.status === 'nota_fiscal_recebida').slice(0, 5);
  const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2 });

  const handleRegisterInvoice = (rcId: string) => {
    updateRC(rcId, {
      status: 'nota_fiscal_recebida',
      invoice: {
        name: `NF-${Math.floor(Math.random() * 90000 + 10000)}.pdf`,
        date: new Date().toISOString().split('T')[0],
      },
    });
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('conferencia_title')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pending.length} {t('conferencia_subtitle')}
        </p>
      </div>

      <h2 className="text-sm font-bold text-gray-700 mb-3">{t('waiting_nf')}</h2>
      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <EmptyState message={t('no_delivery_waiting')} icon="🧾" />
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
                    <StatusBadge status={rc.status} label={t('status_entrega_confirmada')} />
                  </div>
                  <span className="font-bold text-gray-800">€ {fmt(total)}</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { l: t('col_project'), v: rc.projectNumber },
                      { l: t('col_client'), v: rc.projectClient },
                      { l: t('col_supplier'), v: rc.supplier.name },
                      { l: t('col_requester'), v: rc.requester.name },
                    ].map((f) => (
                      <div key={f.l}>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{f.l}</p>
                        <p className="text-sm font-medium text-gray-800 break-all">{f.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button size="sm" variant="secondary" onClick={() => onSelectRC(rc)}>{t('btn_view_details')}</Button>
                    <Button size="sm" variant="primary" onClick={() => handleRegisterInvoice(rc.id)}>
                      {t('btn_register_invoice')}
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
          <h2 className="text-sm font-bold text-gray-700 mb-3">{t('recent_nfs')}</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[t('col_order'), t('col_project'), t('col_supplier'), t('col_nf'), t('col_value'), t('col_status')].map((h) => (
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
                      <td className="px-4 py-3 text-xs font-bold">€ {fmt(total)}</td>
                      <td className="px-4 py-3"><StatusBadge status={rc.status} label={t('status_nota_fiscal_recebida')} /></td>
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
