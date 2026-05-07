-- Tabela de Usuários (Profiles) - vinculada opcionalmente ao auth.users do Supabase
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('solicitante', 'aprovador', 'conferente', 'financeiro')),
  avatar text
);

-- Tabela de Clientes
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  doc text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Fornecedores
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text NOT NULL UNIQUE,
  contact text NOT NULL,
  phone text NOT NULL,
  address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Itens (Catálogo)
CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  descricao text NOT NULL,
  marca text,
  unidade text DEFAULT 'UN',
  preco_unitario numeric DEFAULT 0,
  categoria text NOT NULL,
  classe text NOT NULL,
  tipo text NOT NULL,
  link_referencia text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Requisições de Compra (RC)
CREATE TABLE purchase_requests (
  id text PRIMARY KEY, -- ex: 'RC-2024-7042-01'
  project_number text NOT NULL,
  project_client text NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  approver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  requester_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  paid_at timestamp with time zone,
  rejection_reason text,
  discount numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  po_number text,
  invoice_data jsonb, -- { name, date, url }
  paid boolean DEFAULT false,
  notes text,
  delivery_mode text NOT NULL DEFAULT 'entrega',
  delivery_carrier text,
  delivery_address text
);

-- Tabela de Itens da Requisição (Linhas)
CREATE TABLE purchase_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id text REFERENCES purchase_requests(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  qty integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  discount numeric DEFAULT 0,
  is_servico boolean DEFAULT false,
  -- Para serviços (sem ID de catálogo) guardamos também a descrição base
  servico_descricao text
);

-- RLS (Row Level Security) - Habilitando acesso total para simplificar neste MVP (em produção, ajuste para cada role)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions for authenticated users on profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all actions for authenticated users on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all actions for authenticated users on suppliers" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all actions for authenticated users on items" ON items FOR ALL USING (true);
CREATE POLICY "Allow all actions for authenticated users on purchase_requests" ON purchase_requests FOR ALL USING (true);
CREATE POLICY "Allow all actions for authenticated users on purchase_request_items" ON purchase_request_items FOR ALL USING (true);

-- Insert Demo Admin Profile (substitua o e-mail depois por um de login real se for usar Auth)
INSERT INTO profiles (name, email, role, avatar) VALUES 
('Carlos Silva', 'carlos@empresa.com', 'solicitante', 'CS'),
('Ana Gerente', 'ana@empresa.com', 'aprovador', 'AG');
