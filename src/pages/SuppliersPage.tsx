import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Supplier } from '@/types';
import { FormField, Input, Button, SectionHeader, Card } from '@/components/ui-pf';

export function SuppliersPage() {
  const { suppliers, setSuppliers } = useApp();
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', cnpj: '', contact: '', phone: '', address: '' });
  const [search, setSearch] = useState('');

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const reset = () => { setEditing(null); setForm({ name: '', cnpj: '', contact: '', phone: '', address: '' }); };

  const startEdit = (s: Supplier) => {
    setEditing(s.id);
    setForm({ name: s.name, cnpj: s.cnpj, contact: s.contact, phone: s.phone, address: s.address || '' });
  };

  const save = () => {
    if (!form.name || !form.cnpj) return;
    if (editing !== null) {
      setSuppliers(suppliers.map((s) => s.id === editing ? { ...s, ...form } : s));
    } else {
      setSuppliers([...suppliers, { id: Date.now(), ...form }]);
    }
    reset();
  };

  const remove = (id: number) => {
    if (confirm('Remover este fornecedor?')) setSuppliers(suppliers.filter((s) => s.id !== id));
  };

  const filtered = suppliers.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cnpj.includes(search)
  );

  return (
    <div className="p-6 max-w-5xl">
      <SectionHeader title="Cadastro de Fornecedores" subtitle={`${suppliers.length} fornecedores cadastrados`} />

      <Card className="p-5 mb-5">
        <h2 className="text-sm font-bold text-blue-900 mb-4">{editing !== null ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Razão Social *">
            <Input value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="Nome da empresa" />
          </FormField>
          <FormField label="CNPJ *">
            <Input value={form.cnpj} onChange={(e) => upd('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
          </FormField>
          <FormField label="E-mail">
            <Input type="email" value={form.contact} onChange={(e) => upd('contact', e.target.value)} placeholder="email@empresa.com" />
          </FormField>
          <FormField label="Telefone">
            <Input value={form.phone} onChange={(e) => upd('phone', e.target.value)} placeholder="(11) 0000-0000" />
          </FormField>
          <div className="col-span-2">
            <FormField label="Endereço">
              <Input value={form.address} onChange={(e) => upd('address', e.target.value)} placeholder="Endereço completo" />
            </FormField>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save}>{editing !== null ? 'Salvar Alterações' : 'Adicionar Fornecedor'}</Button>
          {editing !== null && <Button variant="secondary" onClick={reset}>Cancelar</Button>}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por razão social ou CNPJ..."
            className="max-w-xs"
          />
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Razão Social', 'CNPJ', 'E-mail', 'Telefone', 'Endereço', 'Ações'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.cnpj}</td>
                <td className="px-4 py-3 text-blue-600 text-xs">{s.contact}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{s.phone}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{s.address || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(s)} className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded hover:bg-blue-100 transition font-medium">Editar</button>
                    <button onClick={() => remove(s.id)} className="text-xs text-red-500 border border-red-100 bg-red-50 px-2.5 py-1 rounded hover:bg-red-100 transition font-medium">Remover</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">Nenhum fornecedor encontrado</div>
        )}
      </Card>
    </div>
  );
}
