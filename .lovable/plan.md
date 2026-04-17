
## Análise do estado atual

Verificando o que já existe vs. o que falta:

**Já implementado:**
- `AprovacoesPage.tsx` tem botões **"✓ Aprovar"** e **"✕ Rejeitar"** (com motivo opcional) — atende "aprovar ou devolver".
- `approveRC` no `AppContext.tsx` já gera PDF automaticamente via `generatePOPdf`.
- Numeração de PO já existe: `${rc.projectNumber}_${NN}` (ex: `7025_01`).

**Gap vs. pedido:**
- Formato do PO: hoje é `7025_01`, o usuário pede **`PO#7025-01`** (prefixo `PO#` + separador `-`).
- Terminologia "devolver" vs. "rejeitar" — o botão atual diz "Rejeitar". Pedido fala em **"devolver ao solicitante"**, o que sugere que a RC volte para um estado editável pelo solicitante (não um "rejeitado" terminal).

## Decisões de design

1. **Formato PO**: trocar geração para `PO#${projectNumber}-${NN}` (ex: `PO#7025-01`). Atualizar contagem para considerar o novo prefixo ao calcular sequência.
2. **Devolver ≠ Rejeitar**: renomear ação para **"Devolver ao Solicitante"**. Adicionar novo status `devolvido` que:
   - Aparece para o solicitante numa lista (RCListPage filtra por status do usuário) e pode ser editado/reenviado.
   - Mantém o motivo de devolução visível.
   - Manteremos `rejeitado` no enum para compatibilidade, mas a ação do aprovador agora usa `devolvido`.
3. **Reenvio pelo solicitante**: quando RC está `devolvido`, o solicitante poderá reabrir/editar e mudar status de volta para `aguardando_aprovacao`. Para escopo mínimo, adicionar botão **"Reenviar para Aprovação"** no `RCDetailPanel` quando status = `devolvido` e usuário = solicitante.

## Arquivos a editar

1. **`src/types/index.ts`** — adicionar `'devolvido'` ao `RCStatus`.
2. **`src/lib/constants.ts`** — adicionar config visual do status `devolvido` (cor laranja/âmbar, ícone ↩).
3. **`src/context/AppContext.tsx`**:
   - `approveRC`: trocar formato do PO para `PO#${projectNumber}-${NN}`. Ajustar contagem (`rcs.filter(r => r.poNumber?.startsWith('PO#' + rc.projectNumber))`).
   - Adicionar `returnRC(id, reason)` que seta status `devolvido` + `rejectionReason`.
   - Adicionar `resubmitRC(id)` que volta status para `aguardando_aprovacao` e limpa `rejectionReason`.
4. **`src/pages/AprovacoesPage.tsx`**:
   - Renomear botão "✕ Rejeitar" → "↩ Devolver ao Solicitante".
   - Trocar chamada `rejectRC` → `returnRC`.
   - Textos: "Motivo da devolução" em vez de "rejeição".
5. **`src/components/rc/RCDetailPanel.tsx`**:
   - Quando status = `devolvido` e usuário = solicitante, mostrar botão **"Reenviar para Aprovação"** + alerta com motivo.
6. **`src/lib/generatePO.ts`** — sem mudança estrutural (já recebe `rc.poNumber`); apenas usará o novo formato automaticamente.

## Fora de escopo
- Edição completa da RC após devolução (abriria refatoração grande do `NovaRCPage`). Reenvio será simples (volta direto para aprovação com mesmos dados, opcionalmente o solicitante pode editar via tela de nova RC numa próxima iteração).
- Migração das RCs mock existentes para o novo formato `PO#…` (ficam com o formato antigo no histórico).
