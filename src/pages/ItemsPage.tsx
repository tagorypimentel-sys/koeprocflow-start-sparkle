import { useState } from 'react';
import { useItens } from '@/context/ItensContext';
import { Item, CATEGORIAS, CLASSES, TIPOS, Categoria, Classe, Tipo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, PackagePlus, Upload } from 'lucide-react';
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
};

const CATEGORIA_COLOR: Record<string, string> = {
  Tools: 'bg-blue-50 text-blue-700 border-blue-200',
  Consumables: 'bg-amber-50 text-amber-700 border-amber-200',
};

const TIPO_COLOR: Record<string, string> = {
  OPEX: 'bg-green-50 text-green-700 border-green-200',
  CAPEX: 'bg-purple-50 text-purple-700 border-purple-200',
};

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

  const filtered = itens.filter((i) =>
    !search ||
    i.codigo.toLowerCase().includes(search.toLowerCase()) ||
    i.descricao.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Itens</h1>
          <p className="text-sm text-gray-500 mt-0.5">{itens.length} itens cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <Upload size={15} />
            Importar
          </Button>
          <Button onClick={openNew} className="gap-2">
            <PackagePlus size={15} />
            Novo Item
          </Button>
        </div>
      </div>

      <div className="mb-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código ou descrição..."
          className="max-w-xs"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Preço Unit.</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-10">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-gray-500 font-mono text-sm">{item.codigo || '—'}</TableCell>
                  <TableCell className="font-medium">{item.descricao}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORIA_COLOR[item.categoria] ?? ''}`}>
                      {item.categoria}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">{item.classe}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TIPO_COLOR[item.tipo] ?? ''}`}>
                      {item.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{item.unidade || '—'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {item.precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="gap-1.5">
                        <Pencil size={13} /> Editar
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Excluir
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
              <Label>Preço Unitário (R$)</Label>
              <Input
                type="number" min={0} step={0.01} placeholder="0,00"
                value={form.precoUnitario}
                onChange={(e) => setField('precoUnitario', Number(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
