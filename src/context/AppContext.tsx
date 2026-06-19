import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { User, Item, Supplier, PurchaseRequest } from '@/types';
import { gerarPDFPO, POData } from '@/lib/gerarPDFPO';
import { gerarNumeroPO } from '@/lib/numeracaoRC';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (u: User) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  addUser: (u: { name: string; email: string; role: string; avatar?: string }) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  reloadUsers: () => Promise<void>;
  items: Item[];
  setItems: (items: Item[]) => void;
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  rcs: PurchaseRequest[];
  setRcs: (rcs: PurchaseRequest[]) => void;
  updateRC: (id: string, updates: Partial<PurchaseRequest>) => void;
  addRC: (rc: PurchaseRequest) => void;
  calcRC: (rc: PurchaseRequest) => { subtotal: number; taxAmt: number; total: number };
  approveRC: (id: string, overrideLineItems?: PurchaseRequest['lineItems']) => void;
  returnRC: (id: string, reason?: string) => void;
  resubmitRC: (id: string) => void;
  selectedRC: PurchaseRequest | null;
  setSelectedRC: (rc: PurchaseRequest | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const EMPTY_USER: User = { id: '', name: '', email: '', role: '', avatar: '' };

function deriveAvatar(name: string): string {
  return (
    name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '??'
  );
}

async function fetchUsers(): Promise<User[]> {
  const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
    supabase.from('profiles').select('id, name, email, avatar').order('name'),
    (supabase.from('user_roles') as any).select('user_id, role'),
  ]);
  if (pErr) throw pErr;
  if (rErr) throw rErr;
  const roleMap = new Map<string, string[]>();
  ((roles as any[]) ?? []).forEach((r: any) => {
    const arr = roleMap.get(r.user_id) ?? [];
    arr.push(r.role);
    roleMap.set(r.user_id, arr);
  });
  return ((profiles as any[]) ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    avatar: p.avatar ?? deriveAvatar(p.name),
    role: (roleMap.get(p.id) ?? []).join(','),
  }));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User>(EMPTY_USER);
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rcs, setRcs] = useState<PurchaseRequest[]>([]);
  const [selectedRC, setSelectedRC] = useState<PurchaseRequest | null>(null);

  const ensureCurrentUser = async (list: User[]) => {
    if (!authUser) return;
    let me = list.find((u) => u.id === authUser.id);
    if (!me) {
      // Profile missing - create one and fetch roles directly
      const name =
        (authUser.user_metadata as any)?.name ||
        authUser.email?.split('@')[0] ||
        'Usuário';
      const email = authUser.email || '';
      const avatar = deriveAvatar(name);
      try {
        await supabase
          .from('profiles')
          .upsert({ id: authUser.id, name, email, avatar }, { onConflict: 'id' });
      } catch (e) {
        console.error('Erro ao criar profile:', e);
      }
      const { data: rolesData } = await (supabase.from('user_roles') as any)
        .select('role')
        .eq('user_id', authUser.id);
      const roles = ((rolesData as any[]) ?? []).map((r: any) => r.role);
      if (roles.length === 0) roles.push('solicitante');
      me = { id: authUser.id, name, email, avatar, role: roles.join(',') };
      setUsers((prev) => {
        if (prev.some((u) => u.id === me!.id)) return prev;
        return [...prev, me!].sort((a, b) => a.name.localeCompare(b.name));
      });
    }
    setCurrentUser(me);
  };

  const reloadUsers = async () => {
    try {
      const list = await fetchUsers();
      setUsers(list);
      await ensureCurrentUser(list);
    } catch (e) {
      console.error('Erro carregando usuários:', e);
    }
  };

  useEffect(() => {
    supabase.from('suppliers').select('*').order('name').then(({ data, error }) => {
      if (!error && data) setSuppliers(data as Supplier[]);
    });
  }, []);

  useEffect(() => {
    if (!authUser) {
      setUsers([]);
      setCurrentUser(EMPTY_USER);
      return;
    }
    reloadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  const addUser: AppContextType['addUser'] = async (u) => {
    const roles = u.role.split(',').map((r) => r.trim()).filter(Boolean);
    const avatar = (u.avatar && u.avatar.trim()) || deriveAvatar(u.name);
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'create', name: u.name, email: u.email, avatar, roles },
    });
    if (error) throw new Error(error.message || 'Erro ao criar usuário');
    if (data?.error) throw new Error(data.error);
    await reloadUsers();
    const created: User = {
      id: data?.id ?? '',
      name: u.name,
      email: u.email,
      role: roles.join(','),
      avatar,
    };
    return created;
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const payload: any = { action: 'set_roles', id };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.avatar !== undefined) payload.avatar = updates.avatar;
    payload.roles = (updates.role ?? '').split(',').map((r) => r.trim()).filter(Boolean);
    const { data, error } = await supabase.functions.invoke('admin-users', { body: payload });
    if (error) throw new Error(error.message || 'Erro ao atualizar');
    if (data?.error) throw new Error(data.error);
    await reloadUsers();
  };

  const deleteUser = async (id: string) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete', id },
    });
    if (error) throw new Error(error.message || 'Erro ao excluir');
    if (data?.error) throw new Error(data.error);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const updateRC = (id: string, updates: Partial<PurchaseRequest>) => {
    setRcs((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    setSelectedRC((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
  };

  const addRC = (rc: PurchaseRequest) => {
    setRcs((prev) => [rc, ...prev]);
  };

  const calcRC = (rc: PurchaseRequest) => {
    const subtotal = rc.lineItems.reduce((s, li) => {
      return s + li.unitPrice * li.qty * (1 - li.discount / 100);
    }, 0);
    const taxAmt = subtotal * (rc.tax / 100);
    return { subtotal, taxAmt, total: subtotal + taxAmt };
  };

  const approveRC = (id: string, overrideLineItems?: PurchaseRequest['lineItems']) => {
    const rc = rcs.find((r) => r.id === id);
    if (!rc) return;
    const finalItems = overrideLineItems ?? rc.lineItems;
    const poNumber = gerarNumeroPO(rc.projectNumber, rcs);
    const approvedAt = new Date().toISOString().split('T')[0];
    updateRC(id, { status: 'aguardando_confirmacao_entrega', poNumber, approvedAt, lineItems: finalItems });
    try {
      const rcForCalc = { ...rc, lineItems: finalItems };
      const { subtotal } = calcRC(rcForCalc);
      const poData: POData = {
        numeroPO: poNumber,
        numeroRC: rc.id,
        numeroProjeto: rc.projectNumber,
        cliente: rc.projectClient || '',
        fornecedor: rc.supplier.name,
        cnpj: rc.supplier?.cnpj ?? '',
        solicitante: rc.requester.name,
        aprovador: rc.approver?.name || '',
        enderecoEntrega: rc.deliveryAddress || '',
        modoEntrega: rc.deliveryMode || '',
        imposto: rc.tax,
        observacoes: rc.notes || '',
        criadoEm: approvedAt,
        itens: finalItems.map((li) => ({
          codigo: li.item.codigo,
          descricao: li.item.descricao,
          categoria: li.item.categoria || '',
          classe: li.item.classe || '',
          tipo: li.item.tipo || '',
          unidade: li.item.unidade || 'un',
          qty: li.qty,
          valorUnitario: li.unitPrice,
          desconto: li.discount,
        })),
      };
      gerarPDFPO(poData);
    } catch (e) {
      console.error('Erro ao gerar PDF do PO:', e);
    }
  };

  const returnRC = (id: string, reason?: string) => {
    updateRC(id, {
      status: 'devolvida',
      rejectedAt: new Date().toISOString().split('T')[0],
      rejectionReason: reason,
    });
  };

  const resubmitRC = (id: string) => {
    updateRC(id, {
      status: 'aguardando_aprovacao',
      rejectionReason: undefined,
      rejectedAt: undefined,
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser, setCurrentUser, users, setUsers,
        addUser, updateUser, deleteUser, reloadUsers,
        items, setItems, suppliers, setSuppliers, rcs, setRcs, updateRC, addRC,
        calcRC, approveRC, returnRC, resubmitRC, selectedRC, setSelectedRC,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
