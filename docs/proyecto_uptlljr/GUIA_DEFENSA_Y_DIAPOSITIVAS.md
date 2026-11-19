# GUÍA OFICIAL PARA LA DEFENSA DE GRADO: SISTEMA WEB MEDIZEN
## Universidad Politécnica Territorial de los Llanos "Juana Ramírez" (UPTLLJR)
### PNF en Informática – Trayecto III (Ingeniería en Informática)
**Autores:** Kevin Quintero y Charlys Villarroel  
**Tutor Académico:** Prof. Jose Alfredo Sanchez  
**Asesora Institucional:** Dra. Carli Sole (y equipo médico)  
**Organización Beneficiaria:** Clínica FemeSalud, Valle de la Pascua, Estado Guárico  

---

## 1. ESTRUCTURA Y CONTENIDO DE LAS DIAPOSITIVAS (LÁMINA POR LÁMINA)

Se recomienda un diseño limpio (fondo blanco o azul institucional oscuro), tipografía legible (sans-serif tipo Montserrat o Arial), poco texto en viñetas y predominio de diagramas y capturas visuales. Tiempo estimado de exposición: **15 a 18 minutos** (repartidos equitativamente entre Kevin y Charlys).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ESTRUCTURA GENERAL DE LA PRESENTACIÓN (17 LÁMINAS)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Láminas 1 a 6:  Contexto, Problema, Objetivos y Políticas de Estado       │
│ • Láminas 7 a 8:  Sustento Teórico, Legal y Metodológico                    │
│ • Láminas 9 a 13: Ingeniería del Software, RBAC, Seguridad y Demostración   │
│ • Láminas 14 a 15: Calidad ISO 25010, 100/100 react-doctor e Impacto Real   │
│ • Láminas 16 a 17: Conclusiones, Recomendaciones y Ronda de Preguntas       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Lámina 1: Portada Institucional
* **Logos:** Logo oficial de la UPTLL "Juana Ramírez" (superior izquierda) y logo de MediZen / FemeSalud (superior derecha).
* **Encabezado:** República Bolivariana de Venezuela • MPPEU • UPTLL "Juana Ramírez" • Departamento de Informática • PNFI.
* **Título del Proyecto:** *DESARROLLO DE UN SISTEMA WEB MEDIZEN PARA LA GESTIÓN DE HISTORIAS CLÍNICAS MULTIESPECIALIDAD Y CONTROL OPERATIVO EN LA CLÍNICA FEMESALUD, VALLE DE LA PASCUA ESTADO GUÁRICO*.
* **Autores:** Kevin Quintero (C.I. V-32.276.060), Charlys Villarroel (C.I. V-32.337.825).
* **Tutor Académico:** Prof. Jose Alfredo Sanchez.
* **Fecha:** Valle de la Pascua, 2026.

---

### Lámina 2: Contextualización de la Organización
* **Entidad:** Clínica FemeSalud (Centro de atención médica especializada).
* **Ubicación:** Casco Central de Valle de la Pascua, Municipio Leonardo Infante, Edo. Guárico (Av. Las Industrias / Calle Shettino — **Figura 1**).
* **Especialidades:** Medicina Integral, Ginecología, Obstetricia, Control Prenatal, Ecografías y Cirugía Menor.
* **Actores Principales:** Especialistas médicos (Dra. Carli Sole y equipo médico), Recepción, Administración y pacientes usuarias.

---

### Lámina 3: Diagnóstico Situacional y Problemática
* **Gráfico Central:** Resumen visual del **Árbol de Problemas** (Figura 2 del informe).
* **Problema Central:** Ineficiencias operativas y riesgos en la gestión de expedientes clínicos manuales en papel.
* **Causas Clave:**
  1. Registros manuscritos en carpetas de manila susceptibles a deterioro y extravío.
  2. Búsqueda lenta de antecedentes médicos previos durante la consulta.
  3. Redacción manual de récipes, órdenes de laboratorio e informes ecográficos.
  4. Descoordinación en sala de espera y demoras en arqueos de caja y liquidación de honorarios.
