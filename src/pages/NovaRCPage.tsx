import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LineItem, PurchaseRequest } from '@/types';
import { FormField, Input, Select, Textarea, Button, TotalsBox } from '@/components/ui-pf';
import { generateRCId } from '@/lib/constants';

interface Props {
  onSave: () => void;
  onCancel: () => void;
}

export function NovaRCPage({ onSave, onCancel }: Props) {
  const { items, suppliers, users, currentUser, addRC } = useApp();
  const approvers = users.filter((u) => u.role === 'aprovador');

  const [form, setForm] = useState({
    projectNumber: '', projectClient: '', supplierId: '',
    approverId: '', tax: '0', notes: '',
  });
  const [deliveryMode, setDeliveryMode] = useState<'entrega' | 'retirada'>('entrega');
  const [deliveryCarrier, setDeliveryCarrier] = useState<'transportadora' | 'fornecedor'>('fornecedor');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [addingItem, setAddingItem] = useState(false);
  const [newLine, setNewLine] = useState({ itemId: '', qty: '1', discount: '0' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addLine = () => {
    const item = items.find((i) => i.id === parseInt(newLine.itemId));
    if (!item) return;
    setLineItems((prev) => [
      ...prev,
      {
        id: Date.now(), item,
        qty: parseInt(newLine.qty) || 1,
        unitPrice: item.price,
        discount: parseFloat(newLine.discount) || 0,
      },
    ]);
    setNewLine({ itemId: '', qty: '1', discount: '0' });
    setAddingItem(false);
  };

  const removeLine = (id: number) => setLineItems((prev) => prev.filter((l) => l.id !== id));

  const subtotal = lineItems.reduce((s, li) => s + li.unitPrice * li.qty * (1 - li.discount / 100), 0);
  const tax = parseFloat(form.tax) || 0;
  const taxAmt = subtotal * (tax / 100);
  const total = subtotal + taxAmt;
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.projectNumber) e.projectNumber = 'Obrigatório';
    if (!form.projectClient) e.projectClient = 'Obrigatório';
    if (!form.supplierId) e.supplierId = 'Obrigatório';
    if (!form.approverId) e.approverId = 'Obrigatório';
    if (lineItems.length === 0) e.items = 'Adicione pelo menos um item';
    if (deliveryMode === 'entrega' && !deliveryAddress.trim()) e.deliveryAddress = 'Informe o endereço de entrega';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const rc: PurchaseRequest = {
      id: generateRCId(),
      projectNumber: form.projectNumber,
      projectClient: form.projectClient,
      supplier: suppliers.find((s) => s.id === parseInt(form.supplierId))!,
      approver: users.find((u) => u.id === parseInt(form.approverId))!,
      requester: currentUser,
      status: 'aguardando_aprovacao',
      createdAt: new Date().toISOString().split('T')[0],
      discount: 0,
      tax,
      poNumber: null,
      invoice: null,
      paid: false,
      notes: form.notes,
      lineItems,
      deliveryMode,
      deliveryCarrier: deliveryMode === 'entrega' ? deliveryCarrier : undefined,
      deliveryAddress: deliveryMode === 'entrega' ? deliveryAddress.trim() : undefined,
    };
    addRC(rc);
    onSave();
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Requisição de Compra</h1>
          <p className="text-sm text-gray-500 mt-0.5">Preencha os dados para criar e enviar para aprovação</p>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-bold text-blue-900 mb-4 pb-3 border-b border-gray-100">Informações do Projeto</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Número do Projeto" required>
            <Input
              value={form.projectNumber}
              onChange={(e) => upd('projectNumber', e.target.value)}
              placeholder="Ex: PRJ-2024-043"
              className={errors.projectNumber ? 'border-red-400' : ''}
            />
            {errors.projectNumber && <p className="text-xs text-red-500 mt-1">{errors.projectNumber}</p>}
          </FormField>
          <FormField label="Cliente do Projeto" required>
            <Input
              value={form.projectClient}
              onChange={(e) => upd('projectClient', e.target.value)}
              placeholder="Nome do cliente"
              className={errors.projectClient ? 'border-red-400' : ''}
            />
            {errors.projectClient && <p className="text-xs text-red-500 mt-1">{errors.projectClient}</p>}
          </FormField>
          <FormField label="Fornecedor" required>
            <Select
              value={form.supplierId}
              onChange={(e) => upd('supplierId', e.target.value)}
              className={errors.supplierId ? 'border-red-400' : ''}
            >
              <option value="">Selecione o fornecedor...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            {errors.supplierId && <p className="text-xs text-red-500 mt-1">{errors.supplierId}</p>}
          </FormField>
          <FormField label="Aprovador" required>
            <Select
              value={form.approverId}
              onChange={(e) => upd('approverId', e.target.value)}
              className={errors.approverId ? 'border-red-400' : ''}
            >
              <option value="">Selecione o aprovador...</option>
              {approvers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
            {errors.approverId && <p className="text-xs text-red-500 mt-1">{errors.approverId}</p>}
          </FormField>
          <FormField label="Imposto % (sobre subtotal)">
            <Input
              type="number" min="0" max="100" step="0.1"
              value={form.tax}
              onChange={(e) => upd('tax', e.target.value)}
              placeholder="0"
            />
          </FormField>
          <FormField label="Observações">
            <Textarea
              value={form.notes}
              onChange={(e) => upd('notes', e.target.value)}
              placeholder="Informações adicionais..."
            />
          </FormField>
        </div>

        {/* Modo de Entrega */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 mb-2">Modo de Entrega</p>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            {([
              { v: 'entrega', l: '🚚 Entrega' },
              { v: 'retirada', l: '🏬 Retirada na loja' },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setDeliveryMode(opt.v)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  deliveryMode === opt.v ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>

          {deliveryMode === 'entrega' && (
            <div className="mt-3">
              <p className="text-xs font-bold text-gray-500 mb-2">Quem realizará a entrega?</p>
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                {([
                  { v: 'fornecedor', l: 'Fornecedor entrega' },
                  { v: 'transportadora', l: 'Transportadora' },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setDeliveryCarrier(opt.v)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      deliveryCarrier === opt.v ? 'bg-blue-900 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>

              <div className="mt-3 max-w-2xl">
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Endereço de Entrega <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Rua, número, complemento, bairro, cidade/UF, CEP"
                  className={errors.deliveryAddress ? 'border-red-400' : ''}
                />
                {errors.deliveryAddress && (
                  <p className="text-xs text-red-500 mt-1">{errors.deliveryAddress}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-blue-900">Itens da Requisição</h2>
          <Button variant="ghost" size="sm" onClick={() => setAddingItem(true)}>+ Adicionar Item</Button>
        </div>

        {errors.items && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{errors.items}</div>
        )}

        {/* Add Item Row */}
        {addingItem && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-4 gap-3 items-end">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Item *</label>
                <Select value={newLine.itemId} onChange={(e) => setNewLine((n) => ({ ...n, itemId: e.target.value }))}>
                  <option value="">Selecione o item...</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.code} — {i.name} · R$ {i.price.toFixed(2)}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Quantidade *</label>
                <Input
                  type="number" min="1"
                  value={newLine.qty}
                  onChange={(e) => setNewLine((n) => ({ ...n, qty: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Desconto %</label>
                <Input
                  type="number" min="0" max="100"
                  value={newLine.discount}
                  onChange={(e) => setNewLine((n) => ({ ...n, discount: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={addLine} disabled={!newLine.itemId}>Confirmar</Button>
              <Button size="sm" variant="secondary" onClick={() => setAddingItem(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                {['Código', 'Descrição', 'Qtd', 'Valor Unit. (R$)', 'Desconto', 'Com Desconto (R$)', 'Total (R$)', ''].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li) => {
                const unitWithDiscount = li.unitPrice * (1 - li.discount / 100);
                const lineTotal = unitWithDiscount * li.qty;
                return (
                  <tr key={li.id} className="border-b border-gray-50">
                    <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{li.item.code}</td>
                    <td className="px-3 py-2.5 font-medium">{li.item.name}</td>
                    <td className="px-3 py-2.5 text-center">{li.qty}</td>
                    <td className="px-3 py-2.5">R$ {fmt(li.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-green-700 font-semibold">{li.discount > 0 ? `${li.discount}%` : '—'}</td>
                    <td className="px-3 py-2.5">R$ {fmt(unitWithDiscount)}</td>
                    <td className="px-3 py-2.5 font-bold">R$ {fmt(lineTotal)}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => removeLine(li.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {lineItems.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">Nenhum item adicionado</div>
          )}
        </div>

        {lineItems.length > 0 && (
          <TotalsBox subtotal={subtotal} tax={taxAmt} taxRate={tax} total={total} />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={handleSubmit}>Enviar para Aprovação →</Button>
      </div>
    </div>
  );
}
