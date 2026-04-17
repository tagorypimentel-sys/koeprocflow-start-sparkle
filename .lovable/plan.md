
## Plano: Geração de PDF do Pedido de Compra

### Objetivo
Ao aprovar uma RC, gerar automaticamente um PDF profissional do Pedido de Compra (PO) e disparar download. Também permitir baixar o PDF posteriormente a partir do painel de detalhes da RC aprovada.

### Abordagem técnica
Usar **jsPDF + jspdf-autotable** (client-side, sem backend). É leve, funciona no browser, e não requer Lovable Cloud.

### Arquivos a criar/editar

1. **`src/lib/generatePO.ts`** (novo)
   - Função `generatePOPdf(rc, totals)` que monta o PDF e dispara `doc.save(...)`.
   - Layout corporativo:
     - **Cabeçalho**: faixa azul-marinho (`#1e3a8a`) com "PEDIDO DE COMPRA" + número do PO à direita.
     - **Bloco de metadados** (2 colunas): Projeto, Cliente, Data emissão, Data aprovação, Solicitante, Aprovador.
     - **Bloco Fornecedor**: nome, CNPJ, contato, telefone, endereço.
     - **Tabela de itens** (autoTable): Código, Descrição, Qtd, Unit., Desc.%, Total. Cabeçalho com fill azul-marinho e texto branco.
     - **Totais** alinhados à direita: Subtotal, Impostos (X%), **Total** em destaque.
     - **Observações** (se houver).
     - **Rodapé**: "Documento gerado automaticamente por ProcureFlow" + paginação.
   - Valores formatados pt-BR.

2. **`src/context/AppContext.tsx`** (editar)
   - Em `approveRC`: após atualizar status, chamar `generatePOPdf(updatedRC, calcRC(updatedRC))` para download automático.

3. **`src/components/rc/RCDetailPanel.tsx`** (editar)
   - No bloco "Pedido de Compra" (quando `rc.poNumber` existe), adicionar botão **"Baixar PDF"** que chama `generatePOPdf`.

4. **`src/pages/AprovacoesPage.tsx`** (sem mudança de lógica — `approveRC` já cuida do download).

### Dependências
- `jspdf`
- `jspdf-autotable`

### Detalhes de design do PDF
- Fonte: Helvetica (default jsPDF, sem necessidade de embed).
- Margens: 15mm.
- Cores: azul-marinho `#1e3a8a` para faixas/cabeçalhos, cinza `#6b7280` para labels, preto para valores.
- Tamanho A4 retrato.

### Fora de escopo
- Envio de PDF por e-mail (apenas simulado em texto, como já consta no painel).
- Armazenamento do PDF no servidor (sem backend nesta versão).