* **Efectos:** Tiempos de espera prolongados (>45 min), costos continuos de papelería y riesgos a la confidencialidad.

---

### Lámina 4: Objetivos del Proyecto
* **Objetivo General:** Desarrollar un sistema web para la gestión de historias clínicas médicas multiespecialidad y control operativo en la Clínica FemeSalud.
* **Objetivos Específicos (Iconografía de 4 etapas):**
  1. 🔍 **Diagnosticar:** Levantamiento participativo de requerimientos clínicos y contables.
  2. 📐 **Diseñar:** Arquitectura en capas, caché L1/L2, modelos relacionales y diagramas UML.
  3. 💻 **Desarrollar:** Programación con Bun, React 19, TypeScript, Tailwind CSS v4 y Supabase (PostgreSQL).
  4. 🧪 **Evaluar:** 12 escenarios de caja negra, auditoría estática `react-doctor` (`100/100`), usabilidad SUS e impacto operativo.

---

### Lámina 5: Justificación e Impacto Multidimensional
* **Impacto Económico:** Erradicación del gasto recurrente en papelería; control multimoneda con Reporte Z y liquidación exacta de honorarios médicos.
* **Impacto Social y Humano:** Coordinación visual en Sala de Espera Kanban y preservación estricta del secreto médico por especialista.
* **Impacto Práctico:** Automatización de regla de Naegele, curvas de signos vitales y emisión instantánea de récipes, órdenes de laboratorio e informes ecográficos en PDF.
* **Impacto Técnico-Académico:** Arquitectura reactiva calificada con **100/100 en `react-doctor`**, caché L1/L2 en `0 ms` y criptografía Web Crypto API.

---

### Lámina 6: Vinculación con Políticas de Estado y el PNFI
* **Plan de la Patria (2019-2025 / 2025-2031):**
  * *Gran Objetivo Histórico I (Obj. 1.5):* Soberanía tecnológica, estándares abiertos y reducción de la dependencia de software privativo foráneo.
  * *Gran Objetivo Histórico II (Obj. 2.2):* Modernización tecnológica al servicio del derecho a la salud pública y privada integral.
* **Líneas de Investigación del PNFI (UPTLLJR):**
  * *Línea 1:* Desarrollo de Software Libre y Aplicaciones Web para la Gestión Social y Productiva.
  * *Línea 2:* Seguridad Lógica, Criptografía y Gestión de Redes y Datos.
* **Territorialización:** Respuesta tecnológica concreta a la salud en los llanos guariqueños.

---

### Lámina 7: Sustento Teórico y Marco Legal
* **Fundamentos Computacionales:** Sistemas de Información en Salud (HIS), EHR, Caché Multinivel L1/L2 y Arquitecturas Reactivas PWA.
* **Pirámide de Kelsen del Software Clínico (Figura 4):**
  * *Nivel Constitucional:* CRBV (Arts. 83, 84, 110 - Derecho a la Salud y Ciencia/Tecnología).
  * *Nivel Legal:* Ley del Plan de la Patria, LOCTI, Ley de Infogobierno y Ley Especial contra Delitos Informáticos.
  * *Nivel Sublegal:* Código de Deontología Médica de Venezuela (Secreto Médico y Trazabilidad en `/auditoria`).

---

### Lámina 8: Marco Metodológico
* **Paradigma:** Sociocrítico con enfoque cuali-cuantitativo (Mixto).
* **Tipo y Diseño:** Proyecto Factible apoyado en Investigación Acción Participativa (IAP).
* **Marco de Trabajo Ágil:** Iteraciones continuas de captura, diseño, codificación, auditoría estática y validación clínica.
* **Población y Muestra:** Muestra censal/intencional ($n=32$) conformada por personal clínico-administrativo y pacientes usuarias.
* **Técnicas e Instrumentos:** Entrevista semiestructurada, observación directa y cuestionario validado por 3 expertos ($\alpha = 0,89$).

