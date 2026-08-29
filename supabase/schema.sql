-- ============================================================================
-- DISTRIBUIDORA ANETH - ESQUEMA INTEGRAL DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- Incluye: Clientes, Créditos/Deudas, Venta Mixta, Preventa/Autoventa, Pagos DeUna/Transferencia y Facturación SRI
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
  obligado_contabilidad VARCHAR(2) NOT NULL DEFAULT 'NO', -- 'SI' o 'NO'
  regimen_rimpe BOOLEAN NOT NULL DEFAULT true,
  p12_storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar perfil fiscal inicial
INSERT INTO public.company_tax_profiles (
  ruc,
  razon_social,
  nombre_comercial,
  dir_matriz,
  establecimiento,
  punto_emision,
  ambiente,
  obligado_contabilidad,
  regimen_rimpe
) VALUES (
  '1792345678001',
  'DISTRIBUIDORA ANETH BEVERAGES S.A.S.',
  'DISTRIBUIDORA ANETH',
  'Av. 6 de Diciembre y Orellana, Quito - Ecuador',
  '001',
  '001',
  '1',
  'NO',
  true
) ON CONFLICT (ruc) DO NOTHING;

-- 2. Directorio de Clientes Comerciales (Con Control de Crédito y Deuda)
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
  tax_id VARCHAR(20), -- Cédula o RUC
  tax_id_type VARCHAR(2) DEFAULT '07', -- '04': RUC, '05': Cédula, '07': Consumidor Final
  email TEXT,
  credit_limit NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Cupo máximo de fiado/crédito
  current_debt NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Deuda acumulada total
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Catálogo de Productos y Formatos de Javas
CREATE TABLE IF NOT EXISTS public.products (
  id VARCHAR(100) PRIMARY KEY,
  beverage_type VARCHAR(30) NOT NULL, -- 'Colas', 'Aguas', 'Tés'
  container VARCHAR(30) NOT NULL, -- 'Plástico', 'Vidrio'
  size VARCHAR(30) NOT NULL, -- '250 ml', '300 ml', '500 ml', '1.5 Litros', '3.0 Litros'
  allowed_flavors JSONB NOT NULL DEFAULT '[]'::jsonb,
  units_per_java INT NOT NULL DEFAULT 12,
  price_per_java NUMERIC(10,2) NOT NULL,
  price_per_unit NUMERIC(10,4),
  image_url TEXT,
  description TEXT,
  stock_javas INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Registro de Pedidos (Preventa, Autoventa, Entregas Programadas y Saldos Deudores)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE, -- ej: 'ORD-00101'
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  whatsapp_number VARCHAR(30) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address_reference TEXT,
  
  -- Modalidades de Venta y Despacho
  sale_type VARCHAR(20) NOT NULL DEFAULT 'preventa', -- 'preventa', 'autoventa'
  scheduled_delivery_date TIMESTAMPTZ, -- Fecha y hora específica de despacho
  scheduled_time_slot VARCHAR(50), -- ej: 'Mañana 09:00 - 11:00'
  
  -- Cantidades Mixtas
  total_javas INT NOT NULL DEFAULT 0,
  total_units INT NOT NULL DEFAULT 0,
  total_bottles INT NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  
  -- Estado y Pagos
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'scheduled', 'delivered', 'cancelled'
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'partial', 'paid'
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash', -- 'cash', 'transfer', 'deuna', 'credit'
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Monto pagado / abonado
  debt_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Saldo pendiente por cobrar
  payment_proof_url TEXT, -- Comprobante DeUna o Transferencia bancaria
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  invoice_id UUID
);

-- 5. Items del Pedido (Soporte Venta Mixta: Javas + Unidades Sueltas)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_option_id VARCHAR(100) REFERENCES public.products(id) ON DELETE SET NULL,
  beverage_type VARCHAR(30) NOT NULL,
  container VARCHAR(30) NOT NULL,
  size VARCHAR(30) NOT NULL,
  flavor_type VARCHAR(20) NOT NULL, -- 'single' o 'surtido'
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

-- 6. Historial de Pagos y Abonos (Comprobantes DeUna / Transferencia / Efectivo)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash', -- 'cash', 'transfer', 'deuna'
  payment_proof_url TEXT, -- Enlace o foto del comprobante
  reference_number VARCHAR(100), -- Número de referencia o código de transacción
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Facturas Electrónicas SRI Ecuador
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(30) NOT NULL UNIQUE, -- ej: '001-001-000000099'
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  clave_acceso VARCHAR(49) NOT NULL UNIQUE,
  ambiente VARCHAR(1) NOT NULL DEFAULT '1', -- '1': Pruebas, '2': Producción
  sri_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'RECIBIDA', 'DEVUELTA', 'AUTORIZADO', 'NO AUTORIZADO'
  sri_authorization_number VARCHAR(49),
  sri_authorization_date TIMESTAMPTZ,
  sri_error_message TEXT,
  
  -- Cliente
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  business_name TEXT,
  client_tax_id VARCHAR(20),
  client_tax_id_type VARCHAR(2) DEFAULT '07',
  client_email TEXT,
  client_whatsapp VARCHAR(30),
  client_address TEXT,
  
  -- Totales
  total_javas INT NOT NULL DEFAULT 0,
  total_units INT NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  subtotal_15 NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  subtotal_0 NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  
  -- Storage
  xml_content TEXT,
  xml_url TEXT,
  pdf_ride_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'emitida', -- 'emitida', 'pagada', 'anulada'
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

-- 9. Políticas de Seguridad RLS
ALTER TABLE public.company_tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public read invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Public insert payments" ON public.payments FOR INSERT WITH CHECK (true);
