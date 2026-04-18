import { RCStatus, StatusConfig, UserRole } from '@/types';

export const STATUS_CONFIG: Record<RCStatus, StatusConfig> = {
  rascunho: {
    label: 'Rascunho', color: '#374151', bg: '#f9fafb',
    border: '#e5e7eb', icon: '📝',
  },
  aguardando_aprovacao: {
    label: 'Aguardando Aprovação', color: '#92400e', bg: '#fffbeb',
    border: '#fcd34d', icon: '⏳',
  },
  aprovada: {
    label: 'Aprovada', color: '#166534', bg: '#f0fdf4',
    border: '#86efac', icon: '✓',
  },
  aguardando_confirmacao_entrega: {
    label: 'Aguardando Confirmação de Entrega', color: '#5b21b6', bg: '#f5f3ff',
    border: '#c4b5fd', icon: '🚚',
  },
  entrega_confirmada: {
    label: 'Entrega Confirmada', color: '#065f46', bg: '#ecfdf5',
    border: '#6ee7b7', icon: '📦',
  },
  nota_fiscal_recebida: {
    label: 'Nota Fiscal Recebida', color: '#3730a3', bg: '#eef2ff',
    border: '#a5b4fc', icon: '🧾',
  },
  pagamento_realizado: {
    label: 'Pagamento Realizado', color: '#166534', bg: '#dcfce7',
    border: '#4ade80', icon: '💰',
  },
  nota_enviada_contador: {
    label: 'Nota Enviada ao Contador', color: '#134e4a', bg: '#ccfbf1',
    border: '#5eead4', icon: '🏦',
  },
  devolvida: {
    label: 'Devolvida ao Solicitante', color: '#9a3412', bg: '#fff7ed',
    border: '#fdba74', icon: '↩',
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  solicitante: 'Solicitante',
  aprovador: 'Aprovador',
  conferente: 'Conferente (Fiscal)',
  financeiro: 'Financeiro (Fiscal)',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  solicitante: '#1e3a8a',
  aprovador: '#166534',
  conferente: '#5b21b6',
  financeiro: '#92400e',
};

export const AVATAR_COLORS = ['#1e3a8a', '#166534', '#5b21b6', '#92400e', '#065f46'];

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generateRCId(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 900) + 100);
  return `RC-${year}-${num}`;
}

export const RC_STATUS_FLOW: RCStatus[] = [
  'aguardando_aprovacao',
  'aprovada',
  'aguardando_confirmacao_entrega',
  'entrega_confirmada',
  'nota_fiscal_recebida',
  'pagamento_realizado',
  'nota_enviada_contador',
];
