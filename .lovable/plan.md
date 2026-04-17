
## Análise

Fluxo atual:
`aguardando_aprovacao → aprovado → pedido_emitido → aguardando_entrega → entregue → fatura_recebida → pago`

Hoje o **Conferente** faz: confirmar emissão do pedido, confirmar envio ao fornecedor, confirmar entrega e anexar nota fiscal. **Financeiro** registra o pagamento.

## Novo fluxo proposto

```text
1. Solicitante:   cria RC                    → aguardando_aprovacao
2. Aprovador:     aprova                     → aprovado (PO gerado automaticamente)
                                             → pedido_emitido (auto, junto com aprovação)
                                             → aguardando_entrega (auto)
3. Solicitante:   confirma entrega           → entregue
4. Solicitante:   anexa Nota Fiscal          → fatura_recebida
5. Conferente:    envia fatura à Contabilidade → enviado_contabilidade  (NOVO)
6. Financeiro:    registra pagamento         → pago
7. Financeiro:    confirma conciliação       → conciliado  (NOVO — etapa final)
```

Mudanças-chave:
- Conferente sai do início do fluxo. Aprovação já dispara PO e marca `aguardando_entrega` direto.
- Solicitante passa a confirmar entrega e anexar NF (movido de Conferente).
- Conferente ganha nova responsabilidade única: enviar a fatura ao portal da Contabilidade.
- Financeiro ganha etapa final de Conciliação Bancária após o pagamento.

## Arquivos a alterar

1. **`src/types/index.ts`** — adicionar status `enviado_contabilidade` e `conciliado` ao `RCStatus`.

2. **`src/lib/constants.ts`** — config visual dos dois novos status (cores/ícones) e atualizar `RC_STATUS_FLOW`.

3. **`src/context/AppContext.tsx`** — em `approveRC`, ao aprovar já setar status final como `aguardando_entrega` (em vez de `aprovado`), mantendo `approvedAt` e `poNumber`.

4. **`src/pages/ConferenciaPage.tsx`** — refatorar:
   - Remover etapas "Confirmar Emissão" e "Confirmar Envio".
   - Remover ações de "Confirmar Entrega" e "Anexar NF" (vão para o solicitante).
   - Listar apenas RCs com status `fatura_recebida`.
   - Botão único: **"📤 Enviar Fatura à Contabilidade"** → muda status para `enviado_contabilidade`.
   - Atualizar indicador de etapas para refletir novo fluxo.

5. **`src/pages/RCListPage.tsx`** (ou onde o solicitante vê suas RCs) — adicionar ações para o solicitante quando status for:
   - `aguardando_entrega` → botão **"✓ Confirmar Entrega"** (status → `entregue`).
   - `entregue` → botão **"📎 Anexar Nota Fiscal"** (status → `fatura_recebida` + popula `invoice`).
   
   Verificar se existe componente apropriado (RCDetailPanel) para colocar essas ações; usar lá se for o caso.

6. **`src/pages/FinanceiroPage.tsx`**:
   - Listar pendências como RCs com status `enviado_contabilidade` (em vez de `fatura_recebida`).
   - Após "Registrar Pagamento" (status → `pago`), exibir nova seção/botão **"🏦 Confirmar Conciliação Bancária"** para RCs `pago` → status `conciliado`.
   - Histórico passa a mostrar RCs `conciliado`.

7. **`src/pages/DashboardPage.tsx`** — se houver contadores por status, incluir os novos.

## Fora de escopo
- Integração real com portal de contabilidade (apenas mudança de status).
- Upload real de arquivo de NF (mantém simulação atual).
- Migração de RCs mock existentes para o novo fluxo (ficam nos status antigos).
