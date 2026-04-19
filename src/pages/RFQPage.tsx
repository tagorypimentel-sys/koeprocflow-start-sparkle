import { useState } from 'react';
import { useRFQ, RFQItem } from '@/context/RFQContext';
import { useItens } from '@/context/ItensContext';
import { CATEGORIAS, CLASSES } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Search, FileDown, Trash2, FilePlus, ExternalLink } from 'lucide-react';
import { gerarPDFRFQ } from '@/lib/gerarPDFRFQ';

const hoje = new Date().toISOString().split('T')[0];

const CAT_STYLE: Record<string, string> = {
  Tools: 'bg-blue-50 text-blue-700 border-blue-200',
  Consumables: 'bg-amber-50 text-amber-700 border-amber-200',
};

function safeHostname(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url.slice(0, 30); }
}

function SeletorItens({
  selecionados,
  setSelecionados,
}: {
  selecionados: Record<string, number>;
  setSelecionados: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const { itens } = useItens();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterClasse, setFilterClasse] = useState('all');

  const filtrados = itens.filter((i) => {
    const matchS = !search ||
      i.descricao.toLowerCase().includes(search.toLowerCase()) ||
      i.codigo.toLowerCase().includes(search.toLowerCase());
    const matchC = filterCat === 'all' || i.categoria === filterCat;
    const matchCl = filterClasse === 'all' || i.classe === filterClasse;
    return matchS && matchC && matchCl;
  });

  const allSel = filtrados.length > 0 && filtrados.every((i) => selecionados[String(i.id)] !== undefined);

  function toggle(id: string) {
    setSelecionados((prev) => {
      const next = { ...prev };
      if (next[id] !== undefined) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  function toggleAll() {
    setSelecionados((prev) => {
      const next = { ...prev };
      if (allSel) filtrados.forEach((i) => delete next[String(i.id)]);
      else filtrados.forEach((i) => { if (next[String(i.id)] === undefined) next[String(i.id)] = 1; });
      return next;
    });
  }

  const totalSel = Object.keys(selecionados).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Buscar por código ou descrição..." className="pl-8 h-8 text-sm"
            value={search} onChange={(e) => setSearch(e.target.value)} />
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
        {(filterCat !== 'all' || filterClasse !== 'all' || search) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400"
            onClick={() => { setSearch(''); setFilterCat('all'); setFilterClasse('all'); }}>
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{filtrados.length} item(s) encontrado(s)</span>
        {totalSel > 0 && <span className="font-medium text-blue-600">{totalSel} selecionado(s)</span>}
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-10 px-3 py-2">
                  <Checkbox checked={allSel} onCheckedChange={toggleAll} />
                </th>
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
                const checked = selecionados[key] !== undefined;
                return (
                  <tr key={item.id}
                    className={`border-t border-gray-100 cursor-pointer transition-colors ${checked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => toggle(key)}
                  >
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={checked} onCheckedChange={() => toggle(key)} />
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-400">{item.codigo}</td>
                    <td className="px-3 py-2 font-medium text-gray-700">
                      <div className="max-w-[220px] truncate" title={item.descricao}>{item.descricao}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${CAT_STYLE[item.categoria] ?? ''}`}>
                        {item.categoria}
                      </span>
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

function DefinirQuantidades({
  selecionados,
  setSelecionados,
}: {
  selecionados: Record<string, number>;
  setSelecionados: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}) {
  const { itens } = useItens();
  const itensSel = itens.filter((i) => selecionados[String(i.id)] !== undefined);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="text-left px-3 py-2 font-normal text-gray-500">Código</th>
              <th className="text-left px-3 py-2 font-normal text-gray-500">Descrição</th>
              <th className="text-left px-3 py-2 font-normal text-gray-500">Categoria</th>
              <th className="text-left px-3 py-2 font-normal text-gray-500">Classe</th>
              <th className="text-left px-3 py-2 font-normal text-gray-500">Unidade</th>
              <th className="text-right px-3 py-2 font-normal text-gray-500 w-24">Quantidade *</th>
              <th className="text-left px-3 py-2 font-normal text-gray-500">Referência</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {itensSel.map((item) => {
              const key = String(item.id);
              const ref = item.linkReferencia || '';
              return (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-mono text-gray-400 text-xs">{item.codigo}</td>
                  <td className="px-3 py-2 font-medium text-gray-700">
                    <div className="max-w-[180px] truncate" title={item.descricao}>{item.descricao}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium border ${CAT_STYLE[item.categoria] ?? ''}`}>
                      {item.categoria}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600 text-xs">{item.classe}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{item.unidade}</td>
                  <td className="px-2 py-2 w-24">
                    <Input
                      type="number" min={1} className="h-8 text-xs text-right"
                      value={selecionados[key]}
                      onChange={(e) => setSelecionados((prev) => ({
                        ...prev, [key]: Math.max(1, Number(e.target.value))
                      }))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {ref ? (
                      <a href={ref} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline max-w-[160px] truncate"
                        title={ref}>
                        <ExternalLink size={11} className="flex-shrink-0" />
                        {safeHostname(ref)}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => setSelecionados((prev) => { const n = { ...prev }; delete n[key]; return n; })}
                      className="text-gray-300 hover:text-red-400 text-base leading-none"
                    >×</button>
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

export function RFQPage() {
  const { rfqs, addRFQ, deleteRFQ } = useRFQ();
  const { itens } = useItens();

  const [modalAberto, setModalAberto] = useState(false);
  const [etapa, setEtapa] = useState<1 | 2>(1);

  const [numeroProjeto, setNumeroProjeto] = useState('');
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [dataEmissao, setDataEmissao] = useState(hoje);
  const [dataLimiteEntrega, setDataLimiteEntrega] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [selecionados, setSelecionados] = useState<Record<string, number>>({});

  const projetoValido = /^\d{4}$/.test(numeroProjeto.trim());
  const totalSel = Object.keys(selecionados).length;

  function resetForm() {
    setNumeroProjeto(''); setNomeProjeto(''); setDataEmissao(hoje);
    setDataLimiteEntrega(''); setObservacoes(''); setSelecionados({}); setEtapa(1);
  }

  function handleCriar() {
    if (!projetoValido) { toast.error('O número do projeto deve ter 4 dígitos.'); return; }
    if (totalSel === 0) { toast.error('Selecione ao menos um item.'); return; }
    if (!dataLimiteEntrega) { toast.error('Informe a data limite de entrega.'); return; }

    const rfqItens: RFQItem[] = Object.entries(selecionados).map(([id, qty]) => {
      const item = itens.find((i) => String(i.id) === id)!;
      return {
        itemId: id,
        codigo: item.codigo,
        descricao: item.descricao,
        unidade: item.unidade || 'UN',
        qty,
        referencia: item.linkReferencia || '',
      };
    });

    const nova = addRFQ({
      numeroProjeto: numeroProjeto.trim(),
      nomeProjeto: nomeProjeto.trim(),
      dataEmissao,
      dataLimiteEntrega,
      observacoes,
      itens: rfqItens,
    });

    toast.success(`${nova.numeroRFQ} criada!`);
    setModalAberto(false);
    resetForm();
    setTimeout(() => gerarPDFRFQ(nova), 300);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">RFQ</h1>
          <p className="text-sm text-gray-400">Request for Quotation — Cotação de Orçamento</p>
        </div>
        <Button onClick={() => { resetForm(); setModalAberto(true); }} className="gap-2">
          <FilePlus size={14} /> Nova RFQ
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número RFQ</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Nome do Projeto</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Entrega Limite</TableHead>
              <TableHead>Emitido em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rfqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-10">
                  Nenhuma RFQ criada ainda
                </TableCell>
              </TableRow>
            ) : rfqs.map((rfq) => (
              <TableRow key={rfq.id}>
                <TableCell className="font-semibold text-blue-700">{rfq.numeroRFQ}</TableCell>
                <TableCell className="font-mono text-gray-500">{rfq.numeroProjeto}</TableCell>
                <TableCell className="text-gray-700">{rfq.nomeProjeto || '—'}</TableCell>
                <TableCell className="text-gray-500">{rfq.itens.length} item(s)</TableCell>
                <TableCell className="text-gray-500">
                  {rfq.dataLimiteEntrega
                    ? new Date(rfq.dataLimiteEntrega + 'T00:00:00').toLocaleDateString('pt-BR')
                    : '—'}
                </TableCell>
                <TableCell className="text-gray-500">
                  {new Date(rfq.criadoEm).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" className="gap-1.5"
                      onClick={() => gerarPDFRFQ(rfq)}>
                      <FileDown size={13} /> PDF
                    </Button>
                    <Button variant="outline" size="sm"
                      className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => { if (confirm('Excluir esta RFQ?')) deleteRFQ(rfq.id); }}>
                      <Trash2 size={13} /> Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalAberto} onOpenChange={(v) => { if (!v) resetForm(); setModalAberto(v); }}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Nova RFQ {projetoValido ? `— Projeto ${numeroProjeto}` : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Nº do Projeto * <span className="text-gray-400 font-normal text-xs">(4 dígitos)</span></Label>
              <Input
                placeholder="Ex: 7025" maxLength={4}
                value={numeroProjeto}
                onChange={(e) => setNumeroProjeto(e.target.value.replace(/\D/g, ''))}
              />
              {numeroProjeto.length > 0 && !projetoValido && (
                <p className="text-xs text-red-500">Deve ter exatamente 4 dígitos.</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Nome do Projeto</Label>
              <Input placeholder="Ex: Plataforma Navantia" value={nomeProjeto}
                onChange={(e) => setNomeProjeto(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data de Emissão</Label>
              <div className="h-9 flex items-center px-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data Limite de Entrega *</Label>
              <Input type="date" value={dataLimiteEntrega}
                onChange={(e) => setDataLimiteEntrega(e.target.value)} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Observações</Label>
              <Textarea placeholder="Condições, instruções ao fornecedor..."
                className="text-sm min-h-[60px]" value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-2">
            {etapa === 1 && (
              <>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  1 — Selecione os itens para cotação
                </p>
                <SeletorItens selecionados={selecionados} setSelecionados={setSelecionados} />
                <div className="flex justify-end mt-4">
                  <Button disabled={totalSel === 0} onClick={() => setEtapa(2)}>
                    Próximo — definir quantidades ({totalSel})
                  </Button>
                </div>
              </>
            )}

            {etapa === 2 && (
              <>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  2 — Confirme as quantidades
                </p>
                <DefinirQuantidades selecionados={selecionados} setSelecionados={setSelecionados} />
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setEtapa(1)}>← Voltar</Button>
                  <Button
                    disabled={!projetoValido || totalSel === 0 || !dataLimiteEntrega}
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
