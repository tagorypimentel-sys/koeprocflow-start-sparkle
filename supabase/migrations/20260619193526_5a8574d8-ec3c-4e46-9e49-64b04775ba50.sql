
-- Snapshot columns on purchase_request_items so deleted catalog items don't break old RCs and services don't need a catalog row
ALTER TABLE public.purchase_request_items
  ADD COLUMN IF NOT EXISTS item_codigo text,
  ADD COLUMN IF NOT EXISTS item_descricao text,
  ADD COLUMN IF NOT EXISTS item_marca text,
  ADD COLUMN IF NOT EXISTS item_unidade text,
  ADD COLUMN IF NOT EXISTS item_categoria text,
  ADD COLUMN IF NOT EXISTS item_classe text,
  ADD COLUMN IF NOT EXISTS item_tipo text,
  ADD COLUMN IF NOT EXISTS item_link_referencia text;

-- RFQ header
CREATE TABLE public.rfqs (
  id text PRIMARY KEY,
  numero_rfq text NOT NULL,
  numero_projeto text NOT NULL,
  nome_projeto text NOT NULL DEFAULT '',
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  data_limite_entrega date,
  observacoes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfqs TO authenticated;
GRANT ALL ON public.rfqs TO service_role;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view RFQs" ON public.rfqs FOR SELECT USING (true);
CREATE POLICY "Authenticated create RFQ" ON public.rfqs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creator or admin update RFQ" ON public.rfqs FOR UPDATE
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Creator or admin delete RFQ" ON public.rfqs FOR DELETE
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_rfqs_updated_at BEFORE UPDATE ON public.rfqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RFQ items
CREATE TABLE public.rfq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id text NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.items(id) ON DELETE SET NULL,
  codigo text NOT NULL,
  descricao text NOT NULL,
  unidade text NOT NULL DEFAULT 'UN',
  qty integer NOT NULL DEFAULT 1,
  referencia text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rfq_items TO authenticated;
GRANT ALL ON public.rfq_items TO service_role;
ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view RFQ items" ON public.rfq_items FOR SELECT USING (true);
CREATE POLICY "Manage items of own RFQ" ON public.rfq_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.rfqs r WHERE r.id = rfq_id
      AND (r.created_by = auth.uid() OR public.has_role(auth.uid(),'admin'))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.rfqs r WHERE r.id = rfq_id
      AND (r.created_by = auth.uid() OR public.has_role(auth.uid(),'admin'))
  ));
