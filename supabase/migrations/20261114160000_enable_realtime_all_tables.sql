-- =============================================================================
-- Medizen SaaS: Habilitar Supabase Realtime (postgres_changes) en TODAS las tablas
-- del esquema public automáticamente (incluyendo document_verifications y futuras)
-- =============================================================================

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
