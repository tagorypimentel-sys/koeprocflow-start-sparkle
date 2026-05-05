import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Mail, Pencil, Trash2, Check, X } from "lucide-react";
import { PurchaseRequest, LineItem } from "@/types";
import { useState } from "react";

function fmtMoeda(v: number) {
  return v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function fmtData(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return iso; }
}

const RC_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando Aprovação",
  aprovada: "Aprovada",
  aguardando_confirmacao_entrega: "Aguardando Entrega",
  entrega_confirmada: "Entrega Confirmada",
  nota_fiscal_recebida: "NF Recebida",
  pagamento_realizado: "Pagamento Realizado",
  nota_enviada_contador: "Concluído",
  devolvida: "Devolvida",
};
const RC_STATUS_STYLE: Record<string, string> = {
  rascunho: "bg-gray-50 text-gray-500 border-gray-200",
  aguardando_aprovacao: "bg-amber-50 text-amber-700 border-amber-200",
  aprovada: "bg-green-50 text-green-700 border-green-200",
  aguardando_confirmacao_entrega: "bg-blue-50 text-blue-700 border-blue-200",
  entrega_confirmada: "bg-blue-50 text-blue-700 border-blue-200",
  nota_fiscal_recebida: "bg-purple-50 text-purple-700 border-purple-200",
  pagamento_realizado: "bg-purple-50 text-purple-700 border-purple-200",
  nota_enviada_contador: "bg-gray-50 text-gray-600 border-gray-200",
  devolvida: "bg-red-50 text-red-600 border-red-200",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || "—"}</span>
    </div>
  );
}

function calcTotaisLinhas(items: LineItem[], tax: number) {
  const subtotal = items.reduce((acc, li) => {
    const cd = (li.unitPrice ?? 0) * (1 - (li.discount ?? 0) / 100);
    return acc + cd * (li.qty ?? 1);
  }, 0);
  const imposto = subtotal * ((tax ?? 0) / 100);
  return { subtotal, imposto, total: subtotal + imposto };
}

function calcTotais(rc: PurchaseRequest) {
  return calcTotaisLinhas(rc.lineItems, rc.tax ?? 0);
}

