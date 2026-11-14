-- ==============================================================================
-- MEDIZEN / FEMESALUD - ESQUEMA COMPLETO Y CONSOLIDADO DE BASE DE DATOS
-- ARQUITECTURA MULTI-TENANT NATIVA, SUPER ADMINISTRADOR SAAS Y TIEMPO REAL
-- ==============================================================================
-- Este script crea y actualiza de forma limpia, idempotente y ordenada toda la
-- estructura relacional multi-clínica, tablas, tipos, secuencias, funciones
-- almacenadas (RPC), disparadores (triggers), índices compuestos por clínica,
-- políticas de seguridad RLS estrictas, publicación Supabase Realtime en todas
-- las tablas y datos semilla iniciales para operar como plataforma SaaS.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TIPOS Y ENUMS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'recepcionista', 'superadmin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.visit_type_enum AS ENUM ('CONTROL', 'EMERGENCIA', 'CONSULTA_NUEVA', 'POST_TRATAMIENTO', 'OTRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. SECUENCIAS
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.historia_number_seq START WITH 3000;

-- ------------------------------------------------------------------------------
-- 4. TABLA MAESTRA DE CLÍNICAS (ORGANIZACIONES / TENANTS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinicas (
  id_clinica uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(60) UNIQUE NOT NULL,
  nombre varchar(150) NOT NULL,
  rif varchar(50),
  telefono varchar(50),
  direccion text,
  email_contacto varchar(150),
  plan_suscripcion varchar(50) DEFAULT 'pro', -- 'basico' ($15), 'pro' ($25), 'enterprise' ($45)
  estado varchar(20) DEFAULT 'activo',        -- 'activo', 'suspendido', 'demo'
  logo_url text,
  color_primario varchar(20) DEFAULT '#0ea5e9',
  tipo_clinica text DEFAULT 'Consultorio Ginecológico Obstétrico',
  header_receta text DEFAULT 'Atención Médica Especializada',
  footer_receta text DEFAULT 'Citas y emergencias al número de contacto.',
  fuente_receta varchar(50) DEFAULT 'Inter',
  notas_internas text,                        -- Metadatos SaaS JSON (pagos, corte, notas, anuncio global)
  creado_en timestamptz DEFAULT now(),
  actualizado_en timestamptz DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. SEGURIDAD, ROLES Y GESTIÓN DE PERSONAL
-- ------------------------------------------------------------------------------

-- Tabla de Roles del Sistema
CREATE TABLE IF NOT EXISTS public.roles (
  id_rol serial PRIMARY KEY,
  nombre_rol varchar(50) NOT NULL UNIQUE,
  descripcion text
);

-- Tabla de Usuarios del Sistema (vinculados a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id_usuario serial PRIMARY KEY,
  auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE SET NULL,
  es_superadmin boolean DEFAULT false,
  nombre_usuario varchar(100) NOT NULL,
  contrasena_hash text NOT NULL DEFAULT 'supabase_auth',
  id_rol integer REFERENCES public.roles(id_rol) ON DELETE SET NULL,
  pin_seguridad varchar(10),
  estado boolean DEFAULT true,
  creado_en timestamptz DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. FUNCIONES HELPER DE CONTEXTO MULTI-TENANT
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_clinic_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public AS $$
  SELECT id_clinica 
  FROM public.usuarios 
  WHERE auth_id = auth.uid() 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT es_superadmin FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1),
    false
  );
$$;

ALTER TABLE public.usuarios
  ALTER COLUMN id_clinica SET DEFAULT public.current_user_clinic_id();

-- Catálogo de Especialidades Médicas
CREATE TABLE IF NOT EXISTS public.especialidades (
  id_especialidad serial PRIMARY KEY,
  nombre varchar(100) NOT NULL UNIQUE
);

-- Personal Médico / Especialistas
CREATE TABLE IF NOT EXISTS public.medicos (
  id_medico serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_usuario integer UNIQUE REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  id_especialidad integer REFERENCES public.especialidades(id_especialidad) ON DELETE SET NULL,
  nombre varchar(100) NOT NULL,
  apellido varchar(100) NOT NULL,
  email varchar(150),
  telefono varchar(50),
  numero_licencia varchar(50), -- MPPS
  universidad varchar(150),
  cmc varchar(50),             -- Colegio Médico
  estado boolean DEFAULT true
);

-- Horarios Semanales de Médicos
CREATE TABLE IF NOT EXISTS public.horarios_medicos (
  id_horario serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_medico integer REFERENCES public.medicos(id_medico) ON DELETE CASCADE,
  dia_semana integer CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. EXPEDIENTE CLÍNICO Y PACIENTES (CON id_clinica Y UNICIDAD POR CLÍNICA)
-- ------------------------------------------------------------------------------

-- Pacientes Registrados
CREATE TABLE IF NOT EXISTS public.pacientes (
  id_paciente serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  documento_identidad varchar(50) NOT NULL,
  nombre varchar(100) NOT NULL,
  apellido varchar(100) NOT NULL,
  fecha_nacimiento date,
  genero varchar(20),
  telefono varchar(50),
  email varchar(150),
  contacto_emergencia varchar(150),
  direccion text,
  creado_en timestamptz DEFAULT now()
);

-- Eliminar restricciones UNIQUE globales antiguas en pacientes y aplicar unicidad por clínica
ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS pacientes_documento_identidad_key;
ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS pacientes_email_key;
DROP INDEX IF EXISTS public.pacientes_documento_identidad_key;
DROP INDEX IF EXISTS public.pacientes_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS pacientes_clinica_documento_unique
  ON public.pacientes (id_clinica, documento_identidad)
  WHERE documento_identidad IS NOT NULL AND documento_identidad <> '';

CREATE UNIQUE INDEX IF NOT EXISTS pacientes_clinica_email_unique
  ON public.pacientes (id_clinica, email)
  WHERE email IS NOT NULL AND email <> '';

-- Historias Clínicas (Expediente General 1:1)
CREATE TABLE IF NOT EXISTS public.historias_clinicas (
  id_historia serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_paciente integer UNIQUE REFERENCES public.pacientes(id_paciente) ON DELETE CASCADE,
  tipo_sangre varchar(10),
  alergias text,
  enfermedades_cronicas text,
  antecedentes_familiares text,
  datos_extras jsonb DEFAULT '{}'::jsonb,
  actualizado_en timestamptz DEFAULT now()
);

-- Turnos y Citas en Agenda
CREATE TABLE IF NOT EXISTS public.citas (
  id_cita serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_paciente integer REFERENCES public.pacientes(id_paciente) ON DELETE CASCADE,
  id_medico integer REFERENCES public.medicos(id_medico) ON DELETE SET NULL,
  fecha_hora timestamptz NOT NULL,
  estado varchar(50) DEFAULT 'programada',
  motivo text
);

-- Consultas Médicas y Evoluciones Clínicas
CREATE TABLE IF NOT EXISTS public.consultas (
  id_consulta serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_cita integer UNIQUE REFERENCES public.citas(id_cita) ON DELETE SET NULL,
  id_historia integer REFERENCES public.historias_clinicas(id_historia) ON DELETE CASCADE,
  id_medico integer REFERENCES public.medicos(id_medico) ON DELETE SET NULL,
  fecha_hora timestamptz DEFAULT now(),
  motivo_consulta text,
  sintomas text,
  diagnostico text,
  notas_medicas text,
  peso_kg numeric(5,1),
  presion_arterial varchar(20),
  temperatura_c numeric(4,1)
);

-- Insumos Consumidos durante la Consulta
CREATE TABLE IF NOT EXISTS public.insumos_consulta (
  id_insumo_consulta serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_consulta integer REFERENCES public.consultas(id_consulta) ON DELETE CASCADE,
  nombre_insumo varchar(150) NOT NULL,
  cantidad numeric(10,2) NOT NULL DEFAULT 1.0,
  unidad varchar(50),
  creado_en timestamptz DEFAULT now()
);

-- Catálogo de Medicamentos
CREATE TABLE IF NOT EXISTS public.catalogo_medicamentos (
  id_medicamento serial PRIMARY KEY,
  nombre_generico varchar(150) NOT NULL,
  nombre_comercial varchar(150),
  presentacion varchar(100),
  concentracion varchar(100)
);

-- Récipes / Prescripciones Médicas
CREATE TABLE IF NOT EXISTS public.recetas (
  id_receta serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_consulta integer REFERENCES public.consultas(id_consulta) ON DELETE CASCADE,
  fecha_emision timestamptz DEFAULT now()
);

-- Detalles de Receta (Líneas de Prescripción)
CREATE TABLE IF NOT EXISTS public.detalles_receta (
  id_detalle_receta serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_receta integer REFERENCES public.recetas(id_receta) ON DELETE CASCADE,
  id_medicamento integer REFERENCES public.catalogo_medicamentos(id_medicamento) ON DELETE SET NULL,
  dosis varchar(100),
  frecuencia varchar(100),
  duracion_dias integer,
  indicaciones_adicionales text
);

-- Verificación Oficial de Récipes y Documentos Clínicos (QR / Código)
CREATE TABLE IF NOT EXISTS public.document_verifications (
  id varchar(60) PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  document_type varchar(80) NOT NULL DEFAULT 'Récipe Médico',
  doctor_name varchar(150) NOT NULL,
  doctor_license varchar(80),
  patient_initials varchar(50),
  clinic_name varchar(150),
  issued_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Exámenes de Laboratorio
CREATE TABLE IF NOT EXISTS public.examenes_laboratorio (
  id_examen serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_consulta integer REFERENCES public.consultas(id_consulta) ON DELETE SET NULL,
  id_paciente integer REFERENCES public.pacientes(id_paciente) ON DELETE CASCADE,
  tipo_examen varchar(150) NOT NULL,
  resultados_texto text,
  fecha_resultado timestamptz,
  archivo_adjunto text
);

-- Archivos Adjuntos del Paciente (Estudios, Imágenes, PDFs)
CREATE TABLE IF NOT EXISTS public.archivos_pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_paciente integer REFERENCES public.pacientes(id_paciente) ON DELETE CASCADE,
  nombre_archivo text NOT NULL,
  ruta_archivo text NOT NULL,
  tipo_archivo text,
  tamano_bytes bigint,
  fecha_subida timestamptz DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. FACTURACIÓN, FINANZAS Y ADMINISTRACIÓN (CON id_clinica)
-- ------------------------------------------------------------------------------

-- Portafolio de Servicios Clínicos
CREATE TABLE IF NOT EXISTS public.servicios (
  id_servicio serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_especialidad integer REFERENCES public.especialidades(id_especialidad) ON DELETE SET NULL,
  codigo_medico varchar(50),
  nombre_servicio varchar(150) NOT NULL,
  costo_base numeric(10,2) NOT NULL DEFAULT 0.00,
  descripcion text
);

-- Facturas de Venta / Cuentas Clínicas
CREATE TABLE IF NOT EXISTS public.facturas (
  id_factura serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_paciente integer REFERENCES public.pacientes(id_paciente) ON DELETE CASCADE,
  fecha_emision timestamptz DEFAULT now(),
  subtotal numeric(10,2) NOT NULL DEFAULT 0.00,
  impuestos numeric(10,2) DEFAULT 0.00,
  total_general numeric(10,2) NOT NULL DEFAULT 0.00,
  monto_cubierto_seguro numeric(10,2) DEFAULT 0.00,
  monto_paciente numeric(10,2) NOT NULL DEFAULT 0.00,
  estado_pago varchar(50) DEFAULT 'PENDIENTE'
);

-- Detalles de Factura
CREATE TABLE IF NOT EXISTS public.detalles_factura (
  id_detalle serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_factura integer REFERENCES public.facturas(id_factura) ON DELETE CASCADE,
  id_servicio integer REFERENCES public.servicios(id_servicio) ON DELETE SET NULL,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric(10,2) NOT NULL DEFAULT 0.00,
  subtotal numeric(10,2) NOT NULL DEFAULT 0.00
);

-- Transacciones y Pagos Conciliados
CREATE TABLE IF NOT EXISTS public.pagos (
  id_pago serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  id_factura integer REFERENCES public.facturas(id_factura) ON DELETE CASCADE,
  monto_pagado numeric(10,2) NOT NULL,
  metodo_pago varchar(50),
  referencia varchar(100),
  fecha_pago timestamptz DEFAULT now()
);

-- Seguros Médicos
CREATE TABLE IF NOT EXISTS public.seguros_medicos (
  id_seguro serial PRIMARY KEY,
  nombre_aseguradora varchar(150) NOT NULL,
  telefono_contacto varchar(50),
  detalles_cobertura text
);

-- Pólizas de Pacientes
CREATE TABLE IF NOT EXISTS public.polizas_pacientes (
  id_poliza serial PRIMARY KEY,
  id_paciente integer REFERENCES public.pacientes(id_paciente) ON DELETE CASCADE,
  id_seguro integer REFERENCES public.seguros_medicos(id_seguro) ON DELETE SET NULL,
  numero_poliza varchar(100) NOT NULL,
  tipo_cobertura varchar(100),
  activa boolean DEFAULT true
);

-- Cuentas Financieras (Tesorería / Bancos)
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  name varchar(100) NOT NULL,
  type varchar(50) NOT NULL,
  balance numeric(12,2) DEFAULT 0.00,
  status varchar(20) DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

-- Métodos de Pago Habilitados
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  account_id uuid REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  name varchar(100) NOT NULL,
  category varchar(50) NOT NULL,
  status varchar(20) DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

-- Compras y Egresos Operativos
CREATE TABLE IF NOT EXISTS public.financial_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  vendor varchar(150) NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(12,2) NOT NULL DEFAULT 0.00,
  status varchar(20) DEFAULT 'Completed',
  created_at timestamptz DEFAULT now()
);

-- Inventario de Insumos y Stocks Físicos
CREATE TABLE IF NOT EXISTS public.inventory_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  name varchar(150) NOT NULL,
  category varchar(100) NOT NULL,
  quantity numeric(10,2) DEFAULT 0,
  status varchar(20) DEFAULT 'In Stock',
  created_at timestamptz DEFAULT now()
);

-- Metas Diarias del Dashboard
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  date date NOT NULL,
  title varchar(150) NOT NULL,
  target_value integer NOT NULL DEFAULT 10,
  current_value integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tickets de Soporte Técnico y Atención
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  patient_name varchar(150) NOT NULL,
  subject varchar(200) NOT NULL,
  description text,
  priority varchar(20) DEFAULT 'Medium',
  status varchar(20) DEFAULT 'Open',
  created_at timestamptz DEFAULT now()
);

