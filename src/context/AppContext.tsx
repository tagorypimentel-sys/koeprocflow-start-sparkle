import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  User, Item, Supplier, PurchaseRequest, LineItem, RCStatus,
  Categoria, Classe, Tipo,
} from '@/types';
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
  reloadRcs: () => Promise<void>;
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
  return name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '??';
}

function toDateOnly(value?: string | null): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
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

/* ----- PurchaseRequest <-> DB row mapping ----- */

function rowToLineItem(
  row: any,
  lineIdx: number,
  itemsCatalog: Item[],
): LineItem {
  const fromCatalog = row.item_id ? itemsCatalog.find((i) => i.id === row.item_id) : undefined;
  const item: Item = fromCatalog ?? {
    id: row.item_id ?? `snap-${row.id}`,
    codigo: row.item_codigo ?? (row.is_servico ? 'SVC' : ''),
    descricao: row.item_descricao ?? row.servico_descricao ?? '',
    marca: row.item_marca ?? undefined,
    unidade: row.item_unidade ?? 'UN',
    precoUnitario: Number(row.unit_price ?? 0),
    categoria: (row.item_categoria ?? 'Tools') as Categoria,
    classe: (row.item_classe ?? 'General') as Classe,
    tipo: (row.item_tipo ?? 'OPEX') as Tipo,
    linkReferencia: row.item_link_referencia ?? undefined,
  };
  return {
    id: lineIdx + 1,
    item,
    qty: Number(row.qty ?? 0),
    unitPrice: Number(row.unit_price ?? 0),
    discount: Number(row.discount ?? 0),
    isServico: !!row.is_servico,
  };
}

function lineItemToRow(rcId: string, li: LineItem) {
  return {
    purchase_request_id: rcId,
    item_id: li.isServico || String(li.item.id).startsWith('snap-') ? null : li.item.id,
    qty: li.qty,
    unit_price: li.unitPrice,
    discount: li.discount,
    is_servico: !!li.isServico,
    servico_descricao: li.isServico ? li.item.descricao : null,
    item_codigo: li.item.codigo,
    item_descricao: li.item.descricao,
    item_marca: li.item.marca ?? null,
    item_unidade: li.item.unidade,
    item_categoria: li.item.categoria,
    item_classe: li.item.classe,
    item_tipo: li.item.tipo,
    item_link_referencia: li.item.linkReferencia ?? null,
  };
}

function buildPR(
  header: any,
  itemRows: any[],
  suppliers: Supplier[],
  users: User[],
  itemsCatalog: Item[],
): PurchaseRequest {
  const supplier = suppliers.find((s) => s.id === header.supplier_id) ?? {
    id: header.supplier_id ?? '',
    name: '—',
    cnpj: '',
    contact: '',
    phone: '',
  };
  const approver = users.find((u) => u.id === header.approver_id) ?? {
    id: header.approver_id ?? '',
    name: '—', email: '', role: '', avatar: '',
  };
  const requester = users.find((u) => u.id === header.requester_id) ?? {
    id: header.requester_id ?? '',
    name: '—', email: '', role: '', avatar: '',
  };
  return {
    id: header.id,
    projectNumber: header.project_number,
    projectClient: header.project_client,
    supplier,
    approver,
    requester,
    status: header.status as RCStatus,
    createdAt: toDateOnly(header.created_at) ?? new Date().toISOString().slice(0, 10),
    approvedAt: toDateOnly(header.approved_at),
    rejectedAt: toDateOnly(header.rejected_at),
    paidAt: toDateOnly(header.paid_at),
    rejectionReason: header.rejection_reason ?? undefined,
    discount: Number(header.discount ?? 0),
    tax: Number(header.tax ?? 0),
    poNumber: header.po_number,
    invoice: header.invoice_data ?? null,
    paid: !!header.paid,
    lineItems: (itemRows ?? []).map((r, i) => rowToLineItem(r, i, itemsCatalog)),
    notes: header.notes ?? undefined,
    deliveryMode: (header.delivery_mode as 'entrega' | 'retirada') ?? 'entrega',
    deliveryCarrier: (header.delivery_carrier as any) ?? undefined,
    deliveryAddress: header.delivery_address ?? undefined,
  };
}

