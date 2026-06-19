import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { PurchaseRequest } from '@/types';
import { StatusBadge, Button, EmptyState, TotalsBox } from '@/components/ui-pf';
import CartaoConsolidadoProjeto from '@/components/CartaoConsolidadoProjeto';

interface Props {
  onSelectRC: (rc: PurchaseRequest) => void;
}

export function AprovacoesPage({ onSelectRC }: Props) {
  const { rcs, calcRC, approveRC, returnRC, updateRC } = useApp();
  const { t } = useLanguage();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localQty, setLocalQty] = useState<Record<string, Record<number, number>>>({});
  const [deletedItems, setDeletedItems] = useState<Record<string, Set<number>>>({});

  const pending = rcs.filter((r) => r.status === 'aguardando_aprovacao');
  const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2 });

  const handleReject = (id: string) => {
    returnRC(id, rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  const startEdit = (rc: PurchaseRequest) => {
    const qtyMap: Record<number, number> = {};
    rc.lineItems.forEach((li) => { qtyMap[li.id] = li.qty; });
    setLocalQty((prev) => ({ ...prev, [rc.id]: qtyMap }));
    setDeletedItems((prev) => ({ ...prev, [rc.id]: new Set<number>() }));
    setEditingId(rc.id);
  };

  const saveEdit = (rc: PurchaseRequest) => {
    const qtyMap = localQty[rc.id] || {};
    const deleted = deletedItems[rc.id] || new Set<number>();
    const newItems = rc.lineItems
      .filter((li) => !deleted.has(li.id))
      .map((li) => ({ ...li, qty: qtyMap[li.id] ?? li.qty }));
    updateRC(rc.id, { lineItems: newItems });
    setEditingId(null);
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('aprovacoes_title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{pending.length} {t('aprovacoes_subtitle')}</p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState message={t('no_pending_approval')} icon="✅" />
        </div>
      ) : (
        pending.map((rc) => {
          const isEditing = editingId === rc.id;
          const qtyMap = localQty[rc.id] || {};
          const deleted = deletedItems[rc.id] || new Set<number>();

          const visibleItems = rc.lineItems.filter((li) => !deleted.has(li.id));
          const previewSubtotal = visibleItems.reduce((s, li) => {
            const qty = isEditing ? (qtyMap[li.id] ?? li.qty) : li.qty;
            return s + li.unitPrice * qty * (1 - li.discount / 100);
          }, 0);
          const previewTax = previewSubtotal * (rc.tax / 100);
          const previewTotal = previewSubtotal + previewTax;

          const { subtotal, taxAmt, total } = isEditing
            ? { subtotal: previewSubtotal, taxAmt: previewTax, total: previewTotal }
            : calcRC(rc);

          return (
            <div key={rc.id} className="mb-5">
              <CartaoConsolidadoProjeto numeroProjeto={rc.projectNumber} rcAtualId={rc.id} />
              <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-amber-50 px-5 py-3 border-b border-amber-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={rc.status} label={t('status_aguardando_aprovacao')} />
                    <span className="font-bold text-blue-900">{rc.id}</span>
                    <span className="text-gray-400 text-xs">· {t('created_at')} {rc.createdAt}</span>
                  </div>
                  <span className="font-bold text-blue-900 text-lg">€ {fmt(total)}</span>
                </div>

                <div className="p-5">
                  {/* Info Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {[
                      { l: t('col_project_number'), v: rc.projectNumber },
                      { l: t('col_client'), v: rc.projectClient },
                      { l: t('col_supplier'), v: rc.supplier.name },
                      { l: t('col_requester'), v: rc.requester.name },
                      { l: t('col_requested_to'), v: rc.approver.name },
                      { l: t('col_tax'), v: `${rc.tax}%` },
                    ].map((f) => (
                      <div key={f.l}>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{f.l}</p>
                        <p className="text-sm font-semibold text-gray-800">{f.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('col_items')}</span>
                      {!isEditing ? (
                        <button
                          onClick={() => startEdit(rc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors"
                        >
                          ✏️ {t('btn_edit_items')}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(rc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-green-300 text-green-700 text-xs font-medium hover:bg-green-50 transition-colors"
                          >
                            ✓ {t('btn_save')}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-50 transition-colors"
                          >
                            ✕ {t('cancel')}
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1 mb-2">
                        ⚠️ {t('warning_edit_items')}
                      </p>
                    )}

                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          {[t('col_code'), t('col_desc'), t('col_qty'), t('col_unit_price'), t('col_discount'), t('col_line_total'), ...(isEditing ? [''] : [])].map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-semibold text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rc.lineItems
                          .filter((li) => !deleted.has(li.id))
                          .map((li) => {
                            const qty = isEditing ? (qtyMap[li.id] ?? li.qty) : li.qty;
                            const t2 = li.unitPrice * qty * (1 - li.discount / 100);
                            return (
                              <tr key={li.id} className="border-b border-gray-50">
                                <td className="px-3 py-2 font-mono text-gray-400">{li.item.codigo}</td>
                                <td className="px-3 py-2 font-medium text-gray-800">{li.item.descricao}</td>
                                <td className="px-3 py-2 text-center">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min={1}
                                      value={qtyMap[li.id] ?? li.qty}
                                      onChange={(e) => {
                                        const val = Math.max(1, Number(e.target.value));
                                        setLocalQty((prev) => ({
                                          ...prev,
                                          [rc.id]: { ...(prev[rc.id] || {}), [li.id]: val },
                                        }));
                                      }}
                                      className="w-14 text-center border border-blue-200 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                                    />
                                  ) : (
                                    qty
                                  )}
                                </td>
                                <td className="px-3 py-2 text-gray-500">€ {fmt(li.unitPrice)}</td>
                                <td className="px-3 py-2 text-green-700">{li.discount > 0 ? `${li.discount}%` : '—'}</td>
                                <td className="px-3 py-2 font-bold">€ {fmt(t2)}</td>
                                {isEditing && (
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() =>
                                        setDeletedItems((prev) => {
                                          const s = new Set(prev[rc.id] || []);
                                          s.add(li.id);
                                          return { ...prev, [rc.id]: s };
                                        })
                                      }
                                      className="text-red-400 hover:text-red-600 transition-colors"
                                      title={t('remove')}
                                    >
                                      🗑
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  <TotalsBox
                    subtotal={subtotal}
                    tax={taxAmt}
                    taxRate={rc.tax}
                    total={total}
                    labelSubtotal="Subtotal"
                    labelTax={t('col_tax')}
                    labelTotal={t('total')}
                  />

                  {rc.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                      <span className="font-semibold">{t('obs_label')}</span> {rc.notes}
                    </div>
                  )}

                  {/* Return form */}
                  {rejectingId === rc.id && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs font-semibold text-orange-700 mb-2">{t('return_reason')}</p>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        placeholder={t('return_placeholder')}
                        className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="danger" onClick={() => handleReject(rc.id)}>{t('btn_confirm_return')}</Button>
                        <Button size="sm" variant="secondary" onClick={() => setRejectingId(null)}>{t('cancel')}</Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end mt-4">
                    <Button size="sm" variant="secondary" onClick={() => onSelectRC(rc)}>{t('btn_view_details')}</Button>
                    <Button size="sm" variant="danger" onClick={() => setRejectingId(rc.id)}>{t('btn_return')}</Button>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        const finalItems = rc.lineItems
                          .filter((li) => !deleted.has(li.id))
                          .map((li) => ({ ...li, qty: isEditing ? (qtyMap[li.id] ?? li.qty) : li.qty }));
                        approveRC(rc.id, finalItems);
                        setEditingId(null);
                      }}
                    >{t('btn_approve')}</Button>
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
