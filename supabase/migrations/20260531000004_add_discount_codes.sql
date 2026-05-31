CREATE TABLE IF NOT EXISTS public.discount_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL CHECK (type IN ('percent', 'flat')),
  value       NUMERIC(10,0) NOT NULL CHECK (value > 0),
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  min_amount  NUMERIC(10,0) NOT NULL DEFAULT 0,
  max_uses    INT,
  used_count  INT NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cho phép client đọc để validate (không lộ value — chỉ qua API)
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discount_codes_service_only"
  ON public.discount_codes
  USING (auth.role() = 'service_role');

-- Thêm discount_code_id + discount_amount vào orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES public.discount_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount   NUMERIC(10,0) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_amount   NUMERIC(10,0);

-- Hàm atomic tăng used_count (tránh race condition)
CREATE OR REPLACE FUNCTION public.increment_discount_used(p_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.discount_codes SET used_count = used_count + 1 WHERE id = p_id;
$$;
