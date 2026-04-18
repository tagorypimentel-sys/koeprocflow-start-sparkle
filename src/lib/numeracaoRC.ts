// Numeração de RC e PO
// RC: RC-{ano}-{projeto4}-{seq2}  (ex: RC-2024-7025-01)
// PO: PO#{projeto4}-{seq2}        (ex: PO#7025-01)

import { PurchaseRequest } from '@/types';

export function validarNumeroProjeto(valor: string): boolean {
  return /^\d{4}$/.test(valor.trim());
}

export function normalizarProjeto(valor: string): string {
  return valor.trim().padStart(4, '0').slice(-4);
}

/**
 * Gera o próximo número (id) da RC para um projeto.
 * Considera todas as RCs existentes do mesmo projeto+ano para calcular o sequencial.
 */
export function gerarNumeroRC(numeroProjeto: string, rcs: PurchaseRequest[]): string {
  const ano = new Date().getFullYear();
  const projeto = normalizarProjeto(numeroProjeto);
  const prefixo = `RC-${ano}-${projeto}-`;
  const existentes = rcs.filter((r) => r.id.startsWith(prefixo)).length;
  const seq = String(existentes + 1).padStart(2, '0');
  return `${prefixo}${seq}`;
}

/**
 * Gera o número do PO ao aprovar uma RC.
 * Sequencial por projeto, contando RCs já com poNumber.
 */
export function gerarNumeroPO(numeroProjeto: string, rcs: PurchaseRequest[]): string {
  const projeto = normalizarProjeto(numeroProjeto);
  const prefixo = `PO#${projeto}-`;
  const existentes = rcs.filter(
    (r) => typeof r.poNumber === 'string' && r.poNumber.startsWith(prefixo),
  ).length;
  const seq = String(existentes + 1).padStart(2, '0');
  return `${prefixo}${seq}`;
}
