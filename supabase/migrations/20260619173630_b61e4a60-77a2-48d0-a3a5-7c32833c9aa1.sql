
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'solicitante', 'aprovador', 'conferente', 'financeiro');

CREATE TYPE public.rc_status AS ENUM (
  'rascunho', 'aguardando_aprovacao', 'aprovado', 'rejeitado',
  'em_cotacao', 'po_emitido', 'em_conferencia', 'conferido', 'pago', 'cancelado'
);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  avatar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'solicitante')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  doc text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view clients" ON public.clients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update clients" ON public.clients
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete clients" ON public.clients
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text NOT NULL UNIQUE,
  contact text NOT NULL,
  phone text NOT NULL,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view suppliers" ON public.suppliers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage suppliers" ON public.suppliers
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update suppliers" ON public.suppliers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete suppliers" ON public.suppliers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ITEMS
-- ============================================================
CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  descricao text NOT NULL,
  marca text,
  unidade text NOT NULL DEFAULT 'UN',
  preco_unitario numeric NOT NULL DEFAULT 0,
  categoria text NOT NULL,
  classe text NOT NULL,
  tipo text NOT NULL,
  link_referencia text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view items" ON public.items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage items" ON public.items
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update items" ON public.items
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete items" ON public.items
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PURCHASE REQUESTS (RC)
-- ============================================================
CREATE TABLE public.purchase_requests (
  id text PRIMARY KEY,
  project_number text NOT NULL,
  project_client text NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  approver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status public.rc_status NOT NULL DEFAULT 'rascunho',
  discount numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  po_number text,
  invoice_data jsonb,
  paid boolean NOT NULL DEFAULT false,
  notes text,
  delivery_mode text NOT NULL DEFAULT 'entrega',
  delivery_carrier text,
  delivery_address text,
  rejection_reason text,
  approved_at timestamptz,
  rejected_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_requests TO authenticated;
GRANT ALL ON public.purchase_requests TO service_role;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view RCs" ON public.purchase_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Requesters create own RC" ON public.purchase_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Requesters update own draft, approvers/admins update any" ON public.purchase_requests
  FOR UPDATE TO authenticated USING (
    (auth.uid() = requester_id AND status = 'rascunho')
    OR public.has_role(auth.uid(), 'aprovador')
    OR public.has_role(auth.uid(), 'conferente')
    OR public.has_role(auth.uid(), 'financeiro')
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Requesters delete own draft, admins any" ON public.purchase_requests
  FOR DELETE TO authenticated USING (
    (auth.uid() = requester_id AND status = 'rascunho')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER trg_purchase_requests_updated_at
  BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pr_requester ON public.purchase_requests(requester_id);
CREATE INDEX idx_pr_status ON public.purchase_requests(status);
CREATE INDEX idx_pr_supplier ON public.purchase_requests(supplier_id);

-- ============================================================
-- PURCHASE REQUEST ITEMS
-- ============================================================
CREATE TABLE public.purchase_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_request_id text NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price numeric NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  discount numeric NOT NULL DEFAULT 0 CHECK (discount >= 0),
  is_servico boolean NOT NULL DEFAULT false,
  servico_descricao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_request_items TO authenticated;
GRANT ALL ON public.purchase_request_items TO service_role;
ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view RC items" ON public.purchase_request_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage items of accessible RC" ON public.purchase_request_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_requests pr
      WHERE pr.id = purchase_request_id
        AND (
          (pr.requester_id = auth.uid() AND pr.status = 'rascunho')
          OR public.has_role(auth.uid(), 'aprovador')
          OR public.has_role(auth.uid(), 'conferente')
          OR public.has_role(auth.uid(), 'financeiro')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_requests pr
      WHERE pr.id = purchase_request_id
        AND (
          (pr.requester_id = auth.uid() AND pr.status = 'rascunho')
          OR public.has_role(auth.uid(), 'aprovador')
          OR public.has_role(auth.uid(), 'conferente')
          OR public.has_role(auth.uid(), 'financeiro')
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE INDEX idx_pri_pr ON public.purchase_request_items(purchase_request_id);
