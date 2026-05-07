import React, { useState } from 'react';
import { useClientes, Cliente } from '@/context/ClientesContext';
import { useLanguage } from '@/context/LanguageContext';
import { FormField, Input, Button, SectionHeader, Card } from '@/components/ui-pf';

const EMPTY = { nome: '', doc: '', email: '', telefone: '', endereco: '' };

export function ClientesPage() {
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientes();
  const { t } = useLanguage();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');

  const upd = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const reset = () => { setEditing(null); setForm(EMPTY); };

  const startEdit = (c: Cliente) => {
    setEditing(c.id);
    setForm({ nome: c.nome, doc: c.doc, email: c.email, telefone: c.telefone, endereco: c.endereco });
  };

  const save = async () => {
    if (!form.nome.trim()) return;
    try {
      if (editing !== null) {
        await updateCliente({ id: editing, ...form });
      } else {
        await addCliente(form);
      }
      reset();
    } catch (err: any) {
      console.error(err);
      alert(`${t('error_save_db')} ${err.message}`);
    }
  };

  const remove = async (id: string) => {
    if (confirm(t('confirm_remove_client'))) {
      try {
        await deleteCliente(id);
      } catch (err: any) {
        console.error(err);
        alert(`${t('error_delete_db')} ${err.message}`);
      }
    }
  };

  const filtered = clientes.filter((c) =>
    !search ||
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.doc.includes(search)
  );

  return (
    <div className="p-6 max-w-5xl">
      <SectionHeader title={t('clients_title')} subtitle={`${clientes.length} ${t('registered_clients')}`} />

      <Card className="p-5 mb-5">
        <h2 className="text-sm font-bold text-blue-900 mb-4">
          {editing !== null ? t('edit_client') : t('new_client')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={`${t('client_name')} *`}>
            <Input value={form.nome} onChange={(e) => upd('nome', e.target.value)} placeholder={t('placeholder_client_name')} />
          </FormField>
          <FormField label={t('client_doc')}>
            <Input value={form.doc} onChange={(e) => upd('doc', e.target.value)} placeholder="00.000.000/0001-00" />
          </FormField>
          <FormField label={t('email')}>
            <Input type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} placeholder={t('placeholder_client_email')} />
          </FormField>
          <FormField label={t('phone')}>
            <Input value={form.telefone} onChange={(e) => upd('telefone', e.target.value)} placeholder="(11) 0000-0000" />
          </FormField>
          <div className="col-span-2">
            <FormField label={t('address')}>
              <Input value={form.endereco} onChange={(e) => upd('endereco', e.target.value)} placeholder={t('placeholder_address')} />
            </FormField>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save}>{editing !== null ? t('save_changes') : t('add_client')}</Button>
          {editing !== null && <Button variant="secondary" onClick={reset}>{t('cancel')}</Button>}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_client')}
            className="max-w-xs"
          />
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[t('name'), t('client_doc'), t('email'), t('phone'), t('address'), t('actions')].map((h) => (
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
                    <button onClick={() => startEdit(c)} className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded hover:bg-blue-100 transition font-medium">{t('edit')}</button>
                    <button onClick={() => remove(c.id)} className="text-xs text-red-500 border border-red-100 bg-red-50 px-2.5 py-1 rounded hover:bg-red-100 transition font-medium">{t('remove')}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">{t('no_client_registered')}</div>
        )}
      </Card>
    </div>
  );
}