// ── Visualizar RC ─────────────────────────────────────────────────────────────
export function VisualizarRC({
  rc, clienteNome, open, onClose, onGerarPDF,
}: {
  rc: PurchaseRequest | null; clienteNome: string; open: boolean;
  onClose: () => void; onGerarPDF: () => void;
}) {
  if (!rc) return null;
  const { subtotal, imposto, total } = calcTotais(rc);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-lg">{rc.id}</DialogTitle>
              <p className="text-sm text-gray-400 mt-0.5">Requisição de Compra</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${RC_STATUS_STYLE[rc.status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                {RC_STATUS_LABEL[rc.status] ?? rc.status}
              </span>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onGerarPDF}>
                <FileDown size={13} /> PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
          <InfoRow label="Projeto" value={rc.projectNumber} />
          <InfoRow label="Cliente" value={clienteNome} />
          <InfoRow label="Solicitante" value={rc.requester?.name} />
          <InfoRow label="Fornecedor" value={rc.supplier?.name} />
          <InfoRow label="Aprovador" value={rc.approver?.name} />
          <InfoRow label="Data" value={fmtData(rc.createdAt)} />
          <InfoRow label="Modo de Entrega" value={rc.deliveryMode} />
          <InfoRow label="Imposto" value={rc.tax ? `${rc.tax}%` : "0%"} />
          {rc.poNumber && <InfoRow label="PO Gerada" value={<span className="text-green-700 font-semibold">{rc.poNumber}</span>} />}
        </div>

        {rc.deliveryAddress && (
          <div className="px-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Endereço de Entrega</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{rc.deliveryAddress}</p>
          </div>
        )}

        {rc.notes && (
          <div className="px-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{rc.notes}</p>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">Itens da Requisição</p>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Código</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Descrição</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Cat.</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Tipo</th>
                  <th className="text-center px-3 py-2 font-normal text-gray-500">Qtd</th>
                  <th className="text-right px-3 py-2 font-normal text-gray-500">Unit.</th>
                  <th className="text-right px-3 py-2 font-normal text-gray-500">Desc.</th>
                  <th className="text-right px-3 py-2 font-normal text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {rc.lineItems.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-6">Nenhum item</td></tr>
                ) : rc.lineItems.map((li, i) => {
                  const cd = (li.unitPrice ?? 0) * (1 - (li.discount ?? 0) / 100);
                  const rowTotal = cd * (li.qty ?? 1);
                  return (
                    <tr key={i} className={`border-t border-gray-100 ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                      <td className="px-3 py-2 font-mono text-gray-400">{li.item?.codigo}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-[180px]">
                        <div className="truncate" title={li.item?.descricao}>{li.item?.descricao}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{li.item?.categoria}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${li.item?.tipo === "CAPEX" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                          {li.item?.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">{li.qty}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmtMoeda(li.unitPrice ?? 0)}</td>
                      <td className="px-3 py-2 text-right text-gray-400">{li.discount ? `${li.discount}%` : "—"}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{fmtMoeda(rowTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="space-y-1 min-w-[200px]">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{fmtMoeda(subtotal)}</span>
            </div>
            {(rc.tax ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Imposto ({rc.tax}%)</span><span>{fmtMoeda(imposto)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-1 mt-1">
              <span>Total</span><span>{fmtMoeda(total)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Visualizar PO ─────────────────────────────────────────────────────────────
export function VisualizarPO({
  rc, clienteNome, open, onClose, onGerarPDF, onEmail,
  isAprovador = false,
  onSaveLineItems,
}: {
  rc: PurchaseRequest | null; clienteNome: string; open: boolean;
  onClose: () => void; onGerarPDF: () => void; onEmail: () => void;
  /** Se true, exibe o botão "Editar PO" (somente aprovadores) */
  isAprovador?: boolean;
  /** Callback chamado ao salvar as alterações de itens */
  onSaveLineItems?: (novasLinhas: LineItem[]) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [linhasEdit, setLinhasEdit] = useState<LineItem[]>([]);

  if (!rc || !rc.poNumber) return null;

  // Quando entra no modo de edição, copia os itens atuais
  function handleIniciarEdicao() {
    setLinhasEdit(rc!.lineItems.map((li) => ({ ...li })));
    setEditMode(true);
  }

  function handleCancelarEdicao() {
    setEditMode(false);
    setLinhasEdit([]);
  }

  function handleSalvar() {
    if (onSaveLineItems) onSaveLineItems(linhasEdit);
    setEditMode(false);
    setLinhasEdit([]);
  }

  function handleQtyChange(id: number, val: string) {
    const n = Math.max(1, Number(val) || 1);
    setLinhasEdit((prev) => prev.map((l) => l.id === id ? { ...l, qty: n } : l));
  }

  function handleRemoveLinha(id: number) {
    setLinhasEdit((prev) => prev.filter((l) => l.id !== id));
  }

  const linhasExibidas = editMode ? linhasEdit : rc.lineItems;
  const { subtotal, imposto, total } = editMode
    ? calcTotaisLinhas(linhasEdit, rc.tax ?? 0)
    : calcTotais(rc);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { handleCancelarEdicao(); onClose(); } }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-lg">{rc.poNumber}</DialogTitle>
              <p className="text-sm text-gray-400 mt-0.5">Pedido de Compra · RC: {rc.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                Aprovada
              </span>

              {/* Botão editar — SOMENTE aprovador, SOMENTE quando não está editando */}
              {isAprovador && !editMode && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border-0"
                  onClick={handleIniciarEdicao}
                >
                  <Pencil size={13} /> Editar PO
                </Button>
              )}

              {/* Botões de salvar/cancelar no modo edição */}
              {editMode && (
                <>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white border-0"
                    onClick={handleSalvar}
                    disabled={linhasEdit.length === 0}
                  >
                    <Check size={13} /> Salvar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-gray-600"
                    onClick={handleCancelarEdicao}
                  >
                    <X size={13} /> Cancelar
                  </Button>
                </>
              )}

              {!editMode && (
                <>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={onEmail}>
                    <Mail size={13} /> Email
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={onGerarPDF}>
                    <FileDown size={13} /> PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Banner de modo de edição */}
        {editMode && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            <Pencil size={13} className="shrink-0" />
            <span>
              Modo de edição ativo — altere as <strong>quantidades</strong> ou <strong>remova linhas</strong>.
              As alterações serão salvas na RC/PO.
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
          <InfoRow label="Projeto" value={rc.projectNumber} />
          <InfoRow label="Cliente" value={clienteNome} />
          <InfoRow label="Fornecedor" value={rc.supplier?.name} />
          <InfoRow label="Solicitante" value={rc.requester?.name} />
          <InfoRow label="Modo de Entrega" value={rc.deliveryMode} />
          <InfoRow label="Imposto" value={rc.tax ? `${rc.tax}%` : "0%"} />
          <InfoRow label="Data aprovação" value={fmtData(rc.approvedAt ?? rc.createdAt)} />
        </div>

        {rc.deliveryAddress && (
          <div className="px-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Endereço de Entrega</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{rc.deliveryAddress}</p>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">Itens do Pedido</p>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#1a2b6d]">
                <tr>
                  <th className="text-left px-3 py-2 font-normal text-white">Código</th>
                  <th className="text-left px-3 py-2 font-normal text-white">Descrição</th>
                  <th className="text-left px-3 py-2 font-normal text-white">Categoria</th>
                  <th className="text-left px-3 py-2 font-normal text-white">Classe</th>
                  <th className="text-left px-3 py-2 font-normal text-white">Tipo</th>
                  <th className="text-center px-3 py-2 font-normal text-white">Qtd</th>
                  <th className="text-right px-3 py-2 font-normal text-white">Unit.</th>
                  <th className="text-right px-3 py-2 font-normal text-white">Desc.</th>
                  <th className="text-right px-3 py-2 font-normal text-white">Total</th>
                  {editMode && <th className="w-8 px-2 py-2" />}
                </tr>
              </thead>
              <tbody>
                {linhasExibidas.length === 0 ? (
                  <tr><td colSpan={editMode ? 10 : 9} className="text-center text-gray-400 py-6">Nenhum item</td></tr>
                ) : linhasExibidas.map((li, i) => {
                  const cd = (li.unitPrice ?? 0) * (1 - (li.discount ?? 0) / 100);
                  const rowTotal = cd * (li.qty ?? 1);
                  return (
                    <tr key={li.id} className={`border-t border-gray-100 ${i % 2 === 1 ? "bg-gray-50" : ""} ${editMode ? "hover:bg-amber-50/30" : ""}`}>
                      <td className="px-3 py-2 font-mono text-gray-400">{li.item?.codigo}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-[160px]">
                        <div className="truncate" title={li.item?.descricao}>{li.item?.descricao}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{li.item?.categoria}</td>
                      <td className="px-3 py-2 text-gray-500">{li.item?.classe}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${li.item?.tipo === "CAPEX" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                          {li.item?.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">
                        {editMode ? (
                          <input
                            type="number"
                            min={1}
                            value={li.qty}
                            onChange={(e) => handleQtyChange(li.id, e.target.value)}
                            className="w-16 px-1.5 py-0.5 text-xs text-center border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                          />
                        ) : (
                          li.qty
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmtMoeda(li.unitPrice ?? 0)}</td>
                      <td className="px-3 py-2 text-right text-gray-400">{li.discount ? `${li.discount}%` : "—"}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{fmtMoeda(rowTotal)}</td>
                      {editMode && (
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveLinha(li.id)}
                            title="Remover linha"
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="space-y-1 min-w-[220px]">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{fmtMoeda(subtotal)}</span>
            </div>
            {(rc.tax ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Imposto ({rc.tax}%)</span><span>{fmtMoeda(imposto)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-[#1a2b6d] border-t border-gray-200 pt-1 mt-1">
              <span>Total</span><span>{fmtMoeda(total)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function fmtMoeda(v: number) {
  return v.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function fmtData(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("pt-BR"); } catch { return iso; }
}

const RC_STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_aprovacao: "Aguardando Aprovação",
  aprovada: "Aprovada",
  aguardando_confirmacao_entrega: "Aguardando Entrega",
  entrega_confirmada: "Entrega Confirmada",
  nota_fiscal_recebida: "NF Recebida",
  pagamento_realizado: "Pagamento Realizado",
  nota_enviada_contador: "Concluído",
  devolvida: "Devolvida",
};
const RC_STATUS_STYLE: Record<string, string> = {
  rascunho: "bg-gray-50 text-gray-500 border-gray-200",
  aguardando_aprovacao: "bg-amber-50 text-amber-700 border-amber-200",
  aprovada: "bg-green-50 text-green-700 border-green-200",
  aguardando_confirmacao_entrega: "bg-blue-50 text-blue-700 border-blue-200",
  entrega_confirmada: "bg-blue-50 text-blue-700 border-blue-200",
  nota_fiscal_recebida: "bg-purple-50 text-purple-700 border-purple-200",
  pagamento_realizado: "bg-purple-50 text-purple-700 border-purple-200",
  nota_enviada_contador: "bg-gray-50 text-gray-600 border-gray-200",
  devolvida: "bg-red-50 text-red-600 border-red-200",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || "—"}</span>
    </div>
  );
}

function calcTotais(rc: PurchaseRequest) {
  const subtotal = rc.lineItems.reduce((acc, li) => {
    const cd = (li.unitPrice ?? 0) * (1 - (li.discount ?? 0) / 100);
    return acc + cd * (li.qty ?? 1);
  }, 0);
  const imposto = subtotal * ((rc.tax ?? 0) / 100);
  return { subtotal, imposto, total: subtotal + imposto };
}

// ── Visualizar RC ─────────────────────────────────────────────────────────────
export function VisualizarRC({
  rc, clienteNome, open, onClose, onGerarPDF,
}: {
  rc: PurchaseRequest | null; clienteNome: string; open: boolean;
  onClose: () => void; onGerarPDF: () => void;
}) {
  if (!rc) return null;
  const { subtotal, imposto, total } = calcTotais(rc);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-lg">{rc.id}</DialogTitle>
              <p className="text-sm text-gray-400 mt-0.5">Requisição de Compra</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${RC_STATUS_STYLE[rc.status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                {RC_STATUS_LABEL[rc.status] ?? rc.status}
              </span>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onGerarPDF}>
                <FileDown size={13} /> PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
          <InfoRow label="Projeto" value={rc.projectNumber} />
          <InfoRow label="Cliente" value={clienteNome} />
          <InfoRow label="Solicitante" value={rc.requester?.name} />
          <InfoRow label="Fornecedor" value={rc.supplier?.name} />
          <InfoRow label="Aprovador" value={rc.approver?.name} />
          <InfoRow label="Data" value={fmtData(rc.createdAt)} />
          <InfoRow label="Modo de Entrega" value={rc.deliveryMode} />
          <InfoRow label="Imposto" value={rc.tax ? `${rc.tax}%` : "0%"} />
          {rc.poNumber && <InfoRow label="PO Gerada" value={<span className="text-green-700 font-semibold">{rc.poNumber}</span>} />}
        </div>

        {rc.deliveryAddress && (
          <div className="px-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Endereço de Entrega</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{rc.deliveryAddress}</p>
          </div>
        )}

        {rc.notes && (
          <div className="px-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{rc.notes}</p>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">Itens da Requisição</p>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Código</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Descrição</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Cat.</th>
                  <th className="text-left px-3 py-2 font-normal text-gray-500">Tipo</th>
                  <th className="text-center px-3 py-2 font-normal text-gray-500">Qtd</th>
                  <th className="text-right px-3 py-2 font-normal text-gray-500">Unit.</th>
                  <th className="text-right px-3 py-2 font-normal text-gray-500">Desc.</th>
                  <th className="text-right px-3 py-2 font-normal text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {rc.lineItems.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-6">Nenhum item</td></tr>
                ) : rc.lineItems.map((li, i) => {
                  const cd = (li.unitPrice ?? 0) * (1 - (li.discount ?? 0) / 100);
                  const rowTotal = cd * (li.qty ?? 1);
                  return (
                    <tr key={i} className={`border-t border-gray-100 ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                      <td className="px-3 py-2 font-mono text-gray-400">{li.item?.codigo}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-[180px]">
                        <div className="truncate" title={li.item?.descricao}>{li.item?.descricao}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{li.item?.categoria}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${li.item?.tipo === "CAPEX" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                          {li.item?.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">{li.qty}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmtMoeda(li.unitPrice ?? 0)}</td>
                      <td className="px-3 py-2 text-right text-gray-400">{li.discount ? `${li.discount}%` : "—"}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{fmtMoeda(rowTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="space-y-1 min-w-[200px]">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{fmtMoeda(subtotal)}</span>
            </div>
            {(rc.tax ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Imposto ({rc.tax}%)</span><span>{fmtMoeda(imposto)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-1 mt-1">
              <span>Total</span><span>{fmtMoeda(total)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Visualizar PO ─────────────────────────────────────────────────────────────
export function VisualizarPO({
  rc, clienteNome, open, onClose, onGerarPDF, onEmail,
}: {
  rc: PurchaseRequest | null; clienteNome: string; open: boolean;
  onClose: () => void; onGerarPDF: () => void; onEmail: () => void;
}) {
  if (!rc || !rc.poNumber) return null;
  const { subtotal, imposto, total } = calcTotais(rc);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-lg">{rc.poNumber}</DialogTitle>
              <p className="text-sm text-gray-400 mt-0.5">Pedido de Compra · RC: {rc.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                Aprovada
              </span>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onEmail}>
                <Mail size={13} /> Email
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onGerarPDF}>
                <FileDown size={13} /> PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
          <InfoRow label="Projeto" value={rc.projectNumber} />
          <InfoRow label="Cliente" value={clienteNome} />
          <InfoRow label="Fornecedor" value={rc.supplier?.name} />
          <InfoRow label="Solicitante" value={rc.requester?.name} />
          <InfoRow label="Modo de Entrega" value={rc.deliveryMode} />
          <InfoRow label="Imposto" value={rc.tax ? `${rc.tax}%` : "0%"} />
          <InfoRow label="Data aprovação" value={fmtData(rc.approvedAt ?? rc.createdAt)} />
        </div>

        {rc.deliveryAddress && (
          <div className="px-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Endereço de Entrega</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{rc.deliveryAddress}</p>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2 px-1">Itens do Pedido</p>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#1a2b6d]">
                <tr>
                  <th className="text-left px-3 py-2 font-normal text-white">Código</th>
                  <th className="text-left px-3 py-2 font-normal text-white">Descrição</th>
                  <th className="text-left px-3 py-2 font-normal text-white">Categoria</th>
                  <th className="text-left px-3 py-2 font-normal text-white">Classe</th>
                  <th className="text-left px-3 py-2 font-normal text-white">Tipo</th>
                  <th className="text-center px-3 py-2 font-normal text-white">Qtd</th>
                  <th className="text-right px-3 py-2 font-normal text-white">Unit.</th>
                  <th className="text-right px-3 py-2 font-normal text-white">Desc.</th>
                  <th className="text-right px-3 py-2 font-normal text-white">Total</th>
                </tr>
              </thead>
              <tbody>
                {rc.lineItems.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-gray-400 py-6">Nenhum item</td></tr>
                ) : rc.lineItems.map((li, i) => {
                  const cd = (li.unitPrice ?? 0) * (1 - (li.discount ?? 0) / 100);
                  const rowTotal = cd * (li.qty ?? 1);
                  return (
                    <tr key={i} className={`border-t border-gray-100 ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                      <td className="px-3 py-2 font-mono text-gray-400">{li.item?.codigo}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-[160px]">
                        <div className="truncate" title={li.item?.descricao}>{li.item?.descricao}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{li.item?.categoria}</td>
                      <td className="px-3 py-2 text-gray-500">{li.item?.classe}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${li.item?.tipo === "CAPEX" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                          {li.item?.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">{li.qty}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmtMoeda(li.unitPrice ?? 0)}</td>
                      <td className="px-3 py-2 text-right text-gray-400">{li.discount ? `${li.discount}%` : "—"}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{fmtMoeda(rowTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="space-y-1 min-w-[220px]">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{fmtMoeda(subtotal)}</span>
            </div>
            {(rc.tax ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Imposto ({rc.tax}%)</span><span>{fmtMoeda(imposto)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold text-[#1a2b6d] border-t border-gray-200 pt-1 mt-1">
              <span>Total</span><span>{fmtMoeda(total)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
