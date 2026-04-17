import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Item, Supplier, PurchaseRequest, RCStatus } from '@/types';
import { MOCK_USERS, MOCK_ITEMS, MOCK_SUPPLIERS, MOCK_RCS } from '@/data/mock';
import { generatePOPdf } from '@/lib/generatePO';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (u: User) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  addUser: (u: { name: string; email: string; role: User['role']; avatar?: string }) => User;
  updateUser: (id: number, updates: Partial<User>) => void;
  deleteUser: (id: number) => void;
  items: Item[];
  setItems: (items: Item[]) => void;
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  rcs: PurchaseRequest[];
  setRcs: (rcs: PurchaseRequest[]) => void;
  updateRC: (id: string, updates: Partial<PurchaseRequest>) => void;
  addRC: (rc: PurchaseRequest) => void;
  calcRC: (rc: PurchaseRequest) => { subtotal: number; taxAmt: number; total: number };
  approveRC: (id: string) => void;
  rejectRC: (id: string, reason?: string) => void;
  selectedRC: PurchaseRequest | null;
  setSelectedRC: (rc: PurchaseRequest | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [rcs, setRcs] = useState<PurchaseRequest[]>(MOCK_RCS);
  const [selectedRC, setSelectedRC] = useState<PurchaseRequest | null>(null);

  const addUser: AppContextType['addUser'] = (u) => {
    const id = users.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    const avatar =
      (u.avatar && u.avatar.trim()) ||
      u.name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() ||
      '??';
    const newUser: User = { id, name: u.name, email: u.email, role: u.role, avatar };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id: number, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    setCurrentUser((prev) => (prev.id === id ? { ...prev, ...updates } : prev));
  };

  const deleteUser = (id: number) => {
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

  const approveRC = (id: string) => {
    const rc = rcs.find((r) => r.id === id);
    if (!rc) return;
    const poCount = rcs.filter((r) => r.poNumber && r.projectNumber === rc.projectNumber).length;
    const poNumber = `${rc.projectNumber}_${String(poCount + 1).padStart(2, '0')}`;
    const approvedAt = new Date().toISOString().split('T')[0];
    const updatedRC: PurchaseRequest = {
      ...rc,
      status: 'aprovado',
      poNumber,
      approvedAt,
    };
    updateRC(id, { status: 'aprovado', poNumber, approvedAt });
    try {
      generatePOPdf(updatedRC, calcRC(updatedRC));
    } catch (e) {
      console.error('Erro ao gerar PDF do PO:', e);
    }
  };

  const rejectRC = (id: string, reason?: string) => {
    updateRC(id, {
      status: 'rejeitado',
      rejectedAt: new Date().toISOString().split('T')[0],
      rejectionReason: reason,
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser, setCurrentUser, users, setUsers,
        addUser, updateUser, deleteUser,
        items, setItems, suppliers, setSuppliers, rcs, setRcs, updateRC, addRC,
        calcRC, approveRC, rejectRC, selectedRC, setSelectedRC,
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