-- Configuración Institucional Local (Legacy / Sincronizada con clinicas)
CREATE TABLE IF NOT EXISTS public.clinic_info (
  id serial PRIMARY KEY,
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  name varchar(150) NOT NULL DEFAULT 'FemeSalud',
  rif varchar(50) DEFAULT 'J-12345678-9',
  address_line1 text DEFAULT 'Av. Principal, Consultorio Médico',
  address_line2 text DEFAULT 'Piso 1, Consultorio 101',
  phone varchar(50) DEFAULT '+58 414 000 0000',
  recipe_clinic_type text DEFAULT 'Consultorio Ginecológico Obstétrico',
  recipe_header_text text DEFAULT 'Atención Gineco-Obstétrica Especializada',
  recipe_footer_text text DEFAULT 'Citas y emergencias al número de contacto.',
  recipe_primary_color varchar(20) DEFAULT '#0ea5e9',
  recipe_font_family varchar(50) DEFAULT 'Inter',
  recipe_logo_url text,
  updated_at timestamptz DEFAULT now()
);

-- Pistas de Auditoría Inmutable
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id(),
  action_type varchar(50) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 9. ÍNDICES DE RENDIMIENTO MULTI-TENANT (B-Tree por id_clinica)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_usuarios_id_clinica ON public.usuarios(id_clinica);
