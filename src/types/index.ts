export type UserRole = 'solicitante' | 'aprovador' | 'conferente' | 'financeiro';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export const CATEGORIAS = ['Tools', 'Consumables'] as const;

export const CLASSES = [
  'Rope Access',
  'PPE',
  'Load/Lift',
  'Electrical',
  'Abrasive',
  'Welding',
  'General',
  'Painting',
  'Polish',
  'Cleaning',
  'Corded',
  'Cordless',
  'Pneumatics',
  'Measurement',
  'Hand',
] as const;

export const TIPOS = ['OPEX', 'CAPEX'] as const;

export type Categoria = (typeof CATEGORIAS)[number];
export type Classe = (typeof CLASSES)[number];
export type Tipo = (typeof TIPOS)[number];

export interface Item {
  id: number;
  codigo: string;
  descricao: string;
  unidade: string;
  precoUnitario: number;
  categoria: Categoria;
  classe: Classe;
  tipo: Tipo;
}

export interface Supplier {
  id: number;
  name: string;
  cnpj: string;
  contact: string;
  phone: string;
  address?: string;
}

export interface LineItem {
  id: number;
  item: Item;
  qty: number;
  unitPrice: number;
  discount: number;
}

export type RCStatus =
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'rejeitado'
  | 'devolvido'
  | 'pedido_emitido'
  | 'aguardando_entrega'
  | 'entregue'
  | 'fatura_recebida'
  | 'enviado_contabilidade'
  | 'pago'
  | 'conciliado';

export interface Invoice {
  name: string;
  date: string;
  url?: string;
}

export interface PurchaseRequest {
  id: string;
  projectNumber: string;
  projectClient: string;
  supplier: Supplier;
  approver: User;
  requester: User;
  status: RCStatus;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
  rejectionReason?: string;
  discount: number;
  tax: number;
  poNumber: string | null;
  invoice: Invoice | null;
  paid: boolean;
  lineItems: LineItem[];
  notes?: string;
  deliveryMode: 'entrega' | 'retirada';
  deliveryCarrier?: 'transportadora' | 'fornecedor';
  deliveryAddress?: string;
}

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
}
