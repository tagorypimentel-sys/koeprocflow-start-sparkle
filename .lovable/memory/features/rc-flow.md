---
name: rc-flow
description: Fluxo unificado de status da RC (FLUXO_RC), responsáveis por etapa e regra de geração do PO
type: feature
---

## Status flow (FLUXO_RC em src/lib/fluxoRC.ts)
1. `rascunho` — Solicitante.
2. `aguardando_aprovacao` — Aprovador decide.
3. `aprovada` — Aprovador aprovou (PO gerado em PDF: `PO#{projectNumber}-{NN}`).
4. `aguardando_confirmacao_entrega` — Solicitante aguarda receber.
5. `entrega_confirmada` — Solicitante confirmou recebimento.
6. `nota_fiscal_recebida` — Fiscal (Conferente) registrou NF.
7. `pagamento_realizado` — Fiscal (Financeiro) pagou.
8. `nota_enviada_contador` — Fiscal (Financeiro) enviou ao contador. **Final.**

`devolvida` — status lateral (Aprovador devolve; Solicitante reenvia para `aguardando_aprovacao`).

## Responsáveis (Responsavel = 'Solicitante' | 'Aprovador' | 'Fiscal')
- `responsavelDoUsuario(role)`: solicitante→Solicitante, aprovador→Aprovador, conferente/financeiro→Fiscal.
- Botões de avanço aparecem só para o responsável da próxima etapa via `responsavelProximaAcao(status)`.

## Páginas por papel
- **Solicitante**: NovaRCPage, RCDetailPanel (Confirmar Entrega, Reenviar).
- **Aprovador**: AprovacoesPage (Aprovar gera PO+PDF; Devolver com motivo).
- **Conferente** (Fiscal): ConferenciaPage — registra NF (`entrega_confirmada → nota_fiscal_recebida`).
- **Financeiro** (Fiscal): FinanceiroPage — Registrar Pagamento (`nota_fiscal_recebida → pagamento_realizado`) e Enviar ao Contador (`pagamento_realizado → nota_enviada_contador`).

## Componentes
- `src/components/ProgressoRC.tsx` — timeline visual (renderizada no RCDetailPanel).
- `src/lib/fluxoRC.ts` — única fonte de verdade do fluxo (FLUXO_RC, proximoStatus, responsavelProximaAcao, LABEL_BOTAO_AVANCO, RESPONSAVEL_STYLE, STATUS_STYLE, responsavelDoUsuario).

## Regra do PO (AppContext.approveRC)
Conta RCs com `poNumber` começando em `PO#{projectNumber}-` e gera sequencial 2 dígitos. Ex: `PO#PRJ-2024-042-01`.