CREATE INDEX IF NOT EXISTS idx_pacientes_id_clinica ON public.pacientes(id_clinica);
CREATE INDEX IF NOT EXISTS idx_citas_id_clinica ON public.citas(id_clinica);
CREATE INDEX IF NOT EXISTS idx_consultas_id_clinica ON public.consultas(id_clinica);
CREATE INDEX IF NOT EXISTS idx_facturas_id_clinica ON public.facturas(id_clinica);
CREATE INDEX IF NOT EXISTS idx_medicos_id_clinica ON public.medicos(id_clinica);

-- ------------------------------------------------------------------------------
-- 10. FUNCIONES ALMACENADAS Y PROCEDIMIENTOS (RPCs)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Procedimiento Administrativo: Crear Personal Interno de una Clínica
CREATE OR REPLACE FUNCTION public.admin_create_staff_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_specialty text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions' AS $$
DECLARE
  v_auth_id uuid := gen_random_uuid();
  v_user_id int;
  v_rol_id int;
  v_especialidad_id int;
  v_clinic_id uuid;
  v_caller_is_admin boolean;
  v_id_type text;
  v_clean_email text := LOWER(TRIM(p_email));
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    LEFT JOIN public.roles r ON r.id_rol = u.id_rol
    WHERE u.auth_id = auth.uid()
      AND u.estado = true
      AND (u.es_superadmin = true OR u.id_rol = 1 OR LOWER(COALESCE(r.nombre_rol, '')) LIKE 'admin%')
  ) INTO v_caller_is_admin;

  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Acceso denegado: solo los administradores pueden registrar personal.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
    RAISE EXCEPTION 'El correo ya se encuentra registrado.';
  END IF;

  v_clinic_id := public.current_user_clinic_id();
  IF v_clinic_id IS NULL AND NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Error: No se pudo identificar la clínica asociada al usuario.';
  END IF;

  IF LOWER(p_role) IN ('admin', 'administrador') THEN
    SELECT id_rol INTO v_rol_id FROM public.roles WHERE LOWER(nombre_rol) LIKE 'admin%' LIMIT 1;
    IF v_rol_id IS NULL THEN v_rol_id := 1; END IF;
  ELSIF LOWER(p_role) IN ('recepcion', 'recepcionista') THEN
    SELECT id_rol INTO v_rol_id FROM public.roles WHERE LOWER(nombre_rol) LIKE 'recep%' LIMIT 1;
    IF v_rol_id IS NULL THEN v_rol_id := 3; END IF;
  ELSE
    SELECT id_rol INTO v_rol_id FROM public.roles WHERE LOWER(nombre_rol) LIKE 'medic%' LIMIT 1;
    IF v_rol_id IS NULL THEN v_rol_id := 2; END IF;
  END IF;

  IF LOWER(p_role) IN ('doctor', 'medico') AND p_specialty IS NOT NULL AND TRIM(p_specialty) <> '' THEN
    SELECT id_especialidad INTO v_especialidad_id
    FROM public.especialidades
    WHERE LOWER(nombre) = LOWER(TRIM(p_specialty))
    LIMIT 1;

    IF v_especialidad_id IS NULL THEN
      INSERT INTO public.especialidades (nombre) VALUES (TRIM(p_specialty))
      RETURNING id_especialidad INTO v_especialidad_id;
    END IF;
  END IF;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, email_change, phone,
    phone_change, phone_change_token, reauthentication_token, email_change_confirm_status,
    is_sso_user, is_anonymous, created_at, updated_at
  ) VALUES (
    v_auth_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_clean_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'id_clinica', v_clinic_id),
    jsonb_build_object('full_name', TRIM(p_full_name), 'email_verified', true, 'role', LOWER(p_role)),
    '', '', '', '', '', NULL, '', '', '', 0, false, false,
    now(),
    now()
  );

  SELECT data_type INTO v_id_type
  FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'id';

  IF v_id_type = 'uuid' THEN
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) ' ||
            'VALUES ($1, $1, jsonb_build_object(''sub'', $1::text, ''email'', $2), ''email'', $1::text, now(), now(), now())'
    USING v_auth_id, v_clean_email;
  ELSE
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) ' ||
            'VALUES ($1::text, $1, jsonb_build_object(''sub'', $1::text, ''email'', $2), ''email'', $1::text, now(), now(), now())'
    USING v_auth_id, v_clean_email;
  END IF;

  INSERT INTO public.usuarios (nombre_usuario, contrasena_hash, id_rol, id_clinica, estado, creado_en, auth_id)
  VALUES (TRIM(p_full_name), 'supabase_auth', v_rol_id, v_clinic_id, true, now(), v_auth_id)
  RETURNING id_usuario INTO v_user_id;

  IF LOWER(p_role) IN ('doctor', 'medico') THEN
    INSERT INTO public.medicos (id_usuario, id_clinica, id_especialidad, nombre, apellido, email, estado)
    VALUES (
      v_user_id,
      v_clinic_id,
      v_especialidad_id,
      split_part(TRIM(p_full_name), ' ', 1),
      COALESCE(NULLIF(substr(TRIM(p_full_name), length(split_part(TRIM(p_full_name), ' ', 1)) + 2), ''), ''),
      v_clean_email,
      true
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'auth_id', v_auth_id,
    'id_usuario', v_user_id,
    'id_clinica', v_clinic_id
  );
