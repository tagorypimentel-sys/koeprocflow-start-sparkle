import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Item, Supplier, PurchaseRequest } from '@/types';
import { MOCK_USERS, MOCK_ITEMS, MOCK_SUPPLIERS, MOCK_RCS } from '@/data/mock';
import { gerarPDFPO, POData } from '@/lib/gerarPDFPO';
import { gerarNumeroPO } from '@/lib/numeracaoRC';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (u: User) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  addUser: (u: { name: string; email: string; role: User['role']; avatar?: string }) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rcs, setRcs] = useState<PurchaseRequest[]>(MOCK_RCS);

  useEffect(() => {
    supabase.from('suppliers').select('*').order('name').then(({ data, error }) => {
      if (!error && data) {
        setSuppliers(data as Supplier[]);
      }
    });
    
    supabase.from('profiles').select('*').order('name').then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        setUsers(data as User[]);
        setCurrentUser(data[0] as User);
      } else {
        setUsers(MOCK_USERS);
      }
    });
  }, []);
  const [selectedRC, setSelectedRC] = useState<PurchaseRequest | null>(null);

  const addUser: AppContextType['addUser'] = async (u) => {
    const avatar =
      (u.avatar && u.avatar.trim()) ||
      u.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() ||
      '??';
    const newUser = { name: u.name, email: u.email, role: u.role, avatar };
    const { data, error } = await supabase.from('profiles').insert([newUser]).select().single();
    if (error) throw error;
    setUsers((prev) => [...prev, data]);
    return data;
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
      setCurrentUser((prev) => (prev.id === id ? { ...prev, ...updates } : prev));
    }
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
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
        addUser, updateUser, deleteUser,
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
