-- ============================================================
-- RCV Generator - Esquema Completo de Base de Datos (Supabase)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLA DE CLIENTES (ASEGURADOS / BENEFICIARIOS)
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  cedula_rif TEXT NOT NULL UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABLA DE VEHÍCULOS
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  plate TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  class TEXT NOT NULL DEFAULT 'MOTO',
  type TEXT NOT NULL DEFAULT 'PASEO',
  use_type TEXT NOT NULL DEFAULT 'PARTICULAR',
  vin TEXT,
  capacity_persons INTEGER DEFAULT 2,
  capacity_load TEXT DEFAULT '150 kgs',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. TABLA DE PÓLIZAS (CONTRATOS RCV)
-- ============================================================
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  policy_number TEXT UNIQUE NOT NULL,
  receipt_number TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  emission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  premium_amount NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_type TEXT NOT NULL DEFAULT 'CONTADO',
  advisor TEXT DEFAULT 'OFICINA PRINCIPAL',
  supervisor TEXT DEFAULT 'GERENCIA GENERAL',
  pdf_url TEXT,
  qr_url TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TABLA DE COBERTURAS / GARANTÍAS CONTRATADAS
-- ============================================================
CREATE TABLE IF NOT EXISTS coverages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  coverage_type TEXT NOT NULL,
  coverage_amount NUMERIC(10, 2),
  included BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES DE BÚSQUEDA Y FILTRACIÓN RÁPIDA
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_cedula_rif ON clients(cedula_rif);
CREATE INDEX IF NOT EXISTS idx_clients_full_name ON clients(full_name);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_policies_client_id ON policies(client_id);
CREATE INDEX IF NOT EXISTS idx_policies_vehicle_id ON policies(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_coverages_policy_id ON coverages(policy_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverages ENABLE ROW LEVEL SECURITY;

-- Lectura pública para la página del QR (/rcv/[id])
DROP POLICY IF EXISTS "Public read policies" ON policies;
CREATE POLICY "Public read policies" ON policies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read clients" ON clients;
CREATE POLICY "Public read clients" ON clients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read vehicles" ON vehicles;
CREATE POLICY "Public read vehicles" ON vehicles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read coverages" ON coverages;
CREATE POLICY "Public read coverages" ON coverages FOR SELECT USING (true);

-- Acceso completo para la aplicación
DROP POLICY IF EXISTS "Admin full access clients" ON clients;
CREATE POLICY "Admin full access clients" ON clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access vehicles" ON vehicles;
CREATE POLICY "Admin full access vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access policies" ON policies;
CREATE POLICY "Admin full access policies" ON policies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access coverages" ON coverages;
CREATE POLICY "Admin full access coverages" ON coverages FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- STORAGE BUCKETS (FOTOS DE CLIENTES Y PDFS DE PÓLIZAS)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('rcv-pdfs', 'rcv-pdfs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access rcv-pdfs" ON storage.objects;
CREATE POLICY "Public Access rcv-pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'rcv-pdfs');

DROP POLICY IF EXISTS "Auth Upload rcv-pdfs" ON storage.objects;
CREATE POLICY "Auth Upload rcv-pdfs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'rcv-pdfs');

DROP POLICY IF EXISTS "Public Access client-photos" ON storage.objects;
CREATE POLICY "Public Access client-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-photos');

DROP POLICY IF EXISTS "Auth Upload client-photos" ON storage.objects;
CREATE POLICY "Auth Upload client-photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client-photos');
