import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Cliente {
  id: string;
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
  deleteCliente: (id: string) => void;
}

const ClientesContext = createContext<ClientesContextType | null>(null);

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    supabase.from('clients').select('*').order('nome').then(({ data, error }) => {
      if (!error && data) {
        setClientes(data as Cliente[]);
      }
    });
  }, []);

  async function addCliente(data: Omit<Cliente, 'id'>) {
    const { data: inserted, error } = await supabase.from('clients').insert([data]).select().single();
    if (!error && inserted) {
      setClientes((prev) => [...prev, inserted]);
      return inserted;
    }
    throw error;
  }

  async function updateCliente(updated: Cliente) {
    const { error } = await supabase.from('clients').update(updated).eq('id', updated.id);
    if (!error) {
      setClientes((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    }
  }

  async function deleteCliente(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
      setClientes((prev) => prev.filter((c) => c.id !== id));
    }
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
