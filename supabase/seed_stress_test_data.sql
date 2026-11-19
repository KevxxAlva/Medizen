-- ====================================================================
-- MEDIZEN / FEMESALUD - SCRIPT DE CARGA MASIVA DE PRUEBA (STRESS TEST)
-- Genera 3,000 Pacientes, 3,000 Historias Clínicas, 6,000 Citas, 
-- 3,000 Consultas y 3,000 Facturas con Detalles y Pagos.
--
-- Ejecución: Copiar y pegar en Supabase SQL Editor (Dashboard > SQL Editor)
-- Tiempo estimado: ~2.5 segundos
-- Todos los registros están marcados con el prefijo 'TEST-' para fácil borrado.
-- ====================================================================

DO $$
DECLARE
    v_paciente_start_id INT;
    v_paciente_end_id INT;
    v_sample_servicio_id INT;
BEGIN
    RAISE NOTICE '>>> Iniciando generación masiva de datos de prueba para Medizen...';

    -- Obtener un id_servicio existente para asociar detalles de facturación
    SELECT id_servicio INTO v_sample_servicio_id FROM public.servicios LIMIT 1;
    IF v_sample_servicio_id IS NULL THEN
        INSERT INTO public.servicios (nombre_servicio, costo_base)
        VALUES ('Consulta Ginecológica General', 45.00)
        RETURNING id_servicio INTO v_sample_servicio_id;
    END IF;

    -- 1. INSERTAR 3,000 PACIENTES DE PRUEBA
    RAISE NOTICE '1. Insertando 3,000 pacientes...';
    INSERT INTO public.pacientes (
        nombre,
        apellido,
        documento_identidad,
        telefono,
        email,
        fecha_nacimiento,
        genero,
        direccion,
        contacto_emergencia,
        creado_en
    )
    SELECT
        (ARRAY['María', 'Carmen', 'Ana', 'Laura', 'Isabella', 'Valentina', 'Camila', 'Sofía', 'Lucía', 'Mariana', 'Gabriela', 'Daniela', 'Elena', 'Paula', 'Andrea'])[1 + (i % 15)],
        (ARRAY['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Torres', 'Álvarez', 'Ruiz', 'Ramírez'])[1 + ((i * 7) % 15)],
        'TEST-V-' || LPAD((10000000 + i)::text, 8, '0'),
        '+58 414 ' || LPAD((1000000 + (i % 9000000))::text, 7, '0'),
        'test_patient_' || i || '@testmedizen.local',
        (CURRENT_DATE - ((18 + (i % 45)) * 365 + (i % 300)))::date,
        (ARRAY['Femenino', 'Femenino', 'Femenino', 'Masculino'])[1 + (i % 4)],
        'Av. Principal, Sector ' || (1 + (i % 20)) || ', Ciudad Prueba',
        'Familiar Prueba (+58 424 ' || LPAD((2000000 + (i % 8000000))::text, 7, '0') || ')',
        NOW() - ((i % 180) * INTERVAL '1 hour' + (i % 60) * INTERVAL '1 minute')
    FROM generate_series(1, 3000) AS i;

    -- 2. INSERTAR 3,000 HISTORIAS CLÍNICAS (Una para cada nuevo paciente de prueba)
    RAISE NOTICE '2. Insertando 3,000 historias clínicas vinculadas...';
    INSERT INTO public.historias_clinicas (
        id_paciente,
        tipo_sangre,
        alergias,
        enfermedades_cronicas,
        antecedentes_familiares,
        datos_extras,
        actualizado_en
    )
    SELECT
        p.id_paciente,
        (ARRAY['O+', 'A+', 'B+', 'AB+', 'O-', 'A-'])[1 + (p.id_paciente % 6)],
        (ARRAY['Ninguna conocida', 'Penicilina', 'Sulfas', 'AINEs', 'Polen / Ácaros'])[1 + (p.id_paciente % 5)],
        (ARRAY['Ninguna', 'Hipertensión arterial controlada', 'Diabetes Tipo 2', 'Asma bronquial leve', 'Hipotiroidismo'])[1 + (p.id_paciente % 5)],
        (ARRAY['Madre hipertensa', 'Padre diabético', 'Sin antecedentes relevantes', 'Abuela con cáncer de mama', 'Cardiopatía familiar'])[1 + (p.id_paciente % 5)],
        jsonb_build_object(
            'status', (ARRAY['activo', 'en_tratamiento', 'alta', 'nuevo'])[1 + (p.id_paciente % 4)],
            'historia_number', 'HC-TEST-' || LPAD(p.id_paciente::text, 6, '0'),
            'blood_type', (ARRAY['O+', 'A+', 'B+', 'AB+'])[1 + (p.id_paciente % 4)],
            'first_visit_date', (CURRENT_DATE - (p.id_paciente % 90))::text,
            'marital_status', (ARRAY['Soltera', 'Casada', 'Divorciada', 'Unión Libre'])[1 + (p.id_paciente % 4)],
            'education_level', (ARRAY['Secundaria', 'Universitario', 'Técnico Superior', 'Postgrado'])[1 + (p.id_paciente % 4)],
            'occupation', (ARRAY['Docente', 'Ingeniera', 'Comerciante', 'Administradora', 'Estudiante', 'Médica'])[1 + (p.id_paciente % 6)],
            'consultation_reason', 'Control periódico de rutina y evaluación preventiva [TEST-LOAD]',
            'current_illness', 'Paciente asintomática acude a chequeo ginecológico rutinario [TEST-LOAD]',
            'gynecological_data', jsonb_build_object(
                'menarche', 11 + (p.id_paciente % 4),
                'sexarche', 16 + (p.id_paciente % 5),
                'menstrual_cycle', '28 x 4 días, regular',
                'dysmenorrhea', (ARRAY['No', 'Leve', 'Moderada'])[1 + (p.id_paciente % 3)],
                'contraceptives', (ARRAY['Anticonceptivos orales', 'DIU T de cobre', 'Preservativo', 'Ninguno'])[1 + (p.id_paciente % 4)]
            ),
            'obstetric_data', jsonb_build_object(
                'g', (p.id_paciente % 4),
                'p', (p.id_paciente % 3),
                'c', ((p.id_paciente % 4) / 2)::int,
                'a', (p.id_paciente % 2)
            )
        ),
        p.creado_en
    FROM public.pacientes p
    WHERE p.documento_identidad LIKE 'TEST-V-%';

    -- 3. INSERTAR 6,000 CITAS MÉDICAS (2 por paciente de prueba: 1 pasada y 1 programada)
    RAISE NOTICE '3. Insertando 6,000 citas (3,000 pasadas completadas y 3,000 futuras programadas)...';
    -- Citas completadas (históricas)
    INSERT INTO public.citas (
        id_paciente,
        fecha_hora,
        estado,
        motivo
    )
    SELECT
        p.id_paciente,
        NOW() - ((1 + (p.id_paciente % 90)) * INTERVAL '1 day' + (9 + (p.id_paciente % 8)) * INTERVAL '1 hour'),
        'COMPLETADA',
        'Consulta de control y citología preventiva [TEST-LOAD]'
    FROM public.pacientes p
    WHERE p.documento_identidad LIKE 'TEST-V-%';

    -- Citas futuras (agenda próxima)
    INSERT INTO public.citas (
        id_paciente,
        fecha_hora,
        estado,
        motivo
    )
    SELECT
        p.id_paciente,
        NOW() + ((1 + (p.id_paciente % 60)) * INTERVAL '1 day' + (8 + (p.id_paciente % 8)) * INTERVAL '1 hour'),
        (ARRAY['PROGRAMADA', 'CONFIRMADA', 'PENDIENTE'])[1 + (p.id_paciente % 3)],
        'Control evolutivo y revisión de exámenes [TEST-LOAD]'
    FROM public.pacientes p
    WHERE p.documento_identidad LIKE 'TEST-V-%';

    -- 4. INSERTAR 3,000 CONSULTAS MÉDICAS (Con signos vitales y diagnósticos)
    RAISE NOTICE '4. Insertando 3,000 consultas médicas con signos vitales...';
    INSERT INTO public.consultas (
        id_historia,
        id_cita,
        motivo_consulta,
        sintomas,
        diagnostico,
        notas_medicas,
        peso_kg,
        presion_arterial,
        temperatura_c,
        fecha_hora
    )
    SELECT
        h.id_historia,
        c.id_cita,
        'Evaluación ginecológica periódica [TEST-LOAD]',
        'Sin sintomatología aguda. Refiere tolerancia adecuada a tratamiento previo.',
        (ARRAY['Examen ginecológico dentro de límites normales (Z01.4)', 'Control de salud de rutina (Z00.0)', 'Vaginitis inespecífica en remisión (N76.0)', 'Supervisión de anticoncepción hormonal (Z30.0)'])[1 + (h.id_historia % 4)],
        'Cuello uterino sano, sin lesiones macroscópicas. Muestra tomada para citología. Plan: control en 1 año. [TEST-LOAD]',
        (52.0 + (h.id_historia % 35))::numeric(5,1),
        (ARRAY['110/70', '120/80', '115/75', '125/85'])[1 + (h.id_historia % 4)],
        (36.2 + ((h.id_historia % 8) * 0.1))::numeric(4,1),
        c.fecha_hora
    FROM public.historias_clinicas h
    JOIN public.pacientes p ON h.id_paciente = p.id_paciente
    JOIN public.citas c ON c.id_paciente = p.id_paciente AND c.estado = 'COMPLETADA'
    WHERE p.documento_identidad LIKE 'TEST-V-%';

    -- 5. INSERTAR 3,000 FACTURAS (Facturación médica para pruebas de rendimiento contable)
    RAISE NOTICE '5. Insertando 3,000 facturas comerciales...';
    INSERT INTO public.facturas (
        id_paciente,
        fecha_emision,
        subtotal,
        impuestos,
        total_general,
        monto_paciente,
        monto_cubierto_seguro,
        estado_pago
    )
    SELECT
        p.id_paciente,
        (c.fecha_hora)::timestamp without time zone,
        (45.00 + (p.id_paciente % 5) * 10)::numeric(10,2),
        0.00,
        (45.00 + (p.id_paciente % 5) * 10)::numeric(10,2),
        (45.00 + (p.id_paciente % 5) * 10)::numeric(10,2),
        0.00,
        (ARRAY['PAGADA', 'PAGADA', 'PAGADA', 'PENDIENTE'])[1 + (p.id_paciente % 4)]
    FROM public.pacientes p
    JOIN public.citas c ON c.id_paciente = p.id_paciente AND c.estado = 'COMPLETADA'
    WHERE p.documento_identidad LIKE 'TEST-V-%';

    -- 6. INSERTAR DETALLES DE FACTURA
    RAISE NOTICE '6. Insertando detalles de factura vinculados...';
    INSERT INTO public.detalles_factura (
        id_factura,
        id_servicio,
        cantidad,
        precio_unitario,
        subtotal
    )
    SELECT
        f.id_factura,
        v_sample_servicio_id,
        1,
        f.total_general,
        f.total_general
    FROM public.facturas f
    JOIN public.pacientes p ON f.id_paciente = p.id_paciente
    WHERE p.documento_identidad LIKE 'TEST-V-%';

    -- 7. INSERTAR PAGOS PARA FACTURAS PAGADAS
    RAISE NOTICE '7. Insertando registros de pagos...';
    INSERT INTO public.pagos (
        id_factura,
        fecha_pago,
        monto_pagado,
        metodo_pago,
        referencia
    )
    SELECT
        f.id_factura,
        f.fecha_emision,
        f.total_general,
        (ARRAY['Punto de Venta', 'Transferencia Bancaria', 'Pago Móvil', 'Efectivo USD'])[1 + (f.id_factura % 4)],
        'REF-TEST-' || LPAD(f.id_factura::text, 8, '0')
    FROM public.facturas f
    JOIN public.pacientes p ON f.id_paciente = p.id_paciente
    WHERE p.documento_identidad LIKE 'TEST-V-%' AND f.estado_pago = 'PAGADA';

    RAISE NOTICE '=======================================================';
    RAISE NOTICE '>>> GENERACIÓN MASIVA COMPLETADA CON ÉXITO:';
    RAISE NOTICE '    - 3,000 Pacientes generados';
    RAISE NOTICE '    - 3,000 Historias Clínicas vinculadas';
    RAISE NOTICE '    - 6,000 Citas agendadas (históricas y futuras)';
    RAISE NOTICE '    - 3,000 Consultas médicas con signos vitales';
    RAISE NOTICE '    - 3,000 Facturas y Detalles generados';
    RAISE NOTICE '    - ~2,250 Registros de pago generados';
    RAISE NOTICE '    Total: Más de 20,000 registros insertados de prueba.';
    RAISE NOTICE '=======================================================';
END $$;
