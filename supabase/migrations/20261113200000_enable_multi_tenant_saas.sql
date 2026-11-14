-- ==============================================================================
-- MIGRACIÓN: ARQUITECTURA MULTI-TENANT NATIVA Y SUPER ADMINISTRADOR SAAS
-- ==============================================================================
-- Transforma Medizen en una plataforma multi-clínica completa:
-- 1. Crea la tabla maestra 'clinicas' (tenants)
-- 2. Asigna la clínica semilla (FemeSalud) y vincula todos los datos existentes
-- 3. Agrega 'id_clinica' con auto-asignación DEFAULT a todas las tablas operativas
-- 4. Agrega rol y bandera 'es_superadmin'
-- 5. Define funciones de contexto (current_user_clinic_id, is_superadmin)
-- 6. Implementa RPCs de gestión para el Super Administrador
-- 7. Configura RLS para aislamiento estricto entre clínicas con bypass de Super Admin
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA MAESTRA DE CLÍNICAS (TENANTS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinicas (
  id_clinica uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(60) UNIQUE NOT NULL,
  nombre varchar(150) NOT NULL,
  rif varchar(50),
  telefono varchar(50),
  direccion text,
  email_contacto varchar(150),
  plan_suscripcion varchar(50) DEFAULT 'pro', -- 'basico', 'pro', 'enterprise'
  estado varchar(20) DEFAULT 'activo',        -- 'activo', 'suspendido', 'demo'
  logo_url text,
  color_primario varchar(20) DEFAULT '#0ea5e9',
  tipo_clinica text DEFAULT 'Consultorio Ginecológico Obstétrico',
  header_receta text DEFAULT 'Atención Médica Especializada',
  footer_receta text DEFAULT 'Citas y emergencias al número de contacto.',
  fuente_receta varchar(50) DEFAULT 'Inter',
  notas_internas text,
  creado_en timestamptz DEFAULT now(),
  actualizado_en timestamptz DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. INSERTAR CLÍNICA SEMILLA POR DEFECTO (FEMESALUD)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinicas (
  id_clinica,
  slug,
  nombre,
  rif,
  telefono,
  direccion,
  estado,
  color_primario,
  tipo_clinica
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
) ON CONFLICT (id_clinica) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  slug = EXCLUDED.slug;

-- ------------------------------------------------------------------------------
-- 3. ROL DE SUPER ADMINISTRADOR
-- ------------------------------------------------------------------------------
INSERT INTO public.roles (id_rol, nombre_rol, descripcion)
VALUES (4, 'Super Administrador', 'Control global de la plataforma SaaS y gestión de clínicas')
ON CONFLICT (id_rol) DO UPDATE SET nombre_rol = EXCLUDED.nombre_rol;

-- Añadir 'superadmin' al enum app_role si existe
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 4. ADAPTACIÓN DE LA TABLA USUARIOS PARA MULTI-TENANCY
-- ------------------------------------------------------------------------------
ALTER TABLE public.usuarios 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS es_superadmin boolean DEFAULT false;

-- Asignar usuarios existentes a FemeSalud
UPDATE public.usuarios 
SET id_clinica = 'c0000000-0000-0000-0000-000000000001'
WHERE id_clinica IS NULL AND es_superadmin = false;

-- ------------------------------------------------------------------------------
-- 5. FUNCIONES HELPER DE CONTEXTO
-- ------------------------------------------------------------------------------

-- Obtener la clínica a la que pertenece el usuario autenticado
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

-- Verificar si el usuario autenticado es Super Administrador
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

-- ------------------------------------------------------------------------------
-- 6. AGREGAR 'id_clinica' CON ASIGNACIÓN AUTOMÁTICA EN TABLAS OPERATIVAS
-- ------------------------------------------------------------------------------

-- Pacientes
ALTER TABLE public.pacientes 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.pacientes SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Historias Clínicas
ALTER TABLE public.historias_clinicas 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.historias_clinicas SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Citas
ALTER TABLE public.citas 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.citas SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Consultas
ALTER TABLE public.consultas 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.consultas SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Insumos Consulta
ALTER TABLE public.insumos_consulta 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.insumos_consulta SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Médicos
ALTER TABLE public.medicos 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.medicos SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Horarios Médicos
ALTER TABLE public.horarios_medicos 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.horarios_medicos SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Servicios Médicos
ALTER TABLE public.servicios 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.servicios SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Facturas
ALTER TABLE public.facturas 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.facturas SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Detalles de Factura
ALTER TABLE public.detalles_factura 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.detalles_factura SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Pagos
ALTER TABLE public.pagos 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.pagos SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Recetas
ALTER TABLE public.recetas 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.recetas SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Detalles de Receta
ALTER TABLE public.detalles_receta 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.detalles_receta SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Exámenes de Laboratorio
ALTER TABLE public.examenes_laboratorio 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.examenes_laboratorio SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Archivos Pacientes
ALTER TABLE public.archivos_pacientes 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.archivos_pacientes SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Cuentas Financieras
ALTER TABLE public.financial_accounts 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.financial_accounts SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Métodos de Pago
ALTER TABLE public.payment_methods 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.payment_methods SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Compras Financieras
ALTER TABLE public.financial_purchases 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.financial_purchases SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Inventario / Stocks
ALTER TABLE public.inventory_stocks 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.inventory_stocks SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Metas Diarias
ALTER TABLE public.daily_goals 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.daily_goals SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- Auditoría
ALTER TABLE public.audit_logs 
  ADD COLUMN IF NOT EXISTS id_clinica uuid REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE DEFAULT public.current_user_clinic_id();
UPDATE public.audit_logs SET id_clinica = 'c0000000-0000-0000-0000-000000000001' WHERE id_clinica IS NULL;

-- ------------------------------------------------------------------------------
-- 7. ÍNDICES DE RENDIMIENTO MULTI-TENANT (B-Tree por id_clinica)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_usuarios_id_clinica ON public.usuarios(id_clinica);
CREATE INDEX IF NOT EXISTS idx_pacientes_id_clinica ON public.pacientes(id_clinica);
CREATE INDEX IF NOT EXISTS idx_citas_id_clinica ON public.citas(id_clinica);
CREATE INDEX IF NOT EXISTS idx_consultas_id_clinica ON public.consultas(id_clinica);
CREATE INDEX IF NOT EXISTS idx_facturas_id_clinica ON public.facturas(id_clinica);
CREATE INDEX IF NOT EXISTS idx_medicos_id_clinica ON public.medicos(id_clinica);

-- ------------------------------------------------------------------------------
-- 8. PROCEDIMIENTOS ALMACENADOS (RPCs) PARA EL SUPER ADMINISTRADOR
-- ------------------------------------------------------------------------------

-- Procedimiento: Crear Nueva Clínica + Primer Usuario Administrador
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
  -- Validar si el usuario que llama es Super Admin
  IF NOT public.is_superadmin() THEN
    RAISE EXCEPTION 'Acceso denegado: solo el Super Administrador puede crear clínicas.';
  END IF;

  -- Validar slug y correo
  IF EXISTS (SELECT 1 FROM public.clinicas WHERE slug = LOWER(TRIM(p_slug))) THEN
    RAISE EXCEPTION 'El subdominio o slug "%" ya está en uso por otra clínica.', p_slug;
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

  -- 2. Crear Usuario en auth.users con todos los campos sanitizados (evita error de scanner GoTrue)
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
    '', '', '', '', '', '', '', '', '', 0, false, false,
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

  -- 4. Crear Usuario en public.usuarios (Admin de esa clínica, rol 1)
  INSERT INTO public.usuarios (
    nombre_usuario, contrasena_hash, id_rol, id_clinica, estado, creado_en, auth_id, es_superadmin
  ) VALUES (
    p_admin_name, 'supabase_auth', 1, v_id_clinica, true, now(), v_auth_id, false
  )
  RETURNING id_usuario INTO v_user_id;

  -- 4. Sembrar servicios médicos estándar para esta nueva clínica
  INSERT INTO public.servicios (id_clinica, nombre_servicio, costo_base, descripcion) VALUES
    (v_id_clinica, 'Consulta General / Primera Vez', 40.00, 'Evaluación médica integral'),
    (v_id_clinica, 'Control Periódico / Seguimiento', 30.00, 'Revisión y evolución médica');

  -- 5. Sembrar métodos de pago base para esta clínica
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

-- Procedimiento: Cambiar Estado de Clínica (Suspender o Reactivar)
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

-- ------------------------------------------------------------------------------
-- 9. POLÍTICAS ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- ------------------------------------------------------------------------------
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

-- Políticas en clinicas: Superadmin ve y edita todo; usuarios ven solo la suya
DROP POLICY IF EXISTS "Superadmin gestiona todas las clinicas" ON public.clinicas;
CREATE POLICY "Superadmin gestiona todas las clinicas" ON public.clinicas
  FOR ALL TO authenticated
  USING (public.is_superadmin() OR id_clinica = public.current_user_clinic_id())
  WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "Lectura publica basica de clinicas por slug" ON public.clinicas;
CREATE POLICY "Lectura publica basica de clinicas por slug" ON public.clinicas
  FOR SELECT TO anon USING (estado = 'activo');

-- Políticas dinámicas multi-tenant en tablas clave
-- Pacientes
DROP POLICY IF EXISTS "Aislamiento por clinica en pacientes" ON public.pacientes;
CREATE POLICY "Aislamiento por clinica en pacientes" ON public.pacientes
  FOR ALL TO authenticated
  USING (public.is_superadmin() OR id_clinica = public.current_user_clinic_id())
  WITH CHECK (public.is_superadmin() OR id_clinica = public.current_user_clinic_id());

-- Citas
DROP POLICY IF EXISTS "Aislamiento por clinica en citas" ON public.citas;
CREATE POLICY "Aislamiento por clinica en citas" ON public.citas
  FOR ALL TO authenticated
  USING (public.is_superadmin() OR id_clinica = public.current_user_clinic_id())
  WITH CHECK (public.is_superadmin() OR id_clinica = public.current_user_clinic_id());

-- Consultas
DROP POLICY IF EXISTS "Aislamiento por clinica en consultas" ON public.consultas;
CREATE POLICY "Aislamiento por clinica en consultas" ON public.consultas
  FOR ALL TO authenticated
  USING (public.is_superadmin() OR id_clinica = public.current_user_clinic_id())
  WITH CHECK (public.is_superadmin() OR id_clinica = public.current_user_clinic_id());

-- Facturas
DROP POLICY IF EXISTS "Aislamiento por clinica en facturas" ON public.facturas;
CREATE POLICY "Aislamiento por clinica en facturas" ON public.facturas
  FOR ALL TO authenticated
  USING (public.is_superadmin() OR id_clinica = public.current_user_clinic_id())
  WITH CHECK (public.is_superadmin() OR id_clinica = public.current_user_clinic_id());

-- Medicos
DROP POLICY IF EXISTS "Aislamiento por clinica en medicos" ON public.medicos;
CREATE POLICY "Aislamiento por clinica en medicos" ON public.medicos
  FOR ALL TO authenticated
  USING (public.is_superadmin() OR id_clinica = public.current_user_clinic_id())
  WITH CHECK (public.is_superadmin() OR id_clinica = public.current_user_clinic_id());

-- Usuarios
DROP POLICY IF EXISTS "Aislamiento por clinica en usuarios" ON public.usuarios;
CREATE POLICY "Aislamiento por clinica en usuarios" ON public.usuarios
  FOR ALL TO authenticated
  USING (public.is_superadmin() OR id_clinica = public.current_user_clinic_id())
  WITH CHECK (public.is_superadmin() OR id_clinica = public.current_user_clinic_id());
