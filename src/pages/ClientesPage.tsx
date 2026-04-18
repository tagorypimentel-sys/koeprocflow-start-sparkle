import React, { useState } from 'react';
import { useClientes, Cliente } from '@/context/ClientesContext';
import { FormField, Input, Button, SectionHeader, Card } from '@/components/ui-pf';

const EMPTY = { nome: '', doc: '', email: '', telefone: '', endereco: '' };

export function ClientesPage() {
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientes();
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');

  const upd = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const reset = () => { setEditing(null); setForm(EMPTY); };

  const startEdit = (c: Cliente) => {
    setEditing(c.id);
    setForm({ nome: c.nome, doc: c.doc, email: c.email, telefone: c.telefone, endereco: c.endereco });
  };

  const save = () => {
    if (!form.nome.trim()) return;
    if (editing !== null) {
      updateCliente({ id: editing, ...form });
    } else {
      addCliente(form);
    }
    reset();
  };

  const remove = (id: number) => {
    if (confirm('Remover este cliente?')) deleteCliente(id);
  };

  const filtered = clientes.filter((c) =>
    !search ||
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.doc.includes(search)
  );

  return (
    <div className="p-6 max-w-5xl">
      <SectionHeader title="Cadastro de Clientes" subtitle={`${clientes.length} cliente(s) cadastrado(s)`} />

      <Card className="p-5 mb-5">
        <h2 className="text-sm font-bold text-blue-900 mb-4">
          {editing !== null ? 'Editar Cliente' : 'Novo Cliente'}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nome / Razão Social *">
            <Input value={form.nome} onChange={(e) => upd('nome', e.target.value)} placeholder="Nome do cliente" />
          </FormField>
          <FormField label="CNPJ / CPF">
            <Input value={form.doc} onChange={(e) => upd('doc', e.target.value)} placeholder="00.000.000/0001-00" />
          </FormField>
          <FormField label="E-mail">
            <Input type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} placeholder="email@cliente.com" />
          </FormField>
          <FormField label="Telefone">
            <Input value={form.telefone} onChange={(e) => upd('telefone', e.target.value)} placeholder="(11) 0000-0000" />
          </FormField>
          <div className="col-span-2">
            <FormField label="Endereço">
              <Input value={form.endereco} onChange={(e) => upd('endereco', e.target.value)} placeholder="Endereço completo" />
            </FormField>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save}>{editing !== null ? 'Salvar Alterações' : 'Adicionar Cliente'}</Button>
          {editing !== null && <Button variant="secondary" onClick={reset}>Cancelar</Button>}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou documento..."
            className="max-w-xs"
          />
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Nome', 'CNPJ/CPF', 'E-mail', 'Telefone', 'Endereço', 'Ações'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{c.nome}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.doc || '—'}</td>
                <td className="px-4 py-3 text-blue-600 text-xs">{c.email || '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{c.telefone || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.endereco || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(c)} className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded hover:bg-blue-100 transition font-medium">Editar</button>
                    <button onClick={() => remove(c.id)} className="text-xs text-red-500 border border-red-100 bg-red-50 px-2.5 py-1 rounded hover:bg-red-100 transition font-medium">Remover</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">Nenhum cliente cadastrado</div>
        )}
      </Card>
    </div>
  );
}
