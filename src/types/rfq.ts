import { Item, Supplier, User } from './index';

export type RFQStatus = 'aberta' | 'respondida' | 'finalizada' | 'cancelada';

export interface RFQItem {
  id: number;
  item: Item;
  qty: number;
}

export interface RFQResponseLine {
  itemId: number;
  unitPrice: number;
  leadTimeDays?: number;
  notes?: string;
}

export interface RFQResponse {
  supplierId: number;
  receivedAt: string;
  lines: RFQResponseLine[];
  totalNotes?: string;
}

export interface RFQ {
  id: string;
  createdAt: string;
  deadline: string;
  requester: User;
  status: RFQStatus;
  notes?: string;
  items: RFQItem[];
  suppliers: Supplier[];
  responses: RFQResponse[];
  winnerSupplierId?: number;
}
