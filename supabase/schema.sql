-- ============================================================================
-- DISTRIBUIDORA ANETH - ESQUEMA INTEGRAL E IDEMPOTENTE (SUPABASE / POSTGRESQL)
-- Se puede ejecutar múltiples veces sin ningún error (DROP POLICY IF EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Perfil Fiscal de la Empresa Emisora (SRI Ecuador)
CREATE TABLE IF NOT EXISTS public.company_tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruc VARCHAR(13) NOT NULL UNIQUE,
  razon_social TEXT NOT NULL,
  nombre_comercial TEXT,
  dir_matriz TEXT NOT NULL,
  dir_establecimiento TEXT,
  establecimiento VARCHAR(3) NOT NULL DEFAULT '001',
  punto_emision VARCHAR(3) NOT NULL DEFAULT '001',
  current_secuencial INT NOT NULL DEFAULT 1,
  ambiente VARCHAR(1) NOT NULL DEFAULT '1', -- '1': Pruebas Sandbox, '2': Producción
  obligado_contabilidad VARCHAR(2) NOT NULL DEFAULT 'NO',
  regimen_rimpe BOOLEAN NOT NULL DEFAULT true,
  p12_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar perfil fiscal oficial de la distribuidora
INSERT INTO public.company_tax_profiles (
  ruc, razon_social, nombre_comercial, dir_matriz, dir_establecimiento, establecimiento, punto_emision, current_secuencial, ambiente, obligado_contabilidad, regimen_rimpe
) VALUES (
  '1803013810001', 'ANDRADE CONSTANTE ANA ELIZABETH', 'DISTRIBUIDORA ANETH',
  'AV. ATAHUALPA S/N Y TEODORO SOLIS, AMBATO - ECUADOR', 'AV. ATAHUALPA S/N Y TEODORO SOLIS, AMBATO - ECUADOR', '001', '001', 121, '1', 'NO', false
) ON CONFLICT (ruc) DO NOTHING;

-- 2. Directorio de Clientes Comerciales
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_token VARCHAR(100) NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  gender VARCHAR(20) DEFAULT 'Hombre',
  whatsapp_number VARCHAR(30) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address_reference TEXT NOT NULL,
  tax_id VARCHAR(20),
  tax_id_type VARCHAR(2) DEFAULT '07',
  email TEXT,
  credit_limit NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  current_debt NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agregar columnas en caso de que la tabla ya existiera previamente
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS current_debt NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- 3. Catálogo de Productos y Formatos de Javas
CREATE TABLE IF NOT EXISTS public.products (
  id VARCHAR(100) PRIMARY KEY,
  brand VARCHAR(50) NOT NULL DEFAULT 'Fructi',
  beverage_type VARCHAR(30) NOT NULL,
  container VARCHAR(30) NOT NULL,
  size VARCHAR(30) NOT NULL,
  allowed_flavors JSONB NOT NULL DEFAULT '[]'::jsonb,
  units_per_java INT NOT NULL DEFAULT 12,
  price_per_java NUMERIC(10,2) NOT NULL,
  price_distribuidor NUMERIC(10,2),
  price_especial NUMERIC(10,2),
  price_per_unit NUMERIC(10,4),
  image_url TEXT,
  description TEXT,
  stock_javas INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agregar columnas en caso de que la tabla ya existiera previamente
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand VARCHAR(50) DEFAULT 'Fructi';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_distribuidor NUMERIC(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_especial NUMERIC(10,2);

-- Actualizar/Insertar Catálogo Oficial con IVA incluido
INSERT INTO public.products (id, brand, beverage_type, container, size, allowed_flavors, units_per_java, price_per_java, price_per_unit, description, stock_javas)
VALUES
  ('opt-colas-plastico-250', 'Fructi', 'Colas', 'Plástico', '250 ml', '["Piña"]'::jsonb, 12, 2.50, 0.2083, 'Pack de 12 botellas de 250 ml plástico. Sabor Piña.', 100),
  ('opt-colas-plastico-300', 'Fructi', 'Colas', 'Plástico', '300 ml', '["Piña", "Mandarina", "Uva", "Tamarindo", "Mora"]'::jsonb, 12, 3.60, 0.3000, 'Pack de 12 botellas de 300 ml plástico', 120),
  ('opt-colas-plastico-500', 'Fructi', 'Colas', 'Plástico', '500 ml', '["Piña", "Mora"]'::jsonb, 12, 4.10, 0.3417, 'Pack de 12 botellas de 500 ml plástico', 95),
  ('opt-colas-plastico-1500', 'Fructi', 'Colas', 'Plástico', '1.5 Litros', '["Piña", "Mora"]'::jsonb, 12, 10.50, 0.8750, 'Pack de 12 botellas de 1.5 Litros plástico', 65),
  ('opt-colas-plastico-3000', 'Fructi', 'Colas', 'Plástico', '3.0 Litros', '["Piña"]'::jsonb, 6, 10.00, 1.6667, 'Pack de 6 botellas de 3.0 Litros plástico', 40),
  ('opt-colas-vidrio-300', 'Fructi', 'Colas', 'Vidrio', '300 ml', '["Piña", "Mandarina", "Tamarindo", "Mora"]'::jsonb, 24, 8.50, 0.3542, 'Java de 24 botellas de vidrio retornable de 300 ml', 110),
  ('opt-tes-plastico-250', 'Fructi', 'Tés', 'Plástico', '250 ml', '["Lima Limón", "Flor de Jamaica"]'::jsonb, 12, 2.50, 0.2083, 'Pack de 12 botellas de té 250 ml. Sabores: Lima Limón y Flor de Jamaica.', 80),
  ('opt-tes-plastico-550', 'Fructi', 'Tés', 'Plástico', '550 ml', '["Lima Limón", "Flor de Jamaica"]'::jsonb, 12, 5.00, 0.4167, 'Pack de 12 botellas de té 550 ml', 60),
  ('opt-tes-plastico-1500', 'Fructi', 'Tés', 'Plástico', '1.5 Litros', '["Lima Limón", "Flor de Jamaica"]'::jsonb, 6, 5.25, 0.8750, 'Pack de 6 botellas de té 1.5 Litros plástico. Sabores: Lima Limón y Flor de Jamaica.', 60),
  ('opt-aguas-forest-600', 'Forest', 'Aguas', 'Plástico', '600 ml', '["Sin Gas", "Con Gas"]'::jsonb, 12, 3.12, 0.2600, 'Pack de 12 botellas de agua Forest 600 ml', 90),
  ('opt-aguas-forest-1000', 'Forest', 'Aguas', 'Plástico', '1 Litro', '["Sin Gas", "Con Gas"]'::jsonb, 12, 3.96, 0.3300, 'Pack de 12 botellas de agua Forest 1 Litro', 70)
ON CONFLICT (id) DO UPDATE SET
  brand = EXCLUDED.brand,
  beverage_type = EXCLUDED.beverage_type,
  container = EXCLUDED.container,
  size = EXCLUDED.size,
  allowed_flavors = EXCLUDED.allowed_flavors,
  units_per_java = EXCLUDED.units_per_java,
  price_per_java = EXCLUDED.price_per_java,
  price_per_unit = EXCLUDED.price_per_unit,
  description = EXCLUDED.description;

-- 4. Registro de Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  whatsapp_number VARCHAR(30) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address_reference TEXT,
  sale_type VARCHAR(20) NOT NULL DEFAULT 'preventa',
  scheduled_delivery_date TIMESTAMPTZ,
  scheduled_time_slot VARCHAR(50),
  total_javas INT NOT NULL DEFAULT 0,
  total_units INT NOT NULL DEFAULT 0,
  total_bottles INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  debt_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  invoice_id UUID
);

-- Agregar columnas en caso de que la tabla ya existiera previamente
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) NOT NULL DEFAULT 'preventa';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduled_delivery_date TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduled_time_slot VARCHAR(50);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS debt_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promised_collection_date DATE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promised_collection_time VARCHAR(50);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- 5. Items del Pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_option_id VARCHAR(100) REFERENCES public.products(id) ON DELETE SET NULL,
  brand VARCHAR(50) DEFAULT 'Fructi',
  beverage_type VARCHAR(30) NOT NULL,
  container VARCHAR(30) NOT NULL,
  size VARCHAR(30) NOT NULL,
  flavor_type VARCHAR(20) NOT NULL,
  selected_flavor VARCHAR(50),
  surtido_details JSONB,
  quantity_javas INT NOT NULL DEFAULT 0,
  quantity_units INT NOT NULL DEFAULT 0,
  units_per_java INT NOT NULL DEFAULT 12,
  price_per_java NUMERIC(10,2) NOT NULL,
  price_per_unit NUMERIC(10,4) NOT NULL,
  total_bottles INT NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS brand VARCHAR(50) DEFAULT 'Fructi';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS quantity_units INT DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(10,4) DEFAULT 0.0000;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT FALSE;

-- 6. Historial de Pagos y Abonos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
  payment_proof_url TEXT,
  reference_number VARCHAR(100),
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Facturas Electrónicas SRI Ecuador
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(30) NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  clave_acceso VARCHAR(49) NOT NULL UNIQUE,
  ambiente VARCHAR(1) NOT NULL DEFAULT '1',
  sri_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  sri_authorization_number VARCHAR(49),
  sri_authorization_date TIMESTAMPTZ,
  sri_error_message TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  business_name TEXT,
  client_tax_id VARCHAR(20),
  client_tax_id_type VARCHAR(2) DEFAULT '07',
  client_email TEXT,
  client_whatsapp VARCHAR(30),
  client_address TEXT,
  total_javas INT NOT NULL DEFAULT 0,
  total_units INT NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  subtotal_15 NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  subtotal_0 NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  xml_content TEXT,
  xml_url TEXT,
  pdf_ride_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'emitida',
  issued_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Items de la Factura
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_code VARCHAR(50),
  description TEXT NOT NULL,
  quantity_javas INT NOT NULL DEFAULT 0,
  quantity_units INT NOT NULL DEFAULT 0,
  total_quantity NUMERIC(10,2) NOT NULL,
  unit_price NUMERIC(10,4) NOT NULL,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  iva_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  subtotal NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL
);

ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS is_promo BOOLEAN DEFAULT FALSE;

