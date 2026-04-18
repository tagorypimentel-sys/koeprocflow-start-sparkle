// Fluxo de status da RC (ProcureFlow)

import { UserRole } from '@/types';

export type StatusRC =
  | 'rascunho'
  | 'aguardando_aprovacao'
  | 'aprovada'
  | 'aguardando_confirmacao_entrega'
  | 'entrega_confirmada'
  | 'nota_fiscal_recebida'
  | 'pagamento_realizado'
  | 'nota_enviada_contador'
  | 'devolvida';

export type Responsavel = 'Solicitante' | 'Aprovador' | 'Fiscal';

export interface EtapaFluxo {
  status: StatusRC;
  label: string;
  responsavel: Responsavel;
  descricao: string;
}

export const FLUXO_RC: EtapaFluxo[] = [
  { status: 'rascunho', label: 'Requisição Criada', responsavel: 'Solicitante',
    descricao: 'Solicitante criou a RC e deve enviá-la para aprovação.' },
  { status: 'aguardando_aprovacao', label: 'Aguardando Aprovação', responsavel: 'Aprovador',
    descricao: 'RC enviada pelo solicitante, aguardando decisão do aprovador.' },
  { status: 'aprovada', label: 'Aprovada', responsavel: 'Aprovador',
    descricao: 'RC aprovada. Compra autorizada.' },
  { status: 'aguardando_confirmacao_entrega', label: 'Aguardando Confirmação de Entrega', responsavel: 'Solicitante',
    descricao: 'Solicitante deve confirmar o recebimento dos itens.' },
  { status: 'entrega_confirmada', label: 'Entrega Confirmada', responsavel: 'Solicitante',
    descricao: 'Solicitante confirmou o recebimento dos itens.' },
  { status: 'nota_fiscal_recebida', label: 'Nota Fiscal Recebida', responsavel: 'Fiscal',
    descricao: 'Fiscal registrou o recebimento da nota fiscal.' },
  { status: 'pagamento_realizado', label: 'Pagamento Realizado', responsavel: 'Fiscal',
    descricao: 'Pagamento efetuado pelo financeiro.' },
  { status: 'nota_enviada_contador', label: 'Nota Enviada ao Contador', responsavel: 'Fiscal',
    descricao: 'Fiscal enviou a nota fiscal ao contador. Processo concluído.' },
];

export function idxEtapa(status: StatusRC): number {
  return FLUXO_RC.findIndex((e) => e.status === status);
}

export function proximoStatus(atual: StatusRC): StatusRC | null {
  const idx = idxEtapa(atual);
  if (idx === -1 || idx === FLUXO_RC.length - 1) return null;
  return FLUXO_RC[idx + 1].status;
}

export function labelStatus(status: StatusRC): string {
  if (status === 'devolvida') return 'Devolvida ao Solicitante';
  return FLUXO_RC.find((e) => e.status === status)?.label ?? status;
}

export function responsavelProximaAcao(status: StatusRC): Responsavel | null {
  const proximo = proximoStatus(status);
  if (!proximo) return null;
  return FLUXO_RC.find((e) => e.status === proximo)?.responsavel ?? null;
}

export const LABEL_BOTAO_AVANCO: Partial<Record<StatusRC, string>> = {
  rascunho: 'Enviar para Aprovação',
  aprovada: 'Confirmar Entrega',
  aguardando_confirmacao_entrega: 'Confirmar Entrega',
  entrega_confirmada: 'Registrar Nota Fiscal',
  nota_fiscal_recebida: 'Confirmar Pagamento',
  pagamento_realizado: 'Enviar ao Contador',
};

export const RESPONSAVEL_STYLE: Record<Responsavel, string> = {
  Solicitante: 'bg-blue-50 text-blue-700 border-blue-200',
  Aprovador: 'bg-amber-50 text-amber-700 border-amber-200',
  Fiscal: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const STATUS_STYLE: Record<StatusRC, string> = {
  rascunho: 'bg-gray-50 text-gray-600 border-gray-200',
  aguardando_aprovacao: 'bg-amber-50 text-amber-700 border-amber-200',
  aprovada: 'bg-green-50 text-green-700 border-green-200',
  aguardando_confirmacao_entrega: 'bg-blue-50 text-blue-700 border-blue-200',
  entrega_confirmada: 'bg-blue-50 text-blue-700 border-blue-200',
  nota_fiscal_recebida: 'bg-purple-50 text-purple-700 border-purple-200',
  pagamento_realizado: 'bg-purple-50 text-purple-700 border-purple-200',
  nota_enviada_contador: 'bg-gray-50 text-gray-600 border-gray-200',
  devolvida: 'bg-red-50 text-red-600 border-red-200',
};

/** Mapeia o papel do usuário do app (UserRole) para o Responsavel do fluxo. */
export function responsavelDoUsuario(role: UserRole): Responsavel {
  if (role === 'solicitante') return 'Solicitante';
  if (role === 'aprovador') return 'Aprovador';
  // conferente e financeiro são ambos "Fiscal" no fluxo unificado
  return 'Fiscal';
}
