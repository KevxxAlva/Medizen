-- ==============================================================================
-- AISLAMIENTO ESTRICTO MULTI-TENANT (RLS) EN TODAS LAS TABLAS DE MEDIZEN
-- Activa Row Level Security, elimina políticas permisivas antiguas y fuerza
-- el aislamiento por id_clinica en cada tabla operativa.
-- ==============================================================================

-- 1. Asegurar funciones helper de contexto
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

-- 2. Limpiar políticas viejas y aplicar RLS estricto en todas las tablas con id_clinica
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
    -- Activar RLS obligatoriamente en la tabla
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', v_table.table_name);

    -- Eliminar TODAS las políticas anteriores de esta tabla para que ninguna regla vieja con USING(true) anule el aislamiento
    FOR v_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table.table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', v_policy.policyname, v_table.table_name);
    END LOOP;

    -- Crear política estricta de aislamiento por clínica (o acceso total si es Superadmin)
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated ' ||
      'USING (public.is_superadmin() OR id_clinica = public.current_user_clinic_id()) ' ||
      'WITH CHECK (public.is_superadmin() OR id_clinica = public.current_user_clinic_id());',
      'tenant_isolation_' || v_table.table_name,
      v_table.table_name
    );
  END LOOP;
END $$;

-- 3. Asegurar RLS en public.clinicas
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
  WITH CHECK (public.is_superadmin());

CREATE POLICY "clinicas_anon_active_select" ON public.clinicas
  FOR SELECT TO anon
  USING (estado = 'activo');
