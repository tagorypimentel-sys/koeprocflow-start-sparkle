import { createContext, useContext, useState, ReactNode } from 'react';
import { RFQ, RFQResponse } from '@/types/rfq';

interface RFQContextType {
  rfqs: RFQ[];
  addRFQ: (rfq: RFQ) => void;
  updateRFQ: (id: string, updates: Partial<RFQ>) => void;
  deleteRFQ: (id: string) => void;
  upsertResponse: (rfqId: string, response: RFQResponse) => void;
  setWinner: (rfqId: string, supplierId: number) => void;
  nextId: () => string;
}

const RFQContext = createContext<RFQContextType | null>(null);

export function RFQProvider({ children }: { children: ReactNode }) {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);

  const addRFQ = (rfq: RFQ) => setRfqs((prev) => [rfq, ...prev]);

  const updateRFQ = (id: string, updates: Partial<RFQ>) =>
    setRfqs((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));

  const deleteRFQ = (id: string) =>
    setRfqs((prev) => prev.filter((r) => r.id !== id));

  const upsertResponse = (rfqId: string, response: RFQResponse) => {
    setRfqs((prev) =>
      prev.map((r) => {
        if (r.id !== rfqId) return r;
        const others = r.responses.filter((x) => x.supplierId !== response.supplierId);
        const responses = [...others, response];
        const status: RFQ['status'] = responses.length > 0 ? 'respondida' : r.status;
        return { ...r, responses, status };
      })
    );
  };

  const setWinner = (rfqId: string, supplierId: number) => {
    setRfqs((prev) =>
      prev.map((r) =>
        r.id === rfqId ? { ...r, winnerSupplierId: supplierId, status: 'finalizada' } : r
      )
    );
  };

  const nextId = () => {
    const year = new Date().getFullYear();
    const count = rfqs.filter((r) => r.id.startsWith(`RFQ-${year}-`)).length + 1;
    return `RFQ-${year}-${String(count).padStart(4, '0')}`;
  };

  return (
    <RFQContext.Provider
      value={{ rfqs, addRFQ, updateRFQ, deleteRFQ, upsertResponse, setWinner, nextId }}
    >
      {children}
    </RFQContext.Provider>
  );
}

export function useRFQ() {
  const ctx = useContext(RFQContext);
  if (!ctx) throw new Error('useRFQ deve ser usado dentro de RFQProvider');
  return ctx;
}
