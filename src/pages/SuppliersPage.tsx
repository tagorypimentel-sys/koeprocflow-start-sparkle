import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Supplier } from '@/types';
import { FormField, Input, Button, SectionHeader, Card } from '@/components/ui-pf';

export function SuppliersPage() {
  const { suppliers, setSuppliers } = useApp();
  const { t } = useLanguage();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', cnpj: '', contact: '', phone: '', address: '' });
  const [search, setSearch] = useState('');

  const upd = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const reset = () => { setEditing(null); setForm({ name: '', cnpj: '', contact: '', phone: '', address: '' }); };

  const startEdit = (s: Supplier) => {
    setEditing(s.id);
    setForm({ name: s.name, cnpj: s.cnpj, contact: s.contact, phone: s.phone, address: s.address || '' });
  };

  const save = async () => {
    if (!form.name || !form.cnpj) return;
    try {
      if (editing !== null) {
        const { error } = await supabase.from('suppliers').update(form).eq('id', editing);
        if (error) throw error;
        setSuppliers(suppliers.map((s) => s.id === editing ? { ...s, ...form } : s));
      } else {
        const { data, error } = await supabase.from('suppliers').insert([form]).select().single();
        if (error) throw error;
        setSuppliers([...suppliers, data as Supplier]);
      }
      reset();
    } catch (err: any) {
      console.error(err);
      alert(`${t('error_save_db')} ${err.message}`);
    }
  };

  const remove = async (id: string) => {
    if (confirm(t('confirm_remove_supplier'))) {
      try {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
        setSuppliers(suppliers.filter((s) => s.id !== id));
      } catch (err: any) {
        console.error(err);
        alert(`${t('error_delete_db')} ${err.message}`);
      }
    }
  };

  const filtered = suppliers.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cnpj.includes(search)
  );

  return (
    <div className="p-6 max-w-5xl">
      <SectionHeader title={t('suppliers_title')} subtitle={`${suppliers.length} ${t('registered_suppliers')}`} />

      <Card className="p-5 mb-5">
        <h2 className="text-sm font-bold text-blue-900 mb-4">{editing !== null ? t('edit_supplier') : t('new_supplier')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={`${t('company_name')} *`}>
            <Input value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder={t('placeholder_company')} />
          </FormField>
          <FormField label={`${t('cnpj')} *`}>
            <Input value={form.cnpj} onChange={(e) => upd('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
          </FormField>
          <FormField label={t('email')}>
            <Input type="email" value={form.contact} onChange={(e) => upd('contact', e.target.value)} placeholder="email@empresa.com" />
          </FormField>
          <FormField label={t('phone')}>
            <Input value={form.phone} onChange={(e) => upd('phone', e.target.value)} placeholder="(11) 0000-0000" />
          </FormField>
          <div className="col-span-2">
            <FormField label={t('address')}>
              <Input value={form.address} onChange={(e) => upd('address', e.target.value)} placeholder={t('placeholder_address')} />
            </FormField>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save}>{editing !== null ? t('save_changes') : t('add_supplier')}</Button>
          {editing !== null && <Button variant="secondary" onClick={reset}>{t('cancel')}</Button>}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_supplier')}
            className="max-w-xs"
          />
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[t('company_name'), t('cnpj'), t('email'), t('phone'), t('address'), t('actions')].map((h) => (
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
                    <button onClick={() => startEdit(s)} className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-2.5 py-1 rounded hover:bg-blue-100 transition font-medium">{t('edit')}</button>
                    <button onClick={() => remove(s.id)} className="text-xs text-red-500 border border-red-100 bg-red-50 px-2.5 py-1 rounded hover:bg-red-100 transition font-medium">{t('remove')}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">{t('no_supplier_found')}</div>
        )}
      </Card>
    </div>
  );
}
