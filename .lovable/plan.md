

## Plano: Sistema de Compras (com leitura das diretrizes)

### Etapa 0 — Ler as diretrizes enviadas
Antes de codar qualquer coisa, vou:
1. Descompactar `files.zip` em `/tmp/diretrizes/`.
2. Ler `LOVABLE_GUIDE.md` e demais arquivos (imagens, paleta, fontes, exemplos).
3. Aplicar **exatamente** o que estiver definido (cores, tipografia, layout, fluxo, regras de negócio) ao design system (`src/index.css` + `tailwind.config.ts`) e à arquitetura.
4. Salvar as regras-chave em `mem://` para que eu siga em todas as próximas iterações.

Se as diretrizes forem incompatíveis com algum ponto abaixo, as **diretrizes prevalecem** — eu ajusto o plano e te aviso antes de seguir.

### Etapa 1 — Fundação (frontend)
- Configurar design system conforme as diretrizes (tokens HSL em `index.css`, extensão do Tailwind, fontes).
- Estrutura base de rotas em `App.tsx`:
  - `/` Catálogo de produtos
  - `/produto/:id` Detalhe
  - `/carrinho` Carrinho
  - `/checkout` Finalização
  - `/pedidos` Meus pedidos
  - `/admin` Painel (gestão de produtos/pedidos)
- Layout com Header (logo, busca, ícone carrinho com contador) e Footer.

### Etapa 2 — Backend (Lovable Cloud)
Ativar Lovable Cloud para ter banco + auth sem configuração externa.

Tabelas:
- `profiles` (id, nome, telefone, endereço)
- `user_roles` (user_id, role: admin | customer) — em tabela separada com função `has_role` (segurança)
- `products` (id, nome, descrição, preço, estoque, imagem, categoria, ativo)
- `categories` (id, nome, slug)
- `cart_items` (id, user_id, product_id, quantidade)
- `orders` (id, user_id, total, status, endereço_entrega, criado_em)
- `order_items` (id, order_id, product_id, quantidade, preço_unitário)

RLS em todas as tabelas. Admin gerencia tudo; cliente só vê/edita o próprio carrinho e pedidos.

### Etapa 3 — Funcionalidades
- **Auth**: cadastro/login por e-mail+senha, com auto-confirm para facilitar testes.
- **Catálogo**: listagem com filtro por categoria e busca.
- **Carrinho**: adicionar/remover/alterar quantidade, persistido no banco para usuário logado.
- **Checkout**: confirmação de endereço, criação do pedido, baixa de estoque, esvaziar carrinho.
- **Meus pedidos**: histórico com status (pendente, aprovado, enviado, entregue, cancelado).
- **Admin**: CRUD de produtos/categorias e gestão de status dos pedidos.

### Etapa 4 — Polimento
- Toasts de feedback, estados de loading e vazio, responsivo (mobile-first), acessibilidade básica.

### O que ainda preciso confirmar com você (após ler o zip)
1. **Tipo de sistema**: e-commerce B2C, procurement corporativo (com fluxo de aprovação), marketplace ou lista pessoal? O escopo acima assume **e-commerce B2C** — me avise se for outro.
2. **Pagamento**: integrar Stripe agora ou deixar checkout simulado nesta primeira versão?
3. **Idioma**: PT-BR em toda a interface, correto?

Pode aprovar para eu já ler o zip e começar pela Etapa 0 + 1. Se preferir responder as 3 perguntas antes, também funciona.

