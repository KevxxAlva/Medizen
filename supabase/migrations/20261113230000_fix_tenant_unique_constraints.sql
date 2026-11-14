-- ==============================================================================
-- FIX: RESTRICCIONES UNIQUE GLOBALES -> MULTI-TENANT POR CLÍNICA (id_clinica)
-- ==============================================================================
-- Problema:
--   Al crear un paciente en una clínica nueva con una cédula (o correo) que ya
--   existe en otra clínica (ej. FemeSalud), PostgreSQL rechaza el INSERT por el
--   índice UNIQUE global (pacientes_documento_identidad_key), aunque la clínica
--   nueva no pueda ver ese paciente por RLS.
--
-- Solución:
--   1. Asegurar DEFAULT public.current_user_clinic_id() en id_clinica.
--   2. Eliminar restricciones/índices UNIQUE globales en pacientes(documento_identidad)
--      y pacientes(email).
--   3. Crear índices UNIQUE compuestos por (id_clinica, documento_identidad) y
--      (id_clinica, email) para que cada clínica tenga su propio espacio aislado.
-- ==============================================================================

-- 1. Asegurar DEFAULT public.current_user_clinic_id() en tablas operativas clave
DO $$
DECLARE
  v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'pacientes', 'historias_clinicas', 'citas', 'consultas',
    'insumos_consulta', 'medicos', 'horarios_medicos', 'servicios',
    'facturas', 'detalles_factura', 'pagos', 'recetas', 'detalles_receta',
    'examenes_laboratorio', 'archivos_pacientes'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = v_table AND column_name = 'id_clinica'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN id_clinica SET DEFAULT public.current_user_clinic_id();',
        v_table
      );
    END IF;
  END LOOP;
END $$;

-- 2. Eliminar restricciones UNIQUE globales antiguas en public.pacientes
ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS pacientes_documento_identidad_key;
ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS pacientes_email_key;
DROP INDEX IF EXISTS public.pacientes_documento_identidad_key;
DROP INDEX IF EXISTS public.pacientes_email_key;

-- Eliminar cualquier otra constraint UNIQUE de una sola columna sobre documento_identidad o email
DO $$
DECLARE
  v_con record;
BEGIN
  FOR v_con IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'pacientes'
      AND con.contype = 'u'
      AND array_length(con.conkey, 1) = 1
      AND EXISTS (
        SELECT 1
        FROM pg_attribute att
        WHERE att.attrelid = rel.oid
          AND att.attnum = con.conkey[1]
          AND att.attname IN ('documento_identidad', 'email')
      )
  LOOP
    EXECUTE format('ALTER TABLE public.pacientes DROP CONSTRAINT IF EXISTS %I;', v_con.conname);
  END LOOP;
END $$;

-- 3. Crear índices UNIQUE aislados por clínica (id_clinica)
CREATE UNIQUE INDEX IF NOT EXISTS pacientes_clinica_documento_unique
  ON public.pacientes (id_clinica, documento_identidad)
  WHERE documento_identidad IS NOT NULL AND documento_identidad <> '';

CREATE UNIQUE INDEX IF NOT EXISTS pacientes_clinica_email_unique
  ON public.pacientes (id_clinica, email)
  WHERE email IS NOT NULL AND email <> '';
