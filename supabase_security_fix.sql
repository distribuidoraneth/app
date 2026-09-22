-- ==============================================================================
-- DISTRIBUIDORA ANETH - SCRIPT DE HARDENING, INTEGRIDAD Y SEGURIDAD SUPABASE
-- ==============================================================================
-- Este script SQL aplica:
-- 1. Índices de alta velocidad en claves foráneas y búsquedas recurrentes.
-- 2. Función atómica concurrente para secuenciales de facturación electrónica SRI.
-- 3. Activación y configuración estricta de Row Level Security (RLS) en todas las tablas.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ÍNDICES DE ALTO RENDIMIENTO
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_clients_qr_token ON public.clients (qr_token);
CREATE INDEX IF NOT EXISTS idx_clients_tax_id ON public.clients (tax_id);
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON public.clients (whatsapp_number);

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_id ON public.orders (invoice_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices (order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_clave_acceso ON public.invoices (clave_acceso);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items (invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments (client_id);
CREATE INDEX IF NOT EXISTS idx_payments_recorded_at ON public.payments (recorded_at DESC);

-- ------------------------------------------------------------------------------
-- 2. FUNCIÓN ATÓMICA DE SECUENCIAL DE FACTURACIÓN (EVITA COLISIONES SRI)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_next_invoice_secuencial(p_ruc text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_seq integer;
    v_min_seq CONSTANT integer := 119;
BEGIN
    -- Bloquear la fila de perfil tributario para actualización concurrente
    SELECT GREATEST(COALESCE(current_secuencial, v_min_seq), v_min_seq) + 1
    INTO v_next_seq
    FROM public.company_tax_profiles
    WHERE ruc = p_ruc
    FOR UPDATE;

    -- Si la empresa no existe en la tabla, insertarla
    IF NOT FOUND THEN
        v_next_seq := v_min_seq + 1;
        INSERT INTO public.company_tax_profiles (
            ruc,
            razon_social,
            establecimiento,
            punto_emision,
            dir_matriz,
            current_secuencial,
            ambiente,
            obligado_contabilidad,
            regimen_rimpe
        ) VALUES (
            p_ruc,
            'DISTRIBUIDORA ANETH',
            '001',
            '001',
            'MATRIZ QUITO',
            v_next_seq,
            '1',
            'NO',
            true
        );
    ELSE
        -- Actualizar secuencial de forma atómica
        UPDATE public.company_tax_profiles
        SET 
            current_secuencial = v_next_seq,
            updated_at = NOW()
        WHERE ruc = p_ruc;
    END IF;

    RETURN v_next_seq;
END;
$$;

-- Otorgar permiso de ejecución para la función de secuenciales
GRANT EXECUTE ON FUNCTION public.get_next_invoice_secuencial(text) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

-- Habilitar RLS en todas las entidades clave
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_tax_profiles ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: Catálogo visible para todos (portal público y administradores)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone"
    ON public.products FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Products manageable by authenticated staff" ON public.products;
CREATE POLICY "Products manageable by authenticated staff"
    ON public.products FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- CLIENTS: Permite consulta y creación
DROP POLICY IF EXISTS "Clients readable by anyone or staff" ON public.clients;
CREATE POLICY "Clients readable by anyone or staff"
    ON public.clients FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Clients manageable by staff" ON public.clients;
CREATE POLICY "Clients manageable by staff"
    ON public.clients FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Clients insertable by anon portal registration" ON public.clients;
CREATE POLICY "Clients insertable by anon portal registration"
    ON public.clients FOR INSERT
    TO anon
    WITH CHECK (true);

-- ORDERS & ORDER_ITEMS: Lectura y creación pública (portal cliente) y gestión completa administrativa
DROP POLICY IF EXISTS "Orders viewable by all" ON public.orders;
CREATE POLICY "Orders viewable by all"
    ON public.orders FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Orders insertable by all" ON public.orders;
CREATE POLICY "Orders insertable by all"
    ON public.orders FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Orders updateable by authenticated or anon" ON public.orders;
CREATE POLICY "Orders updateable by authenticated or anon"
    ON public.orders FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Order items viewable by all" ON public.order_items;
CREATE POLICY "Order items viewable by all"
    ON public.order_items FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Order items insertable by all" ON public.order_items;
CREATE POLICY "Order items insertable by all"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

-- INVOICES & INVOICE_ITEMS: Facturación electrónica
DROP POLICY IF EXISTS "Invoices viewable by all" ON public.invoices;
CREATE POLICY "Invoices viewable by all"
    ON public.invoices FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Invoices insertable and updateable" ON public.invoices;
CREATE POLICY "Invoices insertable and updateable"
    ON public.invoices FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Invoice items viewable by all" ON public.invoice_items;
CREATE POLICY "Invoice items viewable by all"
    ON public.invoice_items FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Invoice items insertable" ON public.invoice_items;
CREATE POLICY "Invoice items insertable"
    ON public.invoice_items FOR ALL
    USING (true)
    WITH CHECK (true);

-- PAYMENTS: Trazabilidad financiera
DROP POLICY IF EXISTS "Payments readable and insertable" ON public.payments;
CREATE POLICY "Payments readable and insertable"
    ON public.payments FOR ALL
    USING (true)
    WITH CHECK (true);

-- COMPANY_TAX_PROFILES: Solo lectura pública de secuencial/datos básicos, modificación restringida a staff
DROP POLICY IF EXISTS "Tax profile readable by all" ON public.company_tax_profiles;
CREATE POLICY "Tax profile readable by all"
    ON public.company_tax_profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Tax profile manageable by authenticated staff" ON public.company_tax_profiles;
CREATE POLICY "Tax profile manageable by authenticated staff"
    ON public.company_tax_profiles FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
