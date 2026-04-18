import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Cliente {
  id: number;
  nome: string;
  doc: string;
  email: string;
  telefone: string;
  endereco: string;
}

interface ClientesContextType {
  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, 'id'>) => Cliente;
  updateCliente: (c: Cliente) => void;
  deleteCliente: (id: number) => void;
}

const ClientesContext = createContext<ClientesContextType | null>(null);
const STORAGE_KEY = 'koe-compras-clientes';

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
  }, [clientes]);

  function addCliente(data: Omit<Cliente, 'id'>) {
    const novo: Cliente = { ...data, id: Date.now() };
    setClientes((prev) => [...prev, novo]);
    return novo;
  }

  function updateCliente(updated: Cliente) {
    setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  function deleteCliente(id: number) {
    setClientes((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <ClientesContext.Provider value={{ clientes, addCliente, updateCliente, deleteCliente }}>
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  const ctx = useContext(ClientesContext);
  if (!ctx) throw new Error('useClientes deve ser usado dentro de ClientesProvider');
  return ctx;
}
