
## Plano: Opção de Entrega + Ajustes no PDF do PO

### 1. Tipos (`src/types/index.ts`)
Adicionar ao `PurchaseRequest`:
- `deliveryMode: 'entrega' | 'retirada'`
- `deliveryCarrier?: 'transportadora' | 'fornecedor'` (só quando `deliveryMode === 'entrega'`)

### 2. Formulário Nova RC (`src/pages/NovaRCPage.tsx`)
Adicionar nova seção "Modo de Entrega" no card de Informações do Projeto, com dois toggles estilo "switch/segmented":
- **Toggle 1**: `Entrega` ↔ `Retirada na loja` (default: Entrega)
- **Toggle 2** (condicional, só aparece se `Entrega`): `Transportadora` ↔ `Fornecedor entrega` (default: Fornecedor)

Salvar `deliveryMode` e `deliveryCarrier` na RC criada. Componentes feitos com `button`s estilizados (Tailwind) — sem nova lib.

### 3. PDF do Pedido de Compra (`src/lib/generatePO.ts`)
**Remover do PDF** (conforme pedido):
- Linha "Cliente"
- Linha "Projeto"
- Linha "Aprovador"
- Linha "Criado em" (data de solicitação)

**Manter**: Solicitante, Aprovado em, número do projeto vinculado já implícito no PO#.

**Adicionar bloco "MODALIDADE DE ENTREGA"** (logo abaixo do bloco do Fornecedor), exibindo um dos textos:
- "Retirada na loja pelo solicitante"
- "Entrega pelo fornecedor"
- "Entrega via transportadora (a contratar pelo solicitante)"

### 4. Painel de detalhes (`src/components/rc/RCDetailPanel.tsx`)
Adicionar linha "Modo de entrega" no grid de "Dados da RC" para visualização in-app (sem afetar PDF).

### 5. Mock data (`src/data/mock.ts`)
Adicionar `deliveryMode: 'entrega'` + `deliveryCarrier: 'fornecedor'` às RCs existentes para evitar `undefined`.

### Fora de escopo
- Edição do modo de entrega após criação da RC.
- Cadastro de transportadoras.