---

### Lámina 9: Propuesta de Ingeniería y Fronteras de Rol (Diagrama de Casos de Uso)
* **Gráfico:** Mostrar la **Figura 5** (Diagrama de Casos de Uso UML).
* **Separación Estricta de Alcance (`useUserRoleScope`):**
  * **Médico Especialista (`doctor`):** Aislamiento estricto a sus propios pacientes, autoasignación como *Médico tratante*, su agenda, sus métricas de Dashboard y sus ingresos.
  * **Recepción (`recepcionista`):** Visión transversal de apoyo en **Sala de Espera Kanban (`/sala-espera`)**, Agenda, Pacientes, Ventas y Reportes.
  * **Administrador (`admin`):** Visión global 360° y acceso exclusivo a **Honorarios Médicos (`/honorarios`)**, **Inventario (`/inventario`)** y **Auditoría (`/auditoria`)**.

---

### Lámina 10: Flujo Integral desde Sala de Espera hasta Liquidación Contable
* **Gráfico:** Mostrar la **Figura 6** (Diagrama de Actividades en 3 Fases).
* **Fase 1 (Admisión y Kanban):** Recepción avanza el turno en `/sala-espera`; el médico desbloquea con PIN y abre el expediente en `0 ms` (caché L1/L2).
* **Fase 2 (Evaluación y PDFs):** Regla de Naegele, curva evolutiva de signos vitales y emisión PDF de récipe, orden de laboratorio (4 perfiles rápidos) o informe ecográfico.
* **Fase 3 (Facturación Post-Consulta y Cierre):** Al completar la consulta nace automáticamente la factura `Pendiente` con el costo real; Recepción cobra (BCV/EUR/USDT/Cashea), emite el **Reporte Z** y Administración liquida **Honorarios Médicos**.

---

### Lámina 11: Seguridad Criptográfica, Anti-Fuerza Bruta y Bloqueo por Inactividad
* **Gráfico:** Mostrar la **Figura 7** (Diagrama de Secuencia de Seguridad).
* **Innovación en el Cliente (`src/utils/crypto.ts` y `useInactivityLock.ts`):**
  * **Algoritmos PBKDF2 + SHA-256 con Sal:** Deriva una clave AES-GCM de 256 bits con 100.000 iteraciones y verifica el PIN con sal aleatoria de 16 bytes.
  * **Protección Anti-Fuerza Bruta, Inactividad y Purga:** Bloqueo de 60 s tras 5 intentos fallidos, activación automática de `InactivityLockOverlay` tras 5 min sin actividad y limpieza automática de la caché L2 al cerrar sesión.

---

### Lámina 12: Modelo de Datos Híbrido (Relacional + JSONB), RLS y Auditoría
* **Gráfico:** Mostrar la **Figura 8** (Diagrama Entidad-Relación - ERD en español).
* **Entidades Clave en PostgreSQL:** `pacientes`, `historias_clinicas`, `consultas`, `citas`, `facturas`, `pagos`, `archivos_pacientes`, `inventario`, `movimientos_inventario` y `auditoria_logs`.
* **Trazabilidad y Partición Contable:** Políticas RLS en base de datos, partición determinista factura-especialista sin doble conteo (`invoiceDoctorPartition`) y bitácora visual auditable en `/auditoria`.

---

### Lámina 13: Demostración Visual de la Suite MediZen
* **Mosaico Gráfico:** Mostrar las maquetas de UI (Figuras 9, 10, 11, 12 y 13).
* **Puntos Fuertes a Señalar:**
  * **Dashboard Analítico (`@tanstack/charts`):** Tendencia de ingresos con media móvil, anillos de metas clínicas y eventos del día filtrados por rol.
  * **Sala de Espera Kanban (`/sala-espera`):** 4 columnas en vivo con cronómetro de espera y recordatorio WhatsApp en 1 clic.
  * **Expediente en 8 Pestañas + Curva de Signos Vitales + Documentos PDF:** Regla de Naegele en vivo, gráficas de PA e IMC, órdenes de laboratorio en 1 clic e informes ecográficos.
  * **Finanzas Venezolanas, Cashea, Reporte Z y Honorarios Médicos (`/honorarios`):** 6 métodos de pago de Venezuela, tasas BCV/EUR/USDT en vivo, arqueo diario Reporte Z y recibos de comisión médica firmables en PDF.