END;
$$;

-- Procedimiento Administrativo: Eliminar Personal de una Clínica
CREATE OR REPLACE FUNCTION public.admin_delete_staff_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth' AS $$
DECLARE
  v_caller_is_admin boolean;
  v_caller_clinic uuid;
  v_target_clinic uuid;
  v_target_usuario_id int;
BEGIN
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes eliminarte a ti mismo.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    LEFT JOIN public.roles r ON r.id_rol = u.id_rol
    WHERE u.auth_id = auth.uid()
      AND u.estado = true
      AND (u.es_superadmin = true OR u.id_rol = 1 OR LOWER(COALESCE(r.nombre_rol, '')) LIKE 'admin%')
  ) INTO v_caller_is_admin;

  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Acceso denegado: solo los administradores pueden eliminar personal.';
  END IF;

  v_caller_clinic := public.current_user_clinic_id();

  SELECT id_usuario, id_clinica
  INTO v_target_usuario_id, v_target_clinic
  FROM public.usuarios
  WHERE auth_id = p_user_id
  LIMIT 1;

  IF NOT public.is_superadmin() AND v_target_clinic IS DISTINCT FROM v_caller_clinic THEN
    RAISE EXCEPTION 'Acceso denegado: no puedes eliminar personal de otra clínica.';
  END IF;

  IF v_target_usuario_id IS NOT NULL THEN
    DELETE FROM public.medicos WHERE id_usuario = v_target_usuario_id;
    DELETE FROM public.usuarios WHERE id_usuario = v_target_usuario_id;
  END IF;

  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- Procedimiento: Crear Nueva Clínica + Administrador Inicial (Superadmin RPC)
