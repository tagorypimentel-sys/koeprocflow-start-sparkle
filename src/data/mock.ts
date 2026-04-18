import { User, Item, Supplier, PurchaseRequest, Categoria, Classe, Tipo } from '../types';
import itensSeed from './itens_seed.json';

export const MOCK_USERS: User[] = [
  { id: 1, name: 'Carlos Silva', email: 'carlos@empresa.com', role: 'solicitante', avatar: 'CS' },
  { id: 2, name: 'Ana Gerente', email: 'ana@empresa.com', role: 'aprovador', avatar: 'AG' },
  { id: 3, name: 'Pedro Diretor', email: 'pedro@empresa.com', role: 'aprovador', avatar: 'PD' },
  { id: 4, name: 'Maria Conferente', email: 'maria@empresa.com', role: 'conferente', avatar: 'MC' },
  { id: 5, name: 'João Financeiro', email: 'joao@empresa.com', role: 'financeiro', avatar: 'JF' },
];

export const MOCK_ITEMS: Item[] = (itensSeed as Array<{
  id: number; codigo: string; descricao: string; marca?: string; unidade: string;
  precoUnitario: number; categoria: string; classe: string; tipo: string;
}>).map((i) => ({
  id: i.id,
  codigo: i.codigo,
  descricao: i.descricao,
  marca: i.marca && i.marca !== 'Not Applicable' ? i.marca : undefined,
  unidade: i.unidade || 'UN',
  precoUnitario: i.precoUnitario || 0,
  categoria: i.categoria as Categoria,
  classe: i.classe as Classe,
  tipo: i.tipo as Tipo,
}));

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: 1, name: 'TechSolutions Ltda', cnpj: '12.345.678/0001-90',
    contact: 'contato@techsolutions.com.br', phone: '(11) 3344-5566',
    address: 'Av. Paulista, 1000 — São Paulo/SP',
  },
  {
    id: 2, name: 'Office Supply S.A.', cnpj: '98.765.432/0001-10',
    contact: 'vendas@officesupply.com.br', phone: '(11) 2233-4455',
    address: 'Rua das Flores, 200 — São Paulo/SP',
  },
  {
    id: 3, name: 'InfoParts Distribuidora', cnpj: '11.222.333/0001-44',
    contact: 'pedidos@infoparts.com.br', phone: '(11) 4455-6677',
    address: 'Av. Industrial, 500 — Guarulhos/SP',
  },
];

export const MOCK_RCS: PurchaseRequest[] = [
  {
    id: 'RC-2024-001',
    projectNumber: 'PRJ-2024-042',
    projectClient: 'Empresa ABC Ltda',
    supplier: MOCK_SUPPLIERS[0],
    approver: MOCK_USERS[1],
    requester: MOCK_USERS[0],
    status: 'aguardando_aprovacao',
    createdAt: '2024-01-15',
    discount: 5,
    tax: 12,
    poNumber: null,
    invoice: null,
    paid: false,
    deliveryMode: 'entrega',
    deliveryCarrier: 'fornecedor',
    notes: 'Equipamentos para novo colaborador do time de engenharia.',
    lineItems: [
      { id: 1, item: MOCK_ITEMS[0], qty: 2, unitPrice: 4500, discount: 5 },
      { id: 2, item: MOCK_ITEMS[1], qty: 3, unitPrice: 1200, discount: 5 },
      { id: 3, item: MOCK_ITEMS[2], qty: 2, unitPrice: 450, discount: 0 },
    ],
  },
  {
    id: 'RC-2024-002',
    projectNumber: 'PRJ-2024-038',
    projectClient: 'Construtora XYZ',
    supplier: MOCK_SUPPLIERS[1],
    approver: MOCK_USERS[2],
    requester: MOCK_USERS[0],
    status: 'pagamento_realizado',
    createdAt: '2024-01-10',
    approvedAt: '2024-01-11',
    paidAt: '2024-01-20',
    discount: 0,
    tax: 10,
    poNumber: 'PRJ-2024-038_01',
    invoice: { name: 'NF-12345.pdf', date: '2024-01-18' },
    paid: true,
    deliveryMode: 'entrega',
    deliveryCarrier: 'fornecedor',
    lineItems: [
      { id: 4, item: MOCK_ITEMS[5], qty: 10, unitPrice: 28, discount: 0 },
      { id: 5, item: MOCK_ITEMS[6], qty: 5, unitPrice: 15, discount: 0 },
    ],
  },
  {
    id: 'RC-2024-003',
    projectNumber: 'PRJ-2024-045',
    projectClient: 'Grupo Omega S.A.',
    supplier: MOCK_SUPPLIERS[2],
    approver: MOCK_USERS[1],
    requester: MOCK_USERS[0],
    status: 'aguardando_confirmacao_entrega',
    createdAt: '2024-01-18',
    approvedAt: '2024-01-19',
    discount: 10,
    tax: 12,
    poNumber: 'PRJ-2024-045_01',
    invoice: null,
    paid: false,
    deliveryMode: 'entrega',
    deliveryCarrier: 'fornecedor',
    lineItems: [
      { id: 6, item: MOCK_ITEMS[8], qty: 5, unitPrice: 1300, discount: 10 },
      { id: 7, item: MOCK_ITEMS[7], qty: 3, unitPrice: 850, discount: 10 },
    ],
  },
  {
    id: 'RC-2024-004',
    projectNumber: 'PRJ-2024-041',
    projectClient: 'StartupTech Inovações',
    supplier: MOCK_SUPPLIERS[0],
    approver: MOCK_USERS[2],
    requester: MOCK_USERS[0],
    status: 'nota_fiscal_recebida',
    createdAt: '2024-01-12',
    approvedAt: '2024-01-13',
    discount: 0,
    tax: 12,
    poNumber: 'PRJ-2024-041_01',
    invoice: { name: 'NF-67890.pdf', date: '2024-01-22' },
    paid: false,
    deliveryMode: 'entrega',
    deliveryCarrier: 'fornecedor',
    lineItems: [
      { id: 8, item: MOCK_ITEMS[9], qty: 10, unitPrice: 380, discount: 0 },
      { id: 9, item: MOCK_ITEMS[4], qty: 10, unitPrice: 320, discount: 0 },
    ],
  },
];
