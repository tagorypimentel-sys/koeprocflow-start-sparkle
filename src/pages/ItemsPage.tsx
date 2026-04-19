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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Pencil, Trash2, PackagePlus, Upload, ExternalLink, Search, MoreVertical,
} from 'lucide-react';
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
  Tools: 'bg-blue-50 text-blue-800 border-blue-200',
  Consumables: 'bg-amber-50 text-amber-800 border-amber-200',
};

const TIPO_STYLE: Record<string, string> = {
  OPEX: 'bg-green-50 text-green-800 border-green-200',
  CAPEX: 'bg-purple-50 text-purple-800 border-purple-200',
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
    <div className="flex flex-col h-full bg-gray-50 font-sans">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-gray-900">Itens</h1>
          <span className="text-sm text-gray-400">{itens.length} cadastrados</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Upload size={13} />
            Importar Excel
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white bg-gray-900 hover:bg-gray-800 transition-colors"
          >
            <PackagePlus size={13} />
            Novo Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-gray-100 px-5 py-2.5 flex-shrink-0">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição, código, classe ou marca..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: 900 }}>
          <thead>
            <tr className="bg-white border-b border-gray-100 sticky top-0 z-10">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-20">Código</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 min-w-[200px]">Descrição</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-32">Marca</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-28">Categoria</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-28">Classe</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-20">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-20">Unidade</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-28">Preço Unit. (EUR)</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-40">Link Referência</th>
              <th className="w-10 px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-gray-400">{item.codigo || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900 leading-snug">{item.descricao}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-500 text-xs">{item.marca || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      CAT_STYLE[item.categoria] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {item.categoria}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-600 text-xs">{item.classe}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      TIPO_STYLE[item.tipo] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {item.tipo}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-600 text-xs">{item.unidade || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-700 text-xs font-medium">
                    {item.precoUnitario > 0
                      ? `€${item.precoUnitario.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {item.linkReferencia ? (
                    <a
                      href={item.linkReferencia}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.linkReferencia}
                      className="flex items-center gap-1.5 text-blue-600 text-xs hover:text-blue-800 transition-colors max-w-[160px] truncate"
                    >
                      <ExternalLink size={12} className="flex-shrink-0" />
                      <span className="truncate">{safeHostname(item.linkReferencia)}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-2 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-7 h-7 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                        <MoreVertical size={13} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => openEdit(item)} className="gap-2 text-sm">
                        <Pencil size={13} /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(item.id)}
                        className="gap-2 text-sm text-red-600 focus:text-red-700"
                      >
                        <Trash2 size={13} /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search size={20} />
            <p className="mt-2 text-sm">
              {itens.length === 0 ? 'Nenhum item cadastrado' : 'Nenhum resultado para a busca'}
            </p>
          </div>
        )}
      </div>

      {/* Dialog Novo/Editar */}
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
              <Label>Preço Unitário (EUR)</Label>
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

      {/* Dialog Importar */}
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
