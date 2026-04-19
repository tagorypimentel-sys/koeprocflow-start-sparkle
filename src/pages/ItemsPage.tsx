import { useState } from 'react';
import { useItens } from '@/context/ItensContext';
import { Item, CATEGORIAS, CLASSES, TIPOS, Categoria, Classe, Tipo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, PackagePlus, Upload, ExternalLink } from 'lucide-react';
import ImportarItens from '@/components/ImportarItens';

const EMPTY_FORM = {
  codigo: '',
  descricao: '',
  marca: '',
  unidade: '',
  precoUnitario: 0,
  categoria: '' as Categoria | '',
  classe: '' as Classe | '',
  tipo: '' as Tipo | '',
  linkReferencia: '',
};

const CAT_STYLE: Record<string, string> = {
  Tools: 'bg-blue-50 text-blue-700 border-blue-200',
  Consumables: 'bg-amber-50 text-amber-700 border-amber-200',
};

const TIPO_STYLE: Record<string, string> = {
  OPEX: 'bg-green-50 text-green-700 border-green-200',
  CAPEX: 'bg-purple-50 text-purple-700 border-purple-200',
};

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function ItemsPage() {
  const { itens, addItem, updateItem, deleteItem } = useItens();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setForm({
      codigo: item.codigo,
      descricao: item.descricao,
      marca: item.marca ?? '',
      unidade: item.unidade,
      precoUnitario: item.precoUnitario,
      categoria: item.categoria,
      classe: item.classe,
      tipo: item.tipo,
      linkReferencia: item.linkReferencia ?? '',
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.descricao.trim()) { toast.error('Informe a descrição do item.'); return; }
    if (!form.categoria) { toast.error('Selecione a categoria.'); return; }
    if (!form.classe) { toast.error('Selecione a classe.'); return; }
    if (!form.tipo) { toast.error('Selecione o tipo.'); return; }

    const data = {
      codigo: form.codigo.trim(),
      descricao: form.descricao.trim(),
      marca: form.marca.trim() || undefined,
      unidade: form.unidade.trim() || 'UN',
      precoUnitario: Number(form.precoUnitario) || 0,
      categoria: form.categoria as Categoria,
      classe: form.classe as Classe,
      tipo: form.tipo as Tipo,
      linkReferencia: form.linkReferencia.trim() || undefined,
    };

    if (editing) {
      updateItem({ ...editing, ...data });
      toast.success('Item atualizado!');
    } else {
      addItem(data);
      toast.success('Item cadastrado!');
    }
    setOpen(false);
  }

  function handleDelete(id: number) {
    if (!window.confirm('Deseja excluir este item?')) return;
    deleteItem(id);
    toast.success('Item removido.');
  }

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: typeof EMPTY_FORM[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const q = search.toLowerCase();
  const filtered = itens.filter((i) =>
    !q ||
    i.codigo.toLowerCase().includes(q) ||
    i.descricao.toLowerCase().includes(q) ||
    i.classe.toLowerCase().includes(q) ||
    (i.marca?.toLowerCase().includes(q) ?? false)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-medium text-gray-900">
          Itens <span className="text-sm font-normal text-gray-400 ml-1">{itens.length} cadastrados</span>
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <Upload size={14} /> Importar Excel
          </Button>
          <Button onClick={openNew} className="gap-2">
            <PackagePlus size={14} /> Novo Item
          </Button>
        </div>
      </div>

      <div className="mb-3">
        <Input
          placeholder="Buscar por descrição, código, classe ou marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Preço Unit. (USD)</TableHead>
              <TableHead>Link Referência</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-400 py-10">
                  {itens.length === 0 ? 'Nenhum item cadastrado' : 'Nenhum resultado para a busca'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-gray-400 font-mono text-xs">{item.codigo || '—'}</TableCell>
                  <TableCell className="font-medium text-sm">{item.descricao}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{item.marca || '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${CAT_STYLE[item.categoria] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {item.categoria}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">{item.classe}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${TIPO_STYLE[item.tipo] ?? ''}`}>
                      {item.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{item.unidade || '—'}</TableCell>
                  <TableCell className="text-right font-medium text-sm">
                    {item.precoUnitario > 0
                      ? `$${item.precoUnitario.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {item.linkReferencia ? (
                      <a
                        href={item.linkReferencia}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline max-w-[160px] truncate"
                        title={item.linkReferencia}
                      >
                        <ExternalLink size={11} className="flex-shrink-0" />
                        {safeHostname(item.linkReferencia)}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="gap-1">
                        <Pencil size={12} /> Editar
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 size={12} /> Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar item' : 'Novo item'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Código</Label>
              <Input placeholder="Ex: IT-001" value={form.codigo} onChange={(e) => setField('codigo', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Unidade</Label>
              <Input placeholder="Ex: UN, CX, KG" value={form.unidade} onChange={(e) => setField('unidade', e.target.value)} />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Descrição *</Label>
              <Input placeholder="Descrição do item" value={form.descricao} onChange={(e) => setField('descricao', e.target.value)} />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Marca</Label>
              <Input placeholder="Ex: Petzl, Bosch (opcional)" value={form.marca} onChange={(e) => setField('marca', e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Categoria *</Label>
              <Select value={form.categoria} onValueChange={(v) => setField('categoria', v as Categoria)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => setField('tipo', v as Tipo)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Classe *</Label>
              <Select value={form.classe} onValueChange={(v) => setField('classe', v as Classe)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Preço Unitário (USD)</Label>
              <Input
                type="number" min={0} step={0.01} placeholder="0.00"
                value={form.precoUnitario}
                onChange={(e) => setField('precoUnitario', Number(e.target.value))}
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Link de Referência</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="url" placeholder="https://fornecedor.com/produto"
                  value={form.linkReferencia}
                  onChange={(e) => setField('linkReferencia', e.target.value)}
                />
                {form.linkReferencia && (
                  <a
                    href={form.linkReferencia}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-400">URL de referência para o fornecedor</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar itens</DialogTitle>
          </DialogHeader>
          <ImportarItens onClose={() => setImportOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
