import { createContext, useContext, ReactNode } from 'react';
import { useApp } from './AppContext';
import { Item, CATEGORIAS, CLASSES, TIPOS } from '@/types';

export { CATEGORIAS, CLASSES, TIPOS };
export type { Item };

interface ItensContextType {
  itens: Item[];
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (item: Item) => void;
  deleteItem: (id: number) => void;
}

const ItensContext = createContext<ItensContextType | null>(null);

export function ItensProvider({ children }: { children: ReactNode }) {
  const { items, setItems } = useApp();

  const addItem = (data: Omit<Item, 'id'>) => {
    const id = items.reduce((m, i) => Math.max(m, i.id), 0) + 1;
    setItems([...items, { ...data, id }]);
  };

  const updateItem = (updated: Item) => {
    setItems(items.map((i) => (i.id === updated.id ? updated : i)));
  };

  const deleteItem = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <ItensContext.Provider value={{ itens: items, addItem, updateItem, deleteItem }}>
      {children}
    </ItensContext.Provider>
  );
}

export function useItens() {
  const ctx = useContext(ItensContext);
  if (!ctx) throw new Error('useItens deve ser usado dentro de ItensProvider');
  return ctx;
}