CREATE OR REPLACE FUNCTION public.superadmin_create_clinic(
  p_slug text,
  p_nombre text,
  p_rif text,
  p_telefono text,
  p_direccion text,
  p_plan text,
  p_admin_email text,
  p_admin_password text,
  p_admin_name text,
  p_tipo_clinica text DEFAULT 'Consultorio Ginecológico Obstétrico',
  p_color_primario text DEFAULT '#0ea5e9'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions' AS $$
DECLARE
  v_id_clinica uuid := gen_random_uuid();
  v_auth_id uuid := gen_random_uuid();
  v_user_id int;
  v_id_type text;
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo el Super Administrador puede crear clínicas.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.clinicas WHERE slug = LOWER(TRIM(p_slug))) THEN
    RAISE EXCEPTION 'El subdominio o identificador "%" ya está registrado.', p_slug;
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = LOWER(TRIM(p_admin_email))) THEN
    RAISE EXCEPTION 'El correo "%" ya se encuentra registrado.', p_admin_email;
  END IF;

  -- 1. Insertar Clínica
  INSERT INTO public.clinicas (
    id_clinica, slug, nombre, rif, telefono, direccion, plan_suscripcion, 
    estado, color_primario, tipo_clinica, email_contacto, creado_en
  ) VALUES (
    v_id_clinica, LOWER(TRIM(p_slug)), p_nombre, p_rif, p_telefono, p_direccion, 
    COALESCE(p_plan, 'pro'), 'activo', COALESCE(p_color_primario, '#0ea5e9'), 
    COALESCE(p_tipo_clinica, 'Consultorio Ginecológico Obstétrico'), LOWER(TRIM(p_admin_email)), now()
  );

  -- 2. Crear Usuario en auth.users con todos los campos sanitizados (evita error GoTrue)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, email_change, phone,
    phone_change, phone_change_token, reauthentication_token, email_change_confirm_status,
    is_sso_user, is_anonymous, created_at, updated_at
  ) VALUES (
    v_auth_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    LOWER(TRIM(p_admin_email)),
    crypt(p_admin_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'id_clinica', v_id_clinica),
    jsonb_build_object('full_name', p_admin_name, 'email_verified', true),
    '', '', '', '', '', NULL, '', '', '', 0, false, false,
    now(),
    now()
  );

  -- 3. Crear Registro en auth.identities (obligatorio para GoTrue signInWithPassword)
  SELECT data_type INTO v_id_type 
  FROM information_schema.columns 
  WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'id';

  IF v_id_type = 'uuid' THEN
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) ' ||
            'VALUES ($1, $1, jsonb_build_object(''sub'', $1::text, ''email'', $2), ''email'', $1::text, now(), now(), now()) ' ||
            'ON CONFLICT DO NOTHING'
    USING v_auth_id, LOWER(TRIM(p_admin_email));
  ELSE
    EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) ' ||
            'VALUES ($1::text, $1, jsonb_build_object(''sub'', $1::text, ''email'', $2), ''email'', $1::text, now(), now(), now()) ' ||
            'ON CONFLICT DO NOTHING'
    USING v_auth_id, LOWER(TRIM(p_admin_email));
  END IF;

  -- 4. Crear Usuario en public.usuarios (Admin de esa clínica, id_rol = 1)
  INSERT INTO public.usuarios (
    nombre_usuario, contrasena_hash, id_rol, id_clinica, estado, creado_en, auth_id, es_superadmin
  ) VALUES (
    p_admin_name, 'supabase_auth', 1, v_id_clinica, true, now(), v_auth_id, false
  )
  RETURNING id_usuario INTO v_user_id;

  -- 5. Sembrar servicios base para la nueva clínica
  INSERT INTO public.servicios (id_clinica, nombre_servicio, costo_base, descripcion) VALUES
    (v_id_clinica, 'Consulta General / Primera Vez', 40.00, 'Evaluación médica integral'),
    (v_id_clinica, 'Control Periódico / Seguimiento', 30.00, 'Revisión y evolución médica');

  -- 6. Sembrar métodos de pago base
  INSERT INTO public.payment_methods (id_clinica, name, category, status) VALUES
    (v_id_clinica, 'Efectivo Divisas ($)', 'Efectivo', 'Active'),
    (v_id_clinica, 'Pago Móvil', 'Pago Móvil', 'Active'),
    (v_id_clinica, 'Punto de Venta', 'Punto de Venta', 'Active');

  RETURN jsonb_build_object(
    'success', true,
    'id_clinica', v_id_clinica,
    'slug', p_slug,
    'admin_user_id', v_user_id,
    'auth_id', v_auth_id
  );
