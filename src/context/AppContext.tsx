import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Item, Supplier, PurchaseRequest, RCStatus } from '../types';
import { MOCK_USERS, MOCK_ITEMS, MOCK_SUPPLIERS, MOCK_RCS } from '../data/mock';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (u: User) => void;
  users: User[];
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
  const [users] = useState<User[]>(MOCK_USERS);
  const [items, setItems] = useState<Item[]>(MOCK_ITEMS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [rcs, setRcs] = useState<PurchaseRequest[]>(MOCK_RCS);
  const [selectedRC, setSelectedRC] = useState<PurchaseRequest | null>(null);

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
    updateRC(id, {
      status: 'aprovado',
      poNumber,
      approvedAt: new Date().toISOString().split('T')[0],
    });
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
        currentUser, setCurrentUser, users, items, setItems,
        suppliers, setSuppliers, rcs, setRcs, updateRC, addRC,
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
