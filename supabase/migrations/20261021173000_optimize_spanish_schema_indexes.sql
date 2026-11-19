-- Optimización de rendimiento de base de datos (Esquema en Español)
-- Crea índices B-Tree compuestos y simples en claves foráneas (FK), fechas de ordenamiento
-- y columnas de búsqueda frecuente para evitar Sequential Scans en PostgreSQL / PostgREST.

-- 1. Pacientes: ordenamiento por fecha de registro y búsqueda por cédula/documento
CREATE INDEX IF NOT EXISTS idx_pacientes_creado_en ON public.pacientes(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_pacientes_documento ON public.pacientes(documento_identidad);
CREATE INDEX IF NOT EXISTS idx_pacientes_nombre_apellido ON public.pacientes(nombre, apellido);

-- 2. Historias Clínicas: join rápido 1:1 / 1:N por paciente
CREATE INDEX IF NOT EXISTS idx_historias_clinicas_id_paciente ON public.historias_clinicas(id_paciente);

-- 3. Citas: filtrado por rango de fechas, estado, paciente y médico
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora ON public.citas(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_citas_id_paciente ON public.citas(id_paciente);
CREATE INDEX IF NOT EXISTS idx_citas_id_medico ON public.citas(id_medico);
CREATE INDEX IF NOT EXISTS idx_citas_estado_fecha ON public.citas(estado, fecha_hora DESC);

-- 4. Consultas Médicas: búsqueda por historia clínica, cita asociada y orden cronológico
CREATE INDEX IF NOT EXISTS idx_consultas_id_historia_fecha ON public.consultas(id_historia, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_consultas_id_cita ON public.consultas(id_cita);
CREATE INDEX IF NOT EXISTS idx_consultas_id_medico ON public.consultas(id_medico);

-- 5. Insumos de Consulta: join rápido al cargar o editar consultas
CREATE INDEX IF NOT EXISTS idx_insumos_consulta_id_consulta ON public.insumos_consulta(id_consulta);

-- 6. Facturas, Detalles y Pagos: reportes del Dashboard, Top Tratamientos y cruce con Citas
CREATE INDEX IF NOT EXISTS idx_facturas_paciente_fecha ON public.facturas(id_paciente, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_emision ON public.facturas(fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON public.facturas(estado);
CREATE INDEX IF NOT EXISTS idx_detalles_factura_id_factura ON public.detalles_factura(id_factura);
CREATE INDEX IF NOT EXISTS idx_pagos_id_factura ON public.pagos(id_factura);

-- 7. Exámenes de Laboratorio y Archivos Adjuntos: filtros por paciente y fecha
CREATE INDEX IF NOT EXISTS idx_examenes_lab_paciente_fecha ON public.examenes_laboratorio(id_paciente, fecha_resultado DESC);
CREATE INDEX IF NOT EXISTS idx_archivos_pacientes_paciente_fecha ON public.archivos_pacientes(id_paciente, fecha_subida DESC);

-- 8. Usuarios y Médicos: resolución rápida de sesión y rol (auth_id)
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON public.usuarios(auth_id);
CREATE INDEX IF NOT EXISTS idx_medicos_id_usuario ON public.medicos(id_usuario);

-- 9. Inventario: búsqueda por nombre de insumo en descuento automático de stock
CREATE INDEX IF NOT EXISTS idx_inventory_stocks_name ON public.inventory_stocks(name);
