import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useApp } from './AppContext';
import { supabase } from '@/lib/supabase';
import { Item, CATEGORIAS, CLASSES, TIPOS, Categoria, Classe, Tipo } from '@/types';

export { CATEGORIAS, CLASSES, TIPOS };
export type { Item };

interface ItensContextType {
  itens: Item[];
  addItem: (item: Omit<Item, 'id'>) => Promise<Item>;
  addItems: (items: Omit<Item, 'id'>[]) => Promise<Item[]>;
  updateItem: (item: Item) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const ItensContext = createContext<ItensContextType | null>(null);

type Row = {
  id: string;
  codigo: string;
  descricao: string;
  marca: string | null;
  unidade: string;
  preco_unitario: number | string;
  categoria: string;
  classe: string;
  tipo: string;
  link_referencia: string | null;
};

function rowToItem(r: Row): Item {
  return {
    id: r.id as unknown as Item['id'],
    codigo: r.codigo,
    descricao: r.descricao,
    marca: r.marca ?? undefined,
    unidade: r.unidade,
    precoUnitario: Number(r.preco_unitario) || 0,
    categoria: r.categoria as Categoria,
    classe: r.classe as Classe,
    tipo: r.tipo as Tipo,
    linkReferencia: r.link_referencia ?? undefined,
  };
}

function itemToRow(i: Omit<Item, 'id'>) {
  return {
    codigo: i.codigo,
    descricao: i.descricao,
    marca: i.marca ?? null,
    unidade: i.unidade,
    preco_unitario: i.precoUnitario,
    categoria: i.categoria,
    classe: i.classe,
    tipo: i.tipo,
    link_referencia: i.linkReferencia ?? null,
  };
}

export function ItensProvider({ children }: { children: ReactNode }) {
  const { items, setItems } = useApp();

  useEffect(() => {
    supabase
      .from('items')
      .select('*')
      .order('codigo')
      .then(({ data, error }) => {
        if (!error && data) {
          setItems((data as unknown as Row[]).map(rowToItem));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addItem(data: Omit<Item, 'id'>): Promise<Item> {
    const { data: inserted, error } = await supabase
      .from('items')
      .insert([itemToRow(data) as any])
      .select()
      .single();
    if (error || !inserted) throw error;
    const item = rowToItem(inserted as unknown as Row);
    setItems([...items, item]);
    return item;
  }

  async function addItems(list: Omit<Item, 'id'>[]): Promise<Item[]> {
    if (list.length === 0) return [];
    const { data, error } = await supabase
      .from('items')
      .insert(list.map(itemToRow) as any)
      .select();
    if (error || !data) throw error;
    const inserted = (data as unknown as Row[]).map(rowToItem);
    setItems([...items, ...inserted]);
    return inserted;
  }

  async function updateItem(updated: Item) {
    const { id, ...rest } = updated;
    const { error } = await supabase
      .from('items')
      .update(itemToRow(rest) as any)
      .eq('id', id as unknown as string);
    if (error) throw error;
    setItems(items.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
    setItems(items.filter((i) => (i.id as unknown as string) !== id));
  }

  return (
    <ItensContext.Provider value={{ itens: items, addItem, addItems, updateItem, deleteItem }}>
      {children}
    </ItensContext.Provider>
  );
}

export function useItens() {
  const ctx = useContext(ItensContext);
  if (!ctx) throw new Error('useItens deve ser usado dentro de ItensProvider');
  return ctx;
}
