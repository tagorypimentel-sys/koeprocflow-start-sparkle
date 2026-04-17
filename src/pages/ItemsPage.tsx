import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Item } from '@/types';
import { FormField, Input, Select, Button, SectionHeader, Card } from '@/components/ui-pf';

export function ItemsPage() {
  const { items, setItems } = useApp();
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ code: '', name: '', unit: 'UN', price: '' });
  const [search, setSearch] = useState('');

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => { setEditing(null); setForm({ code: '', name: '', unit: 'UN', price: '' }); };

  const startEdit = (item: Item) => {
    setEditing(item.id);
    setForm({ code: item.code, name: item.name, unit: item.unit, price: String(item.price) });
  };

  const save = () => {
    if (!form.code || !form.name || !form.price) return;
    if (editing !== null) {
      setItems(items.map((i) => i.id === editing ? { ...i, ...form, price: parseFloat(form.price) } : i));
    } else {
      setItems([...items, { id: Date.now(), ...form, price: parseFloat(form.price) }]);
    }
    reset();
  };

  const remove = (id: number) => {
    if (confirm('Remover este item?')) setItems(items.filter((i) => i.id !== id));
  };

  const filtered = items.filter((i) =>
    !search ||
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl">
      <SectionHeader title="Cadastro de Itens" subtitle={`${items.length} itens cadastrados`} />

      {/* Form */}
      <Card className="p-5 mb-5">
        <h2 className="text-sm font-bold text-blue-900 mb-4">{editing !== null ? 'Editar Item' : 'Novo Item'}</h2>
        <div className="grid grid-cols-5 gap-3 items-end">
          <FormField label="Código *">
            <Input value={form.code} onChange={(e) => upd('code', e.target.value)} placeholder="IT001" />
          </FormField>
          <div className="col-span-2">
            <FormField label="Descrição *">
              <Input value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="Nome do item" />
            </FormField>
          </div>
          <FormField label="Unidade">
            <Select value={form.unit} onChange={(e) => upd('unit', e.target.value)}>
              {['UN', 'PCT', 'CX', 'KG', 'LT', 'MT', 'M2', 'HR'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Preço Unit. (R$) *">
            <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => upd('price', e.target.value)} placeholder="0,00" />
          </FormField>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save}>{editing !== null ? 'Salvar Alterações' : 'Adicionar Item'}</Button>
          {editing !== null && <Button variant="secondary" onClick={reset}>Cancelar</Button>}
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código ou descrição..."
            className="max-w-xs"
          />
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Código', 'Descrição', 'Unidade', 'Preço Unit.', 'Ações'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.code}</td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{item.unit}</td>
                <td className="px-4 py-3 font-bold text-blue-900">R$ {item.price.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(item)} className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded hover:bg-blue-100 transition font-medium">Editar</button>
                    <button onClick={() => remove(item.id)} className="text-xs text-red-500 border border-red-100 bg-red-50 px-2.5 py-1 rounded hover:bg-red-100 transition font-medium">Remover</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">Nenhum item encontrado</div>
        )}
      </Card>
    </div>
  );
}
