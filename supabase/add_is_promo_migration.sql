-- ==============================================================================
-- DISTRIBUIDORA ANETH - MIGRACIÓN PARA PRODUCTOS GRATIS / BONIFICACIONES
-- ==============================================================================
-- Ejecutar en el SQL Editor de tu Dashboard de Supabase:
-- https://supabase.com/dashboard/project/sfuhsvudsdjecucgewsq/sql

-- 1. Agregar columna is_promo en order_items si no existe
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT FALSE;

-- 2. Agregar columna is_promo en invoice_items si no existe
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT FALSE;

-- 3. Crear índice para consultas rápidas de promociones
CREATE INDEX IF NOT EXISTS idx_order_items_is_promo ON public.order_items (is_promo) WHERE is_promo = TRUE;
CREATE INDEX IF NOT EXISTS idx_invoice_items_is_promo ON public.invoice_items (is_promo) WHERE is_promo = TRUE;

-- 4. Notificar recarga de schema cache a PostgREST
NOTIFY pgrst, 'reload schema';