function prHeaderUpdates(updates: Partial<PurchaseRequest>): Record<string, any> {
  const out: Record<string, any> = {};
  if (updates.projectNumber !== undefined) out.project_number = updates.projectNumber;
  if (updates.projectClient !== undefined) out.project_client = updates.projectClient;
  if (updates.supplier !== undefined) out.supplier_id = updates.supplier.id || null;
  if (updates.approver !== undefined) out.approver_id = updates.approver.id || null;
  if (updates.requester !== undefined) out.requester_id = updates.requester.id;
  if (updates.status !== undefined) out.status = updates.status;
  if (updates.discount !== undefined) out.discount = updates.discount;
  if (updates.tax !== undefined) out.tax = updates.tax;
  if (updates.poNumber !== undefined) out.po_number = updates.poNumber;
  if (updates.invoice !== undefined) out.invoice_data = updates.invoice;
  if (updates.paid !== undefined) out.paid = updates.paid;
  if (updates.notes !== undefined) out.notes = updates.notes;
  if (updates.deliveryMode !== undefined) out.delivery_mode = updates.deliveryMode;
  if (updates.deliveryCarrier !== undefined) out.delivery_carrier = updates.deliveryCarrier ?? null;
  if (updates.deliveryAddress !== undefined) out.delivery_address = updates.deliveryAddress ?? null;
  if (updates.rejectionReason !== undefined) out.rejection_reason = updates.rejectionReason ?? null;
  if (updates.approvedAt !== undefined) out.approved_at = updates.approvedAt ?? null;
  if (updates.rejectedAt !== undefined) out.rejected_at = updates.rejectedAt ?? null;
  if (updates.paidAt !== undefined) out.paid_at = updates.paidAt ?? null;
  return out;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User>(EMPTY_USER);
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rcs, setRcs] = useState<PurchaseRequest[]>([]);
  const [selectedRC, setSelectedRC] = useState<PurchaseRequest | null>(null);

  // Refs to get latest values inside async closures without re-creating callbacks
  const suppliersRef = useRef(suppliers);
  const usersRef = useRef(users);
  const itemsRef = useRef(items);
  useEffect(() => { suppliersRef.current = suppliers; }, [suppliers]);
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const ensureCurrentUser = async (list: User[]) => {
    if (!authUser) return;
    let me = list.find((u) => u.id === authUser.id);
    if (!me) {
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
      } catch (e) { console.error('Erro ao criar profile:', e); }
      const { data: rolesData } = await (supabase.from('user_roles') as any)
        .select('role').eq('user_id', authUser.id);
      const roles = ((rolesData as any[]) ?? []).map((r: any) => r.role);
      if (roles.length === 0) roles.push('solicitante');
      me = { id: authUser.id, name, email, avatar, role: roles.join(',') };
      setUsers((prev) => prev.some((u) => u.id === me!.id)
        ? prev
        : [...prev, me!].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setCurrentUser(me);
  };

  const reloadUsers = async () => {
    try {
      const list = await fetchUsers();
      setUsers(list);
      await ensureCurrentUser(list);
    } catch (e) { console.error('Erro carregando usuários:', e); }
  };

  const reloadRcs = async () => {
    try {
      const { data: headers, error: hErr } = await (supabase.from('purchase_requests') as any)
        .select('*').order('created_at', { ascending: false });
      if (hErr) throw hErr;
      const ids = ((headers as any[]) ?? []).map((h) => h.id);
      let itemRows: any[] = [];
      if (ids.length > 0) {
        const { data: rows, error: iErr } = await (supabase.from('purchase_request_items') as any)
          .select('*').in('purchase_request_id', ids).order('created_at', { ascending: true });
        if (iErr) throw iErr;
        itemRows = (rows as any[]) ?? [];
      }
      const byPr = new Map<string, any[]>();
      itemRows.forEach((r) => {
        const arr = byPr.get(r.purchase_request_id) ?? [];
        arr.push(r);
        byPr.set(r.purchase_request_id, arr);
      });
      const built = ((headers as any[]) ?? []).map((h) =>
        buildPR(h, byPr.get(h.id) ?? [], suppliersRef.current, usersRef.current, itemsRef.current),
      );
      setRcs(built);
      setSelectedRC((prev) => prev ? built.find((r) => r.id === prev.id) ?? null : prev);
    } catch (e) { console.error('Erro carregando RCs:', e); }
  };

  useEffect(() => {
    supabase.from('suppliers').select('*').order('name').then(({ data, error }) => {
      if (!error && data) setSuppliers(data as Supplier[]);
    });
  }, []);

  useEffect(() => {
    if (!authUser) {
      setUsers([]); setRcs([]); setCurrentUser(EMPTY_USER);
      return;
    }
    reloadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  // Reload RCs whenever auth, users or suppliers change so joins resolve.
  useEffect(() => {
    if (!authUser) return;
    reloadRcs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, users.length, suppliers.length]);

  const addUser: AppContextType['addUser'] = async (u) => {
    const roles = u.role.split(',').map((r) => r.trim()).filter(Boolean);
    const avatar = (u.avatar && u.avatar.trim()) || deriveAvatar(u.name);
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'create', name: u.name, email: u.email, avatar, roles },
    });
    if (error) throw new Error(error.message || 'Erro ao criar usuário');
    if (data?.error) throw new Error(data.error);
    await reloadUsers();
    return { id: data?.id ?? '', name: u.name, email: u.email, role: roles.join(','), avatar };
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

  const addRC = (rc: PurchaseRequest) => {
    // Optimistic local insert
    setRcs((prev) => [rc, ...prev]);
    (async () => {
      try {
        const header = {
          id: rc.id,
          project_number: rc.projectNumber,
          project_client: rc.projectClient,
          supplier_id: rc.supplier?.id || null,
          approver_id: rc.approver?.id || null,
          requester_id: rc.requester.id,
          status: rc.status,
          discount: rc.discount,
          tax: rc.tax,
          po_number: rc.poNumber,
          invoice_data: rc.invoice,
          paid: rc.paid,
          notes: rc.notes ?? null,
          delivery_mode: rc.deliveryMode,
          delivery_carrier: rc.deliveryCarrier ?? null,
          delivery_address: rc.deliveryAddress ?? null,
        };
        const { error: hErr } = await (supabase.from('purchase_requests') as any).insert(header);
        if (hErr) throw hErr;
        if (rc.lineItems.length > 0) {
          const rows = rc.lineItems.map((li) => lineItemToRow(rc.id, li));
          const { error: iErr } = await (supabase.from('purchase_request_items') as any).insert(rows);
          if (iErr) throw iErr;
        }
        await reloadRcs();
      } catch (e: any) {
        console.error('Erro ao salvar RC:', e);
        // Rollback optimistic insert on failure
        setRcs((prev) => prev.filter((r) => r.id !== rc.id));
        alert('Erro ao salvar requisição: ' + (e?.message ?? e));
      }
    })();
  };

  const updateRC = (id: string, updates: Partial<PurchaseRequest>) => {
    setRcs((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    setSelectedRC((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
    (async () => {
      try {
        const headerPatch = prHeaderUpdates(updates);
        if (Object.keys(headerPatch).length > 0) {
          const { error } = await (supabase.from('purchase_requests') as any)
            .update(headerPatch).eq('id', id);
          if (error) throw error;
        }
        if (updates.lineItems !== undefined) {
          const { error: delErr } = await (supabase.from('purchase_request_items') as any)
            .delete().eq('purchase_request_id', id);
          if (delErr) throw delErr;
          if (updates.lineItems.length > 0) {
            const rows = updates.lineItems.map((li) => lineItemToRow(id, li));
            const { error: insErr } = await (supabase.from('purchase_request_items') as any).insert(rows);
            if (insErr) throw insErr;
          }
        }
      } catch (e: any) {
        console.error('Erro ao atualizar RC:', e);
        alert('Erro ao salvar alteração: ' + (e?.message ?? e));
      }
    })();
  };

  const calcRC = (rc: PurchaseRequest) => {
    const subtotal = rc.lineItems.reduce(
      (s, li) => s + li.unitPrice * li.qty * (1 - li.discount / 100), 0);
    const taxAmt = subtotal * (rc.tax / 100);
    return { subtotal, taxAmt, total: subtotal + taxAmt };
  };

  const approveRC = (id: string, overrideLineItems?: PurchaseRequest['lineItems']) => {
    const rc = rcs.find((r) => r.id === id);
    if (!rc) return;
    const finalItems = overrideLineItems ?? rc.lineItems;
    const poNumber = gerarNumeroPO(rc.projectNumber, rcs);
    const approvedAt = new Date().toISOString().slice(0, 10);
    updateRC(id, {
      status: 'aguardando_confirmacao_entrega',
      poNumber, approvedAt,
      lineItems: finalItems,
    });
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
      void subtotal;
      gerarPDFPO(poData);
    } catch (e) {
      console.error('Erro ao gerar PDF do PO:', e);
    }
  };

  const returnRC = (id: string, reason?: string) => {
    updateRC(id, {
      status: 'devolvida',
      rejectedAt: new Date().toISOString().slice(0, 10),
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
        items, setItems, suppliers, setSuppliers,
        rcs, setRcs, reloadRcs,
        updateRC, addRC, calcRC, approveRC, returnRC, resubmitRC,
        selectedRC, setSelectedRC,
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
