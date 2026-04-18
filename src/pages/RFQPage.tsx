import { useState, useMemo } from "react";
import { useRFQ, RFQItem } from "@/context/RFQContext";
import { useItens, CATEGORIAS, CLASSES } from "@/context/ItensContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Search, FileDown, Plus, Trash2, ExternalLink, FilePlus } from "lucide-react";
import { gerarPDFRFQ } from "@/lib/gerarPDFRFQ";
import { validarNumeroProjeto } from "@/lib/numeracaoRC";

const CAT_STYLE: Record<string, string> = {
  Tools: "bg-blue-50 text-blue-700 border-blue-200",
  Consumables: "bg-amber-50 text-amber-700 border-amber-200",
};

// ── Etapa 1: Seletor de itens com filtros e checkboxes ──────────────────────
function SeletorItensRFQ({
  selecionados,
  setSelecionados,
}: {
  selecionados: Record<string, { qty: number; link: string }>;
  setSelecionados: React.Dispatch<React.SetStateAction<Record<string, { qty: number; link: string }>>>;
}) {
  const { itens } = useItens();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterClasse, setFilterClasse] = useState("all");

  const filtrados = useMemo(() => itens.filter((i) => {
    const matchS = !search || i.descricao.toLowerCase().includes(search.toLowerCase()) || i.codigo.toLowerCase().includes(search.toLowerCase());
    const matchC = filterCat === "all" || i.categoria === filterCat;
    const matchCl = filterClasse === "all" || i.classe === filterClasse;
    return matchS && matchC && matchCl;
  }), [itens, search, filterCat, filterClasse]);

  const allSelected = filtrados.length > 0 && filtrados.every((i) => selecionados[String(i.id)]);

  function toggle(id: string) {
    const item = itens.find((i) => String(i.id) === id);
    setSelecionados((prev) => {
      const next = { ...prev };
      if (next[id]) { delete next[id]; }
      else { next[id] = { qty: 1, link: (item as any)?.linkReferencia ?? "" }; }
      return next;
    });
  }

  function toggleAll() {
    setSelecionados((prev) => {
      const next = { ...prev };
      if (allSelected) {
        filtrados.forEach((i) => delete next[String(i.id)]);
      } else {
        filtrados.forEach((i) => {
          if (!next[String(i.id)]) next[String(i.id)] = { qty: 1, link: (i as any).linkReferencia ?? "" };
        });
      }
      return next;
    });
  }

  const totalSel = Object.keys(selecionados).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Buscar..." className="pl-8 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="h-8 text-sm w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterClasse} onValueChange={setFilterClasse}>
          <SelectTrigger className="h-8 text-sm w-44"><SelectValue placeholder="Classe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as classes</SelectItem>
            {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterCat !== "all" || filterClasse !== "all" || search) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400"
            onClick={() => { setSearch(""); setFilterCat("all"); setFilterClasse("all"); }}>
            Limpar
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{filtrados.length} item(s)</span>
        {totalSel > 0 && <span className="text-blue-600 font-medium">{totalSel} selecionado(s)</span>}
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: 300 }}>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-3 py-2"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></th>
                <th className="text-left px-3 py-2 font-normal text-gray-500">Código</th>
                <th className="text-left px-3 py-2 font-normal text-gray-500">Descrição</th>
                <th className="text-left px-3 py-2 font-normal text-gray-500">Categoria</th>
                <th className="text-left px-3 py-2 font-normal text-gray-500">Classe</th>
                <th className="text-left px-3 py-2 font-normal text-gray-500">Unidade</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">Nenhum item encontrado</td></tr>
              ) : filtrados.map((item) => {
                const key = String(item.id);
                const checked = !!selecionados[key];
                return (
                  <tr key={item.id} className={`border-t border-gray-100 cursor-pointer ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`} onClick={() => toggle(key)}>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked} onCheckedChange={() => toggle(key)} />
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-400">{item.codigo}</td>
                    <td className="px-3 py-2 font-medium text-gray-700 max-w-[200px]"><div className="truncate">{item.descricao}</div></td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${CAT_STYLE[item.categoria] ?? ""}`}>{item.categoria}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{item.classe}</td>
                    <td className="px-3 py-2 text-gray-500">{item.unidade}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Etapa 2: Preencher Qtd e Link de referência ─────────────────────────────
function PreencherValoresRFQ({
  selecionados,
  setSelecionados,
}: {
  selecionados: Record<string, { qty: number; link: string }>;
  setSelecionados: React.Dispatch<React.SetStateAction<Record<string, { qty: number; link: string }>>>;
}) {
  const { itens } = useItens();
  const itensSel = itens.filter((i) => selecionados[String(i.id)]);

  function setField(id: string, field: "qty" | "link", value: string | number) {
    setSelecionados((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function remover(id: string) {
    setSelecionados((prev) => { const next = { ...prev }; delete next[id]; return next; });
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="text-left px-3 py-2 font-normal text-gray-500">Descrição</th>
              <th className="text-left px-3 py-2 font-normal text-gray-500">Categoria</th>
              <th className="text-left px-3 py-2 font-normal text-gray-500">Classe</th>
              <th className="text-right px-3 py-2 font-normal text-gray-500 w-20">Qtd *</th>
              <th className="text-left px-3 py-2 font-normal text-gray-500">Link de Referência</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {itensSel.map((item) => {
              const key = String(item.id);
              const v = selecionados[key];
              return (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-700 truncate max-w-[180px]">{item.descricao}</div>
                    <div className="text-gray-400 font-mono">{item.codigo}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${CAT_STYLE[item.categoria] ?? ""}`}>{item.categoria}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{item.classe}</td>
                  <td className="px-2 py-2 w-20">
                    <Input type="number" min={1} className="h-8 text-xs text-right"
                      value={v.qty} onChange={(e) => setField(key, "qty", Math.max(1, Number(e.target.value)))} />
                  </td>
                  <td className="px-2 py-2 min-w-[200px]">
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Input
                          type="url" placeholder="https://..." className="h-8 text-xs pr-6"
                          value={v.link}
                          onChange={(e) => setField(key, "link", e.target.value)}
                        />
                        {v.link === ((item as any).linkReferencia ?? "") && v.link !== "" && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-500" title="Preenchido automaticamente do cadastro">✓</span>
                        )}
                      </div>
                      {v.link && (
                        <a href={v.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex-shrink-0" title="Abrir link">
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                    {v.link === ((item as any).linkReferencia ?? "") && v.link !== "" && (
                      <p className="text-xs text-green-600 mt-0.5">Preenchido do cadastro</p>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button onClick={() => remover(key)} className="text-gray-300 hover:text-red-400">×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Página principal RFQ ────────────────────────────────────────────────────
export default function RFQ() {
  const { rfqs, addRFQ, deleteRFQ } = useRFQ();
  const [criarOpen, setCriarOpen] = useState(false);
  const [etapa, setEtapa] = useState<1 | 2>(1);

  // Form
  const [numeroProjeto, setNumeroProjeto] = useState("");
  const [prazoResposta, setPrazoResposta] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [selecionados, setSelecionados] = useState<Record<string, { qty: number; link: string }>>({});

  const { itens } = useItens();
  const projetoValido = validarNumeroProjeto(numeroProjeto);
  const totalSel = Object.keys(selecionados).length;

  function resetForm() {
    setNumeroProjeto(""); setPrazoResposta(""); setDataEntrega(""); setObservacoes("");
    setSelecionados({}); setEtapa(1);
  }

  function handleCriar() {
    if (!projetoValido) { toast.error("Número do projeto deve ter 4 dígitos."); return; }
    if (totalSel === 0) { toast.error("Selecione ao menos um item."); return; }
    if (!prazoResposta) { toast.error("Informe o prazo para resposta."); return; }
    if (!dataEntrega) { toast.error("Informe a data de entrega dos materiais."); return; }

    const rfqItens: RFQItem[] = Object.entries(selecionados).map(([id, v]) => {
      const item = itens.find((i) => String(i.id) === id)!;
      return {
        id: Number(id),
        itemId: id,
        codigo: item.codigo,
        descricao: item.descricao,
        categoria: item.categoria,
        classe: item.classe,
        unidade: item.unidade,
        qty: v.qty,
        linkReferencia: v.link,
      };
    });

    const novaRFQ = addRFQ({
      numeroProjeto: numeroProjeto.trim(),
      prazoResposta,
      dataEntrega,
      observacoes,
      itens: rfqItens,
      status: "rascunho",
    });

    toast.success(`${novaRFQ.numeroRFQ} criada com sucesso!`);
    setCriarOpen(false);
    resetForm();
    // Gera PDF automaticamente
    setTimeout(() => gerarPDFRFQ(novaRFQ), 300);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">RFQ</h1>
          <p className="text-sm text-gray-400">Request for Quotation — Cotação de Orçamento</p>
        </div>
        <Button onClick={() => { resetForm(); setCriarOpen(true); }} className="gap-2">
          <FilePlus size={14} /> Nova RFQ
        </Button>
      </div>

      {/* Lista de RFQs */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número RFQ</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rfqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-10">Nenhuma RFQ criada</TableCell>
              </TableRow>
            ) : rfqs.map((rfq) => (
              <TableRow key={rfq.id}>
                <TableCell className="font-medium text-blue-700">{rfq.numeroRFQ}</TableCell>
                <TableCell className="font-mono text-gray-500">{rfq.numeroProjeto}</TableCell>
                <TableCell className="text-gray-500">{rfq.itens.length} item(s)</TableCell>
                <TableCell className="text-gray-500">
                  {rfq.prazoResposta
                    ? new Date(rfq.prazoResposta + "T00:00:00").toLocaleDateString("pt-BR")
                    : "—"}
                </TableCell>
                <TableCell className="text-gray-500">
                  {new Date(rfq.criadoEm).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" className="gap-1.5"
                      onClick={() => gerarPDFRFQ(rfq)}>
                      <FileDown size={13} /> PDF
                    </Button>
                    <Button variant="outline" size="sm"
                      className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => { if (confirm("Excluir esta RFQ?")) deleteRFQ(rfq.id); }}>
                      <Trash2 size={13} /> Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal Nova RFQ */}
      <Dialog open={criarOpen} onOpenChange={(v) => { if (!v) resetForm(); setCriarOpen(v); }}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova RFQ {projetoValido && `— Projeto ${numeroProjeto}`}</DialogTitle>
          </DialogHeader>

          {/* Dados gerais */}
          <div className="grid grid-cols-2 gap-4 pb-2">
            <div className="flex flex-col gap-1.5">
              <Label>Nº do Projeto * <span className="text-gray-400 font-normal">(4 dígitos)</span></Label>
              <Input
                placeholder="Ex: 7025" maxLength={4}
                value={numeroProjeto}
                onChange={(e) => setNumeroProjeto(e.target.value.replace(/\D/g, ""))}
              />
              {numeroProjeto.length > 0 && !projetoValido && (
                <p className="text-xs text-red-500">Deve ter 4 dígitos.</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Prazo para Resposta *</Label>
              <Input type="date" value={prazoResposta} onChange={(e) => setPrazoResposta(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data de Entrega dos Materiais * <span className="text-gray-400 font-normal">(coleta/transporte)</span></Label>
              <Input type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Observações</Label>
              <Textarea placeholder="Condições, instruções ao fornecedor..." className="text-sm min-h-[60px]"
                value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            {/* Etapa 1 — selecionar */}
            {etapa === 1 && (
              <>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  1 — Selecione os itens para cotação
                </p>
                <SeletorItensRFQ selecionados={selecionados} setSelecionados={setSelecionados} />
                <div className="flex justify-end mt-4">
                  <Button disabled={totalSel === 0} onClick={() => setEtapa(2)}>
                    Próximo — preencher qtd e links ({totalSel})
                  </Button>
                </div>
              </>
            )}

            {/* Etapa 2 — preencher qtd e link */}
            {etapa === 2 && (
              <>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  2 — Defina a quantidade e o link de referência de cada item
                </p>
                <PreencherValoresRFQ selecionados={selecionados} setSelecionados={setSelecionados} />
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setEtapa(1)}>← Voltar</Button>
                  <Button
                    disabled={!projetoValido || totalSel === 0 || !prazoResposta || !dataEntrega}
                    onClick={handleCriar}
                    className="gap-2"
                  >
                    <FileDown size={14} /> Criar RFQ e Gerar PDF
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