END;
$$;

-- Procedimiento: Suspender, Activar o Pasar a Prueba una Clínica (Superadmin RPC)
CREATE OR REPLACE FUNCTION public.superadmin_toggle_clinic_status(
  p_id_clinica uuid,
  p_nuevo_estado text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo el Super Administrador puede modificar estados.';
  END IF;

  UPDATE public.clinicas
  SET estado = p_nuevo_estado, actualizado_en = now()
  WHERE id_clinica = p_id_clinica;

  RETURN jsonb_build_object('success', true, 'id_clinica', p_id_clinica, 'nuevo_estado', p_nuevo_estado);
END;
$$;

-- Procedimiento: Restablecer Contraseña Directa de Cualquier Usuario / Admin (Superadmin RPC)
CREATE OR REPLACE FUNCTION public.superadmin_reset_user_password(
  p_auth_id uuid DEFAULT NULL,
  p_new_password text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions' AS $$
DECLARE
  v_target_id uuid;
BEGIN
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo el Super Administrador puede restablecer contraseñas.';
  END IF;

  IF p_new_password IS NULL OR length(trim(p_new_password)) < 6 THEN
    RAISE EXCEPTION 'La nueva contraseña debe tener al menos 6 caracteres.';
  END IF;

  IF p_auth_id IS NOT NULL THEN
    SELECT id INTO v_target_id FROM auth.users WHERE id = p_auth_id LIMIT 1;
  END IF;

  IF v_target_id IS NULL AND p_email IS NOT NULL AND trim(p_email) <> '' THEN
    SELECT id INTO v_target_id FROM auth.users WHERE LOWER(email) = LOWER(trim(p_email)) LIMIT 1;
  END IF;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la cuenta de usuario en auth.users.';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = crypt(trim(p_new_password), gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
  WHERE id = v_target_id;

  RETURN jsonb_build_object(
    'success', true,
    'auth_id', v_target_id
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. POLÍTICAS DE ACCESO ROW LEVEL SECURITY (RLS) MULTI-TENANT ESTRICTO
-- ------------------------------------------------------------------------------

-- Aplicar aislamiento por id_clinica automáticamente a todas las tablas con columna id_clinica
DO $$
DECLARE
  v_table record;
  v_policy record;
BEGIN
  FOR v_table IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t 
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'id_clinica'
      AND t.table_type = 'BASE TABLE'
      AND c.table_name <> 'clinicas'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', v_table.table_name);

    FOR v_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table.table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', v_policy.policyname, v_table.table_name);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated ' ||
      'USING (public.is_superadmin() OR id_clinica = public.current_user_clinic_id()) ' ||
      'WITH CHECK (public.is_superadmin() OR id_clinica = public.current_user_clinic_id());',
      'tenant_isolation_' || v_table.table_name,
      v_table.table_name
    );
  END LOOP;
END $$;

-- Políticas RLS de public.clinicas
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_policy record;
BEGIN
  FOR v_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clinicas'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.clinicas;', v_policy.policyname);
  END LOOP;
END $$;

CREATE POLICY "clinicas_superadmin_or_own" ON public.clinicas
  FOR ALL TO authenticated
  USING (public.is_superadmin() OR id_clinica = public.current_user_clinic_id())
  WITH CHECK (public.is_superadmin() OR id_clinica = public.current_user_clinic_id());

CREATE POLICY "clinicas_anon_active_select" ON public.clinicas
  FOR SELECT TO anon
  USING (estado = 'activo');

-- ------------------------------------------------------------------------------
-- 12. HABILITAR SUPABASE REALTIME (postgres_changes) EN TODAS LAS TABLAS
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_row record;
BEGIN
  FOR v_row IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_row.table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_row.table_name);
    END IF;
  END LOOP;
