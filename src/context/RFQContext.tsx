import { createContext, useContext, useState, ReactNode } from 'react';

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
  addRFQ: (data: Omit<RFQ, 'id' | 'numeroRFQ' | 'criadoEm'>) => RFQ;
  deleteRFQ: (id: string) => void;
}

const RFQContext = createContext<RFQContextType | null>(null);

function gerarNumeroRFQ(projeto: string, existentes: RFQ[]): string {
  const ano = new Date().getFullYear();
  const doProjeto = existentes.filter((r) => r.numeroProjeto === projeto);
  const seq = String(doProjeto.length + 1).padStart(2, '0');
  return `RFQ-${ano}-${projeto}-${seq}`;
}

export function RFQProvider({ children }: { children: ReactNode }) {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);

  const addRFQ: RFQContextType['addRFQ'] = (data) => {
    const numeroRFQ = gerarNumeroRFQ(data.numeroProjeto, rfqs);
    const nova: RFQ = {
      ...data,
      id: `${Date.now()}`,
      numeroRFQ,
      criadoEm: new Date().toISOString(),
    };
    setRfqs((prev) => [nova, ...prev]);
    return nova;
  };

  const deleteRFQ = (id: string) => setRfqs((prev) => prev.filter((r) => r.id !== id));

  return (
    <RFQContext.Provider value={{ rfqs, addRFQ, deleteRFQ }}>
      {children}
    </RFQContext.Provider>
  );
}

export function useRFQ() {
  const ctx = useContext(RFQContext);
  if (!ctx) throw new Error('useRFQ deve ser usado dentro de RFQProvider');
  return ctx;
}
