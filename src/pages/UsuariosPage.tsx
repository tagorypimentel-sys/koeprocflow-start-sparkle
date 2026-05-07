import React, { useState } from 'react';
import { z } from 'zod';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { User, UserRole } from '@/types';
import { ROLE_LABELS } from '@/lib/constants';
import {
  SectionHeader, Card, Button, Input, Select, FormField,
  Avatar, RoleBadge, EmptyState, Table,
} from '@/components/ui-pf';

const ROLES: UserRole[] = ['solicitante', 'aprovador', 'conferente', 'financeiro'];

// schema moved to inside component to use t()

type FormState = { name: string; email: string; role: UserRole };
const EMPTY: FormState = { name: '', email: '', role: 'solicitante' };

export function UsuariosPage() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();
  const { t } = useLanguage();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  const userSchema = z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: t('error_name_min') })
      .max(100, { message: t('error_name_max') }),
    email: z
      .string()
      .trim()
      .email({ message: t('error_email_invalid') })
      .max(255, { message: t('error_email_max') }),
    role: z.enum(['solicitante', 'aprovador', 'conferente', 'financeiro']),
  });

  const filtered = filterRole === 'all' ? users : users.filter((u) => u.role === filterRole);

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = userSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      result.error.issues.forEach((i) => {
        const k = i.path[0] as keyof FormState;
        if (!fieldErrors[k]) fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Email uniqueness
    const emailLower = result.data.email.toLowerCase();
    const dup = users.find(
      (u) => u.email.toLowerCase() === emailLower && u.id !== editingId
    );
    if (dup) {
      setErrors({ email: t('error_email_exists') });
      return;
    }

    const data = result.data as FormState;
    if (editingId) {
      updateUser(editingId, data);
    } else {
      addUser(data);
    }
    resetForm();
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, role: u.role });
    setErrors({});
  };

  const handleDelete = (u: User) => {
    if (u.id === currentUser.id) {
      alert(t('error_delete_current_user'));
      return;
    }
    if (confirm(`${t('confirm_delete_user')} "${u.name}"?`)) {
      deleteUser(u.id);
      if (editingId === u.id) resetForm();
    }
  };

  return (
    <div className="p-6 max-w-6xl">
      <SectionHeader
        title={t('users_title')}
        subtitle={t('users_subtitle')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="p-5 lg:col-span-1 h-fit">
          <h2 className="text-sm font-bold text-gray-800 mb-4">
            {editingId ? t('edit_user') : t('new_user')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <FormField label={t('name')} required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
                placeholder={t('placeholder_user_name')}
              />
              {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
            </FormField>

            <FormField label={t('email')} required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
                placeholder="usuario@empresa.com"
              />
              {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
            </FormField>

            <FormField label={t('role')} required>
              <Select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </Select>
              {errors.role && <p className="text-[11px] text-red-600 mt-1">{errors.role}</p>}
            </FormField>

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="primary" size="md" className="flex-1">
                {editingId ? t('save_changes') : t('add_button')}
              </Button>
              {editingId && (
                <Button type="button" variant="secondary" size="md" onClick={resetForm}>
                  {t('cancel')}
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* List */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">
              {filtered.length} {t('user')}{filtered.length === 1 ? '' : 's'}
            </h2>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
              className="w-auto"
            >
              <option value="all">{t('all_roles')}</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState message={t('no_user_found')} icon="👤" />
          ) : (
            <Table headers={[t('user'), t('email'), t('role'), t('actions')]}>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={u.avatar} size={32} colorIndex={u.id} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {u.name}
                          {u.id === currentUser.id && (
                            <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                              {t('you_badge')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(u)}>
                        {t('edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(u)}
                        disabled={u.id === currentUser.id}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