END;
$$;

-- ------------------------------------------------------------------------------
-- 13. PRIVILEGIOS Y CONCESIONES (GRANTS)
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 14. DATOS SEMILLA (CLÍNICA FEMESALUD POR DEFECTO + ROLES + ESPECIALIDADES)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinicas (
  id_clinica, slug, nombre, rif, telefono, direccion, estado, color_primario, tipo_clinica
) VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'femesalud',
  'Clínica FemeSalud',
  'J-12345678-9',
  '+58 414 555 1234',
  'Av. Principal con Calle Los Médicos',
  'activo',
  '#0ea5e9',
  'Consultorio Ginecológico Obstétrico'
) ON CONFLICT (id_clinica) DO NOTHING;

INSERT INTO public.roles (id_rol, nombre_rol, descripcion) VALUES
  (1, 'Administrador', 'Control total clínico y operativo de su propia clínica'),
  (2, 'Médico', 'Acceso a historias clínicas, consultas, citas y récipes'),
  (3, 'Recepcionista', 'Gestión de agenda, turnos, pacientes y facturación'),
  (4, 'Super Administrador', 'Control maestro global de la plataforma y clínicas SaaS')
ON CONFLICT (id_rol) DO UPDATE SET nombre_rol = EXCLUDED.nombre_rol;

INSERT INTO public.especialidades (id_especialidad, nombre) VALUES
  (1, 'Ginecología y Obstetricia'),
  (2, 'Medicina General'),
  (3, 'Pediatría y Puericultura'),
  (4, 'Dermatología'),
  (5, 'Medicina Interna')
ON CONFLICT (id_especialidad) DO NOTHING;
