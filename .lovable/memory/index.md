# Project Memory

## Core
Projeto: ProcureFlow — sistema de procurement corporativo (RC → Aprovação → Entrega → Conferência → Financeiro).
4 perfis: solicitante, aprovador, conferente, financeiro. Seletor de usuário demo na sidebar.
Cores: primary blue-navy (#1e3a8a / blue-900 do tailwind). UI usa estilos inline conforme guia.
Sem auth/backend nesta versão — dados em mock + Context API.
Idioma PT-BR. Valores formatados pt-BR (R$ 1.234,56).
Componentes do guia em `src/components/ui-pf/` (separado do shadcn `src/components/ui/`).

## Memories
- [Fluxo de status RC](mem://features/rc-flow) — aguardando_aprovacao → aprovado (PO gerado, vai direto p/ aguardando_entrega) → entregue (solicitante) → fatura_recebida (solicitante anexa NF) → enviado_contabilidade (conferente) → pago (financeiro) → conciliado (financeiro). PO formato `PO#{projectNumber}-{NN}`.
