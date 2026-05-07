export type UserRole = 'solicitante' | 'aprovador' | 'conferente' | 'financeiro';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export const CATEGORIAS = [
  'Tools',
  'Consumables',
  'Hospedagem',
  'Bagagem',
  'Aluguel Carro/Van',
  'Aluguel/Equipamentos',
  'Uniformes',
] as const;

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
  marca?: string;
  unidade: string;
  precoUnitario: number;
  categoria: Categoria;
  classe: Classe;
  tipo: Tipo;
  linkReferencia?: string;
}

export interface Supplier {
  id: string;
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
  /** true quando a linha é um serviço inserido manualmente (sem vínculo com estoque) */
  isServico?: boolean;
}

// Novo fluxo unificado
export type RCStatus =
  | 'rascunho'
  | 'aguardando_aprovacao'
  | 'aprovada'
  | 'aguardando_confirmacao_entrega'
  | 'entrega_confirmada'
  | 'nota_fiscal_recebida'
  | 'pagamento_realizado'
  | 'nota_enviada_contador'
  | 'devolvida';

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
