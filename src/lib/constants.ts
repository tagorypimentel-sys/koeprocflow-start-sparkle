import { RCStatus, StatusConfig, UserRole } from '../types';

export const STATUS_CONFIG: Record<RCStatus, StatusConfig> = {
  aguardando_aprovacao: {
    label: 'Aguardando Aprovação', color: '#92400e', bg: '#fffbeb',
    border: '#fcd34d', icon: '⏳',
  },
  aprovado: {
    label: 'Aprovado', color: '#166534', bg: '#f0fdf4',
    border: '#86efac', icon: '✓',
  },
  rejeitado: {
    label: 'Rejeitado', color: '#991b1b', bg: '#fef2f2',
    border: '#fca5a5', icon: '✕',
  },
  pedido_emitido: {
    label: 'Pedido Emitido', color: '#1e3a8a', bg: '#eff6ff',
    border: '#93c5fd', icon: '📋',
  },
  aguardando_entrega: {
    label: 'Aguardando Entrega', color: '#5b21b6', bg: '#f5f3ff',
    border: '#c4b5fd', icon: '🚚',
  },
  entregue: {
    label: 'Entregue', color: '#065f46', bg: '#ecfdf5',
    border: '#6ee7b7', icon: '📦',
  },
  fatura_recebida: {
    label: 'Fatura Recebida', color: '#1e3a8a', bg: '#dbeafe',
    border: '#60a5fa', icon: '🧾',
  },
  pago: {
    label: 'Pago', color: '#166534', bg: '#dcfce7',
    border: '#4ade80', icon: '💰',
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  solicitante: 'Solicitante',
  aprovador: 'Aprovador',
  conferente: 'Conferente',
  financeiro: 'Financeiro',
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
  'aprovado',
  'pedido_emitido',
  'aguardando_entrega',
  'entregue',
  'fatura_recebida',
  'pago',
];