-- 9. Habilitar RLS en todas las tablas
ALTER TABLE public.company_tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS Idempotentes (Elimina si existen antes de recrear)
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read clients" ON public.clients;
CREATE POLICY "Public read clients" ON public.clients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert clients" ON public.clients;
CREATE POLICY "Public insert clients" ON public.clients FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update clients" ON public.clients;
CREATE POLICY "Public update clients" ON public.clients FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete clients" ON public.clients;
CREATE POLICY "Public delete clients" ON public.clients FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read own orders" ON public.orders;
CREATE POLICY "Public read own orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public update orders" ON public.orders;
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read order items" ON public.order_items;
CREATE POLICY "Public read order items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert order items" ON public.order_items;
CREATE POLICY "Public insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read invoices" ON public.invoices;
CREATE POLICY "Public read invoices" ON public.invoices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert invoices" ON public.invoices;
CREATE POLICY "Public insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read invoice items" ON public.invoice_items;
CREATE POLICY "Public read invoice items" ON public.invoice_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert invoice items" ON public.invoice_items;
CREATE POLICY "Public insert invoice items" ON public.invoice_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert payments" ON public.payments;
CREATE POLICY "Public insert payments" ON public.payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public read payments" ON public.payments;
CREATE POLICY "Public read payments" ON public.payments FOR SELECT USING (true);

-- ============================================================================
-- 11. Índices de Alto Rendimiento para Escalabilidad y Cero Cuellos de Botella
-- ============================================================================
-- Acelera consultas por fecha de pedido y filtros de despachos pendientes/entregados
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders (scheduled_delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);

-- Acelera la vinculación de productos de cada pedido
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_option_id ON public.order_items (product_option_id);

-- Acelera la búsqueda de clientes por teléfono y token QR
CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON public.clients (whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_clients_qr_token ON public.clients (qr_token);
CREATE INDEX IF NOT EXISTS idx_clients_tax_id ON public.clients (tax_id);

-- Acelera consultas de comprobantes electrónicos y pagos
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices (order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments (client_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);

