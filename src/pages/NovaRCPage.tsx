import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useClientes } from '@/context/ClientesContext';
import { LineItem, PurchaseRequest } from '@/types';
import { FormField, Input, Select, Textarea, Button, TotalsBox } from '@/components/ui-pf';
import { gerarNumeroRC, validarNumeroProjeto, normalizarProjeto } from '@/lib/numeracaoRC';
import SeletorItens from '@/components/SeletorItens';
import SeletorServicos from '@/components/SeletorServicos';
import CartaoConsolidadoProjeto from '@/components/CartaoConsolidadoProjeto';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  onSave: () => void;
  onCancel: () => void;
}

export function NovaRCPage({ onSave, onCancel }: Props) {
  const { items, suppliers, users, currentUser, addRC, rcs } = useApp();
  const { clientes } = useClientes();
  const approvers = users.filter((u) => u.role.includes('aprovador'));

  const [form, setForm] = useState({
    projectNumber: '', clienteId: '', supplierId: '',
    approverId: '', tax: '0', notes: '',
  });
  const [deliveryMode, setDeliveryMode] = useState<'entrega' | 'retirada'>('entrega');
  const [deliveryCarrier, setDeliveryCarrier] = useState<'transportadora' | 'fornecedor'>('fornecedor');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [servicosAberto, setServicosAberto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdicionarItens = (novos: LineItem[]) => {
    setLineItems((prev) => [...prev, ...novos]);
    setSeletorAberto(false);
  };


  const updateLineUnitPrice = (id: number, value: string) => {
    const v = parseFloat(value);
    setLineItems((prev) => prev.map((l) => (l.id === id ? { ...l, unitPrice: isNaN(v) ? 0 : v } : l)));
  };

  const removeLine = (id: number) => setLineItems((prev) => prev.filter((l) => l.id !== id));

  const subtotal = lineItems.reduce((s, li) => s + li.unitPrice * li.qty * (1 - li.discount / 100), 0);
  const tax = parseFloat(form.tax) || 0;
  const taxAmt = subtotal * (tax / 100);
  const total = subtotal + taxAmt;
  const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2 });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.projectNumber) e.projectNumber = 'Obrigatório';
    else if (!validarNumeroProjeto(form.projectNumber)) e.projectNumber = 'Deve ter 4 dígitos numéricos';
    if (!form.clienteId) e.clienteId = 'Selecione um cliente';
    if (!form.supplierId) e.supplierId = 'Obrigatório';
    if (!form.approverId) e.approverId = 'Obrigatório';
    if (lineItems.length === 0) e.items = 'Adicione pelo menos um item';
    if (deliveryMode === 'entrega' && !deliveryAddress.trim()) e.deliveryAddress = 'Informe o endereço de entrega';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const cliente = clientes.find((c) => c.id === form.clienteId);
    const projeto = normalizarProjeto(form.projectNumber);
    const rc: PurchaseRequest = {
      id: gerarNumeroRC(projeto, rcs),
      projectNumber: projeto,
      projectClient: cliente?.nome ?? '',
      supplier: suppliers.find((s) => s.id === form.supplierId)!,
      approver: users.find((u) => u.id === form.approverId)!,
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

      {/* Consolidado do Projeto (aparece após informar o número do projeto) */}
      {form.projectNumber.trim() && (
        <CartaoConsolidadoProjeto
          numeroProjeto={form.projectNumber.trim()}
          itensAtuais={lineItems}
        />
      )}

      {/* Project Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-bold text-blue-900 mb-4 pb-3 border-b border-gray-100">Informações do Projeto</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Número do Projeto" required>
            <Input
              value={form.projectNumber}
              onChange={(e) => upd('projectNumber', e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Ex: 7025"
              maxLength={4}
              inputMode="numeric"
              className={errors.projectNumber ? 'border-red-400' : ''}
            />
            {validarNumeroProjeto(form.projectNumber) && (
              <p className="text-xs text-gray-400 mt-1">
                Nr da RC: <span className="font-medium text-gray-600">
                  {gerarNumeroRC(form.projectNumber, rcs)}
                </span>
              </p>
            )}
            {errors.projectNumber && <p className="text-xs text-red-500 mt-1">{errors.projectNumber}</p>}
          </FormField>
          <FormField label="Cliente do Projeto" required>
            <Select
              value={form.clienteId}
              onChange={(e) => upd('clienteId', e.target.value)}
              className={errors.clienteId ? 'border-red-400' : ''}
            >
              <option value="">
                {clientes.length === 0 ? 'Nenhum cliente cadastrado — cadastre em "Clientes"' : 'Selecione o cliente...'}
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}{c.doc ? ` — ${c.doc}` : ''}
                </option>
              ))}
            </Select>
            {errors.clienteId && <p className="text-xs text-red-500 mt-1">{errors.clienteId}</p>}
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
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSeletorAberto(true)}
              className="text-blue-700 hover:text-blue-900 hover:bg-blue-50"
            >
              📦 Material
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setServicosAberto(true)}
              className="text-violet-700 hover:text-violet-900 hover:bg-violet-50"
            >
              🛠️ Serviços
            </Button>
          </div>
        </div>

        {errors.items && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{errors.items}</div>
        )}

        <Dialog open={seletorAberto} onOpenChange={setSeletorAberto}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Selecionar itens</DialogTitle>
            </DialogHeader>
            <SeletorItens
              onConfirmar={handleAdicionarItens}
              onCancelar={() => setSeletorAberto(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={servicosAberto} onOpenChange={setServicosAberto}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compra de Serviços</DialogTitle>
            </DialogHeader>
            <SeletorServicos
              onConfirmar={handleAdicionarItens}
              onCancelar={() => setServicosAberto(false)}
            />
          </DialogContent>
        </Dialog>


        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                {['Código', 'Descrição', 'Categoria', 'Classe', 'Tipo', 'Qtd', 'Valor Unit. (€)', 'Desconto', 'Com Desconto (€)', 'Total (€)', ''].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li) => {
                const unitWithDiscount = li.unitPrice * (1 - li.discount / 100);
                const lineTotal = unitWithDiscount * li.qty;
                const isServico = !!li.isServico;
                return (
                  <tr key={li.id} className={`border-b border-gray-50 ${isServico ? 'bg-violet-50/30' : ''}`}>
                    <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">
                      {isServico ? <span className="text-violet-400">SVC</span> : li.item.codigo}
                    </td>
                    <td className="px-3 py-2.5 font-medium">{li.item.descricao}</td>
                    <td className="px-3 py-2.5">
                      {isServico ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                          🛠️ Serviços
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{li.item.categoria}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      {isServico ? '—' : li.item.classe}
                    </td>
                    <td className="px-3 py-2.5">
                      {isServico ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">{li.item.tipo}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">{li.qty}</td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={li.unitPrice}
                        onChange={(e) => updateLineUnitPrice(li.id, e.target.value)}
                        className="w-24 px-2 py-1 text-sm text-right border border-gray-200 rounded focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-green-700 font-semibold">
                      {isServico ? '—' : (li.discount > 0 ? `${li.discount}%` : '—')}
                    </td>
                    <td className="px-3 py-2.5">€ {fmt(unitWithDiscount)}</td>
                    <td className="px-3 py-2.5 font-bold">€ {fmt(lineTotal)}</td>
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