---

### Lámina 14: Calidad de Software ISO/IEC 25010 y Puntaje Perfecto `100 / 100`
* **Tabla 14:** Mostrar la matriz de calidad de software bajo estándar ISO 25010.
* **Resultados Sobresalientes:**
  * *Calidad Estructural (`react-doctor`):* **`100 / 100` (`✔ No issues found!` en 247 archivos React 19 / TypeScript)**.
  * *Adecuación Funcional:* 100% de módulos cubiertos (12/12 casos de prueba `CP-01` a `CP-12` aprobados).
  * *Rendimiento L1/L2 y Core Web Vitals:* **`0 ms` en re-visitas desde caché L1/L2**, *debounce* WebSocket de `350 ms`, INP < 50 ms y CLS = 0.
  * *Usabilidad Estandarizada (SUS):* **88,5 / 100 (Grado A - Nivel Sobresaliente)**.

---

### Lámina 15: Impacto Operativo y Eficiencia (Antes vs. Después)
* **Tabla 13:** Matriz comparativa de tiempos reales cronometrados.
* **Cifras Contundentes de Impacto:**
  * ⏱️ Búsqueda de historia clínica anterior: **De 6,2 min a 0,2 min / `0 ms` L1/L2 (-96,7%)**.
  * ⏱️ Cierre diario de caja y liquidación de honorarios: **De 45,0 min a 1,5 min (-96,6%)**.
  * ⏱️ Emisión de récipe, orden de laboratorio o informe eco: **De 7,0 min a 1,2 min (-82,8%)**.
  * 📁 Extravío de expedientes médicos: **De 12 casos/mes a 0 casos (100% resuelto)**.
* **Promedio General:** **Reducción superior al 75% en tiempos clínicos y administrativos**.

---

### Lámina 16: Conclusiones y Recomendaciones
* **Conclusiones:**
  1. Se cumplieron al 100% los cuatro objetivos específicos del ciclo de desarrollo.
  2. MediZen unificó la atención clínica multiespecialidad, la sala de espera y la contabilidad médica de FemeSalud bajo estrictas fronteras de seguridad por rol.
  3. Se demostró capacidad de ingeniería de nivel industrial (**100/100 en `react-doctor`** y **88,5/100 SUS**) desde la UPTLLJR.
* **Recomendaciones:**
  1. Incorporar portal de autoservicio para pacientes y telemedicina WebRTC.
  2. Estandarizar auditorías estáticas de código e ISO/IEC 25010 en futuros proyectos del PNFI.

---

### Lámina 17: Cierre y Preguntas
* Frase institucional de cierre.
* Datos de contacto de los autores.
* *"Agradecidos con el jurado evaluador, quedamos a su entera disposición para la sesión de preguntas y demostración técnica"*.

---

## 2. GUIÓN DE LA DEMOSTRACIÓN EN VIVO (LIVE DEMO: 3 A 5 MINUTOS)

Para evitar contratiempos o bloqueos nerviosos, sigan este guión cronometrado paso a paso durante la defensa:

