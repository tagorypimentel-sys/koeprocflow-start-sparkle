import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface RFQItem {
  id: number;
  itemId: string;
  codigo: string;
  descricao: string;
  categoria: string;
  classe: string;
  unidade: string;
  qty: number;
  linkReferencia: string;
}

export interface RFQ {
  id: string;
  numeroRFQ: string;       // ex: RFQ-7025-01
  numeroProjeto: string;   // 4 dígitos
  prazoResposta: string;
  dataEntrega: string;
  observacoes: string;
  itens: RFQItem[];
  status: "rascunho" | "enviada";
  criadoEm: string;
}

interface RFQContextType {
  rfqs: RFQ[];
  addRFQ: (rfq: Omit<RFQ, "id" | "numeroRFQ" | "criadoEm">) => RFQ;
  updateRFQ: (id: string, campos: Partial<RFQ>) => void;
  deleteRFQ: (id: string) => void;
}

const RFQContext = createContext<RFQContextType | null>(null);
const STORAGE_KEY = "koe-compras-rfqs";

function gerarNumeroRFQ(numeroProjeto: string, rfqsExistentes: RFQ[]): string {
  const projeto = numeroProjeto.trim().padStart(4, "0");
  const rfqsDoProjeto = rfqsExistentes.filter(
    (r) => r.numeroProjeto.trim().padStart(4, "0") === projeto
  );
  const seq = (rfqsDoProjeto.length + 1).toString().padStart(2, "0");
  return `RFQ-${projeto}-${seq}`;
}

export function RFQProvider({ children }: { children: ReactNode }) {
  const [rfqs, setRfqs] = useState<RFQ[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rfqs));
  }, [rfqs]);

  function addRFQ(data: Omit<RFQ, "id" | "numeroRFQ" | "criadoEm">): RFQ {
    const novaRFQ: RFQ = {
      ...data,
      id: crypto.randomUUID(),
      numeroRFQ: gerarNumeroRFQ(data.numeroProjeto, rfqs),
      criadoEm: new Date().toISOString(),
    };
    setRfqs((prev) => [...prev, novaRFQ]);
    return novaRFQ;
  }

  function updateRFQ(id: string, campos: Partial<RFQ>) {
    setRfqs((prev) => prev.map((r) => (r.id === id ? { ...r, ...campos } : r)));
  }

  function deleteRFQ(id: string) {
    setRfqs((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <RFQContext.Provider value={{ rfqs, addRFQ, updateRFQ, deleteRFQ }}>
      {children}
    </RFQContext.Provider>
  );
}

export function useRFQ() {
  const ctx = useContext(RFQContext);
  if (!ctx) throw new Error("useRFQ deve ser usado dentro de RFQProvider");
  return ctx;
}
