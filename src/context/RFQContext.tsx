import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface RFQItem {
  itemId: string;
  codigo: string;
  descricao: string;
  unidade: string;
  qty: number;
  referencia?: string;
}

export interface RFQ {
  id: string;
  numeroRFQ: string;
  numeroProjeto: string;
  nomeProjeto: string;
  dataEmissao: string;
  dataLimiteEntrega: string;
  observacoes?: string;
  itens: RFQItem[];
  criadoEm: string;
}

interface RFQContextType {
  rfqs: RFQ[];
  addRFQ: (data: Omit<RFQ, 'id' | 'numeroRFQ' | 'criadoEm'>) => Promise<RFQ>;
  deleteRFQ: (id: string) => Promise<void>;
  reloadRFQs: () => Promise<void>;
}

const RFQContext = createContext<RFQContextType | null>(null);

function gerarNumeroRFQ(projeto: string, existentes: RFQ[]): string {
  const ano = new Date().getFullYear();
  const doProjeto = existentes.filter((r) => r.numeroProjeto === projeto);
  const seq = String(doProjeto.length + 1).padStart(2, '0');
  return `RFQ-${ano}-${projeto}-${seq}`;
}

function rowToRFQ(row: any, itemRows: any[]): RFQ {
  return {
    id: row.id,
    numeroRFQ: row.numero_rfq,
    numeroProjeto: row.numero_projeto,
    nomeProjeto: row.nome_projeto ?? '',
    dataEmissao: row.data_emissao,
    dataLimiteEntrega: row.data_limite_entrega ?? '',
    observacoes: row.observacoes ?? undefined,
    criadoEm: row.created_at,
    itens: itemRows.map((i) => ({
      itemId: i.item_id ?? '',
      codigo: i.codigo,
      descricao: i.descricao,
      unidade: i.unidade,
      qty: Number(i.qty ?? 0),
      referencia: i.referencia ?? '',
    })),
  };
}

export function RFQProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);

  const reloadRFQs = async () => {
    try {
      const { data: heads, error } = await (supabase.from('rfqs') as any)
        .select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const ids = ((heads as any[]) ?? []).map((h) => h.id);
      let itemRows: any[] = [];
      if (ids.length > 0) {
        const { data: rows, error: iErr } = await (supabase.from('rfq_items') as any)
          .select('*').in('rfq_id', ids).order('created_at', { ascending: true });
        if (iErr) throw iErr;
        itemRows = (rows as any[]) ?? [];
      }
      const byRfq = new Map<string, any[]>();
      itemRows.forEach((r) => {
        const arr = byRfq.get(r.rfq_id) ?? [];
        arr.push(r);
        byRfq.set(r.rfq_id, arr);
      });
      setRfqs(((heads as any[]) ?? []).map((h) => rowToRFQ(h, byRfq.get(h.id) ?? [])));
    } catch (e) {
      console.error('Erro carregando RFQs:', e);
    }
  };

  useEffect(() => {
    if (!authUser) { setRfqs([]); return; }
    reloadRFQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  const addRFQ: RFQContextType['addRFQ'] = async (data) => {
    if (!authUser) throw new Error('Você precisa estar autenticado.');
    const numeroRFQ = gerarNumeroRFQ(data.numeroProjeto, rfqs);
    const id = numeroRFQ;
    const header = {
      id,
      numero_rfq: numeroRFQ,
      numero_projeto: data.numeroProjeto,
      nome_projeto: data.nomeProjeto || '',
      data_emissao: data.dataEmissao || new Date().toISOString().slice(0, 10),
      data_limite_entrega: data.dataLimiteEntrega || null,
      observacoes: data.observacoes ?? null,
      created_by: authUser.id,
    };
    const { error: hErr } = await (supabase.from('rfqs') as any).insert(header);
    if (hErr) throw new Error(hErr.message);
    if (data.itens.length > 0) {
      const rows = data.itens.map((it) => ({
        rfq_id: id,
        item_id: it.itemId && /^[0-9a-f-]{36}$/i.test(it.itemId) ? it.itemId : null,
        codigo: it.codigo,
        descricao: it.descricao,
        unidade: it.unidade || 'UN',
        qty: it.qty,
        referencia: it.referencia ?? null,
      }));
      const { error: iErr } = await (supabase.from('rfq_items') as any).insert(rows);
      if (iErr) throw new Error(iErr.message);
    }
    const nova: RFQ = {
      ...data,
      id,
      numeroRFQ,
      criadoEm: new Date().toISOString(),
    };
    setRfqs((prev) => [nova, ...prev]);
    return nova;
  };

  const deleteRFQ = async (id: string) => {
    const { error } = await (supabase.from('rfqs') as any).delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir RFQ: ' + error.message);
      return;
    }
    setRfqs((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <RFQContext.Provider value={{ rfqs, addRFQ, deleteRFQ, reloadRFQs }}>
      {children}
    </RFQContext.Provider>
  );
}

export function useRFQ() {
  const ctx = useContext(RFQContext);
  if (!ctx) throw new Error('useRFQ deve ser usado dentro de RFQProvider');
  return ctx;
}