| Minuto | Acción en Pantalla | Qué decir al Jurado |
| :---: | :--- | :--- |
| **0:00 - 0:45** | Mostrar `InactivityLockOverlay`, desbloquear con PIN de 4 dígitos y enseñar el Dashboard con `@tanstack/charts`. | *"Iniciamos en la bóveda criptográfica PBKDF2/AES-GCM de 256 bits con anti-fuerza bruta. Al desbloquear vemos el Dashboard con gráficas interactivas `@tanstack/charts` e hidratación en `0 ms` mediante nuestra caché multinivel L1/L2."* |
| **0:45 - 1:45** | Abrir Sala de Espera Kanban (`/sala-espera`) y luego abrir un paciente con `Ctrl + K` mostrando autoasignación médica y las 8 pestañas. | *"En Sala de Espera Kanban coordinamos en vivo las 4 etapas del paciente. Al entrar como médico, el alcance está estrictamente aislado a su propia cartera y, al crear historia, se autoasigna como Médico tratante."* |
| **1:45 - 3:00** | Mostrar Regla de Naegele en *Obstétrico*, la **Curva de Signos Vitales** y emitir una **Orden de Laboratorio** (1 clic) o **Informe Ecográfico PDF**. | *"El expediente calcula en vivo edad gestacional y FPP por Naegele, grafica la evolución de Presión Arterial e IMC, y compila bajo demanda Récipes, Órdenes de Laboratorio por perfiles e Informes Ecográficos en PDF."* |
| **3:00 - 4:00** | Completar una consulta, ver la factura `Pendiente` automática al tope de Ventas (`/facturacion`), cobrar con métodos venezolanos / Cashea y abrir **Reporte Z**. | *"Al completar la consulta nace automáticamente la factura en estado `Pendiente` con el costo real del servicio. En Ventas cobramos con los 6 métodos de Venezuela (incluyendo calculadora Cashea) a tasas BCV/EUR/USDT en vivo y emitimos el Arqueo Diario Reporte Z."* |
| **4:00 - 5:00** | Como Administrador, mostrar **Liquidación de Honorarios (`/honorarios`)**, **Inventario (`/inventario`)** y **Auditoría (`/auditoria`)**. | *"Finalmente, solo el Administrador accede a Liquidación de Honorarios Médicos (con recibo PDF sin doble conteo), Kárdex de Inventario y Bitácora Visual de Auditoría, sobre una arquitectura certificada con 100 sobre 100 en `react-doctor`."* |

---

## 3. BANCO DE PREGUNTAS TÍPICAS DEL JURADO Y RESPUESTAS TÉCNICAS

Prepárense para estas 7 preguntas frecuentes de los docentes de informática de la UPTLLJR:

#### P1: ¿Por qué decidieron usar un PIN de 4 dígitos y cómo evitan ataques de fuerza bruta?
> **Respuesta:** *"En el ejercicio médico asistencial, el especialista necesita bloquear y desbloquear su estación rápidamente al pasar al área de examen físico. Implementamos doble capa: sesión JWT de Supabase protegida por `InactivityLockOverlay`, donde el PIN se valida contra un hash SHA-256 con sal aleatoria de 16 bytes y deriva claves AES-GCM de 256 bits mediante PBKDF2 con 100.000 iteraciones, bloqueando la interfaz durante 60 segundos al quinto intento fallido consecutivo."*

#### P2: ¿Cómo lograron transiciones en `0 ms` y qué ocurre ante micro-cortes de internet o recargas de página?
> **Respuesta:** *"Implementamos una caché multinivel L1/L2 (`persistentQueryCache.ts`): L1 en memoria con TanStack Query v5 (`staleTime` de 5 min) y L2 persistente en `localStorage`, combinada con *debounce* de `350 ms` en las invalidaciones WebSocket (`useRealtimeSync`) y estrategia Network-First en el Service Worker (`sw.js`). Así las vistas se hidratan en `0 ms`, resisten micro-cortes, mantienen sesión al pulsar `F5` y purgan automáticamente la caché al cerrar sesión."*

