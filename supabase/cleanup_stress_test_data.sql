-- ====================================================================
-- MEDIZEN / FEMESALUD - SCRIPT DE LIMPIEZA DE DATOS DE PRUEBA
-- Elimina de forma segura y en cascada todos los registros generados
-- con el prefijo o etiqueta 'TEST-' sin alterar ningún dato real de la clínica.
--
-- Ejecución: Copiar y pegar en Supabase SQL Editor (Dashboard > SQL Editor)
-- ====================================================================

DO $$
DECLARE
    v_deleted_count INT;
BEGIN
    RAISE NOTICE '>>> Iniciando limpieza segura de registros de prueba (TEST-*)...';

    -- 1. Eliminar pagos de prueba
    DELETE FROM public.pagos
    WHERE id_factura IN (
        SELECT f.id_factura 
        FROM public.facturas f
        JOIN public.pacientes p ON f.id_paciente = p.id_paciente
        WHERE p.documento_identidad LIKE 'TEST-%'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '  - Pagos de prueba eliminados: %', v_deleted_count;

    -- 2. Eliminar detalles de factura de prueba
    DELETE FROM public.detalles_factura
    WHERE id_factura IN (
        SELECT f.id_factura 
        FROM public.facturas f
        JOIN public.pacientes p ON f.id_paciente = p.id_paciente
        WHERE p.documento_identidad LIKE 'TEST-%'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '  - Detalles de facturas de prueba eliminados: %', v_deleted_count;

    -- 3. Eliminar facturas de prueba
    DELETE FROM public.facturas
    WHERE id_paciente IN (
        SELECT p.id_paciente FROM public.pacientes p WHERE p.documento_identidad LIKE 'TEST-%'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '  - Facturas de prueba eliminadas: %', v_deleted_count;

    -- 4. Eliminar consultas médicas de prueba
    DELETE FROM public.consultas
    WHERE id_historia IN (
        SELECT h.id_historia 
        FROM public.historias_clinicas h
        JOIN public.pacientes p ON h.id_paciente = p.id_paciente
        WHERE p.documento_identidad LIKE 'TEST-%'
    ) OR id_cita IN (
        SELECT c.id_cita 
        FROM public.citas c
        JOIN public.pacientes p ON c.id_paciente = p.id_paciente
        WHERE p.documento_identidad LIKE 'TEST-%'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '  - Consultas médicas de prueba eliminadas: %', v_deleted_count;

    -- 5. Eliminar citas de prueba
    DELETE FROM public.citas
    WHERE id_paciente IN (
        SELECT p.id_paciente FROM public.pacientes p WHERE p.documento_identidad LIKE 'TEST-%'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '  - Citas de prueba eliminadas: %', v_deleted_count;

    -- 6. Eliminar historias clínicas de prueba
    DELETE FROM public.historias_clinicas
    WHERE id_paciente IN (
        SELECT p.id_paciente FROM public.pacientes p WHERE p.documento_identidad LIKE 'TEST-%'
    );
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '  - Historias clínicas de prueba eliminadas: %', v_deleted_count;

    -- 7. Eliminar pacientes de prueba
    DELETE FROM public.pacientes
    WHERE documento_identidad LIKE 'TEST-%';
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '  - Pacientes de prueba eliminados: %', v_deleted_count;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE '>>> LIMPIEZA COMPLETADA: Base de datos restaurada al estado original.';
    RAISE NOTICE '=======================================================';
END $$;
