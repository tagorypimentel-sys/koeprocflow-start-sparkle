---
name: rc-flow
description: Fluxo completo de status do procurement, ações por papel e regra de geração do PO
type: feature
---

## Status flow (RC_STATUS_FLOW)
1. `aguardando_aprovacao` — Solicitante criou a RC.
2. `aprovado` — Aprovador aprovou (PO gerado automaticamente em PDF, formato `PO#{projectNumber}-{NN}`).
3. `aguardando_entrega` — Setado automaticamente junto com a aprovação. Material a caminho.
4. `entregue` — Solicitante confirma recebimento do material.
5. `fatura_recebida` — Solicitante anexa Nota Fiscal recebida do fornecedor.
6. `enviado_contabilidade` — Conferente envia a fatura ao portal da Contabilidade.
7. `pago` — Financeiro registra pagamento.
8. `conciliado` — Financeiro confirma conciliação bancária (etapa final).

## Status alternativos
- `rejeitado` — terminal (legacy).
- `devolvido` — Aprovador devolveu para o Solicitante editar/reenviar (botão "Reenviar para Aprovação" no RCDetailPanel).
- `pedido_emitido` — legacy do fluxo antigo, mantido para compatibilidade com mocks.

## Ações por papel
- **Solicitante**: cria RC, confirma entrega (status `aguardando_entrega`), anexa NF (status `entregue`), reenvia RC devolvida.
- **Aprovador**: aprova (gera PO + PDF) ou devolve com motivo (AprovacoesPage).
- **Conferente**: envia fatura à contabilidade (ConferenciaPage; status `fatura_recebida` → `enviado_contabilidade`).
- **Financeiro**: registra pagamento (status `enviado_contabilidade` → `pago`) e confirma conciliação (`pago` → `conciliado`) na FinanceiroPage.

## Regra de geração do PO
Em `approveRC` (AppContext): conta RCs existentes com `poNumber` começando em `PO#{projectNumber}-` e gera sequencial de 2 dígitos. Ex: `PO#7025-01`.