#### P3: ¿Cómo funciona exactamente la separación de permisos entre Administrador, Recepción y Médico?
> **Respuesta:** *"Mediante políticas RLS en PostgreSQL y el hook de alcance `useUserRoleScope`. El **Médico (`doctor`)** está estrictamente aislado: solo ve sus pacientes asignados o atendidos, su agenda y sus propios ingresos, autoasignándose como Médico tratante al abrir una historia. **Recepción** coordina la Sala de Espera Kanban (`/sala-espera`), agenda y cobranza de todos los médicos, pero no puede entrar a inventario, honorarios ni auditoría. Solo el **Administrador** posee visión global y acceso exclusivo a `/honorarios`, `/inventario` y `/auditoria`."*

#### P4: ¿Por qué utilizaron un modelo híbrido relacional con columnas `JSONB` y cuándo se genera la factura de una consulta?
> **Respuesta:** *"Las entidades transaccionales (`pacientes`, `citas`, `facturas`, `pagos`) exigen integridad ACID en 3FN, mientras que `JSONB` permite evolucionar variables especializadas (`datos_extras`, `signos_vitales`, `datos_especialidad`). Además, para evitar cobros prematuros o montos erróneos, la factura se genera automáticamente **solo cuando el médico completa la consulta**, creándose siempre en estado `Pendiente` con el `costo_base` real del servicio y ordenándose de más reciente a más antigua en Ventas."*

#### P5: ¿De qué manera este proyecto se articula con las Líneas de Investigación del PNFI y el Plan de la Patria?
> **Respuesta:** *"Se inscribe en la Línea 1 del PNFI (Desarrollo de Software Libre y Soluciones Web) y la Línea 2 (Seguridad Lógica y Gestión de Datos), empleando estándares abiertos universales. Frente al Plan de la Patria, tributa al Gran Objetivo Histórico I, Objetivo Nacional 1.5, construyendo soberanía tecnológica y reduciendo la dependencia de paquetes comerciales foráneos privativos en el sector salud."*

#### P6: ¿Cómo evitan errores contables al calcular los honorarios de cada especialista en una clínica multiespecialidad?
> **Respuesta:** *"Diseñamos un algoritmo de partición determinista factura-especialista (`invoiceDoctorPartition.ts`) en el módulo administrativo `/honorarios`. Cada factura pagada se vincula de forma única al médico responsable de la cita o consulta que la originó, impidiendo el doble conteo, aplicando el porcentaje configurable de comisión del doctor frente a la retención operativa de la clínica y emitiendo un recibo oficial en PDF listo para firmar."*

#### P7: ¿Qué evidencias cuantitativas y de ingeniería respaldan la calidad del software entregado?
> **Respuesta:** *"Tres indicadores verificables: primero, obtuvimos una calificación perfecta de **100 sobre 100 (`0 issues` en 247 archivos)** en la auditoría estática `react-doctor`. Segundo, la Tabla 13 demuestra reducciones superiores al 75% en tiempos operativos (búsqueda en `0 ms` y cierre de caja/honorarios de 45 min a 1,5 min). Tercero, la escala internacional de usabilidad SUS alcanzó **88,5 / 100 (Grado A)** con el 100% de los 12 casos de prueba de caja negra aprobados."*

---

## 4. CONSEJOS CLAVE PARA EL DÍA DE LA DEFENSA

1. **Vestimenta Formal:** Traje formal acorde al acto de grado/defensa de ingeniería.
2. **Postura Corporal:** Mirar a los ojos a los jurados, hablar con tono pausado, claro y seguro. Nunca leer las diapositivas; las diapositivas son un soporte visual para el jurado, no un teleprónter.
3. **Distribución del Tiempo:**
   * Autor 1 (Kevin): Fases I y II (Problema, Justificación, Bases Teóricas y Legales) -> ~7 min.
   * Autor 2 (Charlys): Fases III y IV (Metodología, Ingeniería, Demo y Resultados) -> ~8 min.
   * Conclusiones compartidas -> ~2 min.
4. **Respaldo Tecnológico:** Llevar la presentación en dos pendrives distintos y tener un video grabado de respaldo de la pantalla por si falla la conexión a internet en el aula de defensa.
