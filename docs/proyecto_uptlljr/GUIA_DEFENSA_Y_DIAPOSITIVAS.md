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
│ • Láminas 9 a 13: Ingeniería del Software, Seguridad y Demostración         │
│ • Láminas 14 a 15: Pruebas ISO 25010, Métricas de Impacto y Eficiencia      │
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
* **Ubicación:** Casco Central de Valle de la Pascua, Municipio Leonardo Infante, Edo. Guárico (Av. Las Industrias / Calle Shettino).
* **Especialidades:** Medicina Integral, Ginecología, Obstetricia, Control Prenatal, Ecografías y Cirugía Menor.
* **Actores Principales:** Especialista médica (Dra. Carli Sole), Asistente de recepción y comunidad de pacientes usuarias.

---

### Lámina 3: Diagnóstico Situacional y Problemática
* **Gráfico Central:** Resumen visual del **Árbol de Problemas** (Figura 2 del informe).
* **Problema Central:** Ineficiencias operativas y riesgos en la gestión de expedientes clínicos manuales en papel.
* **Causas Clave:**
  1. Registros manuscritos en carpetas de manila susceptibles a deterioro y extravío.
  2. Búsqueda lenta de antecedentes médicos previos durante la consulta.
  3. Redacción manual de récipes médicos con letra poco legible.
  4. Falta de sincronización en tiempo real entre recepción y consultorio.
* **Efectos:** Tiempos de espera prolongados (>45 min), costos continuos de papelería y riesgos a la confidencialidad.

---

### Lámina 4: Objetivos del Proyecto
* **Objetivo General:** Desarrollar un sistema web para la gestión de historias clínicas médicas multiespecialidad y control operativo en la Clínica FemeSalud.
* **Objetivos Específicos (Iconografía de 4 etapas):**
  1. 🔍 **Diagnosticar:** Levantamiento participativo de requerimientos clínicos.
  2. 📐 **Diseñar:** Arquitectura en capas, modelos relacionales y diagramas UML 2.5.
  3. 💻 **Desarrollar:** Programación en React 19, TypeScript, Tailwind CSS y Supabase (PostgreSQL).
  4. 🧪 **Evaluar:** Pruebas funcionales de caja negra, usabilidad (SUS) e impacto operativo.

---

### Lámina 5: Justificación e Impacto Multidimensional
* **Impacto Económico:** Erradicación del gasto recurrente en resmas de papel, tóner y carpetas físicas; control financiero multimoneda (Bs. y Divisas).
* **Impacto Social y Humano:** Reducción drástica del tiempo de espera; preservación del derecho fundamental a la intimidad y privacidad de la salud.
* **Impacto Práctico:** Automatización de fórmulas obstétricas (FUM, FPP, semanas) y entrega instantánea de prescripciones digitales por WhatsApp.
* **Impacto Técnico-Académico:** Aplicación de arquitectura reactiva moderna (SPA) y criptografía nativa Web Crypto API en el navegador.

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
* **Fundamentos Computacionales:** Sistemas de Información Hospitalaria (HIS), Registros Electrónicos de Salud (EHR) y Arquitecturas Reactivas basadas en Componentes.
* **Pirámide de Kelsen del Software Clínico (Figura 4):**
  * *Nivel Constitucional:* CRBV (Arts. 83, 84, 110 - Derecho a la Salud y Ciencia/Tecnología).
  * *Nivel Legal:* Ley del Plan de la Patria, LOCTI, Ley de Infogobierno y Ley Especial contra Delitos Informáticos.
  * *Nivel Sublegal:* Código de Deontología Médica de Venezuela (Secreto Médico y Preservación de Historias).

---

### Lámina 8: Marco Metodológico
* **Paradigma:** Sociocrítico con enfoque cuali-cuantitativo (Mixto).
* **Tipo y Diseño:** Proyecto Factible apoyado en Investigación Acción Participativa (IAP).
* **Marco de Trabajo Ágil:** Metodología **Scrum** (Sprints iterativos de captura, diseño, código y validación).
* **Población y Muestra:** Muestra censal/intencional conformada por la especialista médica, asistente administrativa y universo de pacientes.
* **Técnicas e Instrumentos:** Entrevista clínica semiestructurada, observación directa y matriz de pruebas de caja negra validadas por juicio de expertos.

---

### Lámina 9: Propuesta de Ingeniería (Diagrama de Casos de Uso)
* **Gráfico:** Mostrar la **Figura 5** (Diagrama de Casos de Uso UML).
* **Explicación Clave:**
  * Separación de actores: *Médico Especialista*, *Recepción / Asistente* y *Administrador*.
  * Casos de uso medulares: Autenticación rápida por PIN, Registro de Pacientes, Evolución Multiespecialidad, Emisión de Récipe PDF y Facturación.

---

### Lámina 10: Flujo de Consulta Médica Multiespecialidad
* **Gráfico:** Mostrar la **Figura 6** (Diagrama de Actividades en 3 Fases).
* **Fase 1 (Admisión):** Desbloqueo por PIN, búsqueda instantánea por C.I. y toma de constantes vitales.
* **Fase 2 (Evaluación Especializada):** Bifurcación dinámica según tipo de atención (Obstetricia con calculadora de FUM/FPP vs. Consulta Multiespecialidad con examen físico y ecografías).
* **Fase 3 (Prescripción y Cierre):** Redacción guiada de récipe, exportación automática a PDF, envío digital vía WhatsApp y conciliación de cobro.

---

### Lámina 11: Seguridad Criptográfica, Anti-Fuerza Bruta y Bloqueo por Inactividad
* **Gráfico:** Mostrar la **Figura 7** (Diagrama de Secuencia de Seguridad).
* **Innovación en el Cliente (`src/utils/crypto.ts` y `useInactivityLock.ts`):**
  * **Problema resuelto:** No se exponen credenciales en texto plano y se protege la estación ante ausencias momentáneas del médico.
  * **Algoritmos PBKDF2 + SHA-256 con Sal:** Deriva una clave simétrica de 256 bits con 100.000 iteraciones y verifica el PIN mediante hash SHA-256 con sal aleatoria de 16 bytes.
  * **Protección Anti-Fuerza Bruta e Inactividad:** Bloqueo temporal de 60 segundos tras 5 intentos fallidos de PIN y activación automática de `InactivityLockOverlay` tras 5 minutos sin actividad, conservando la sesión SSR/CSR al refrescar la página.

---

### Lámina 12: Modelo de Datos Híbrido (Relacional + JSONB) y Privacidad RLS
* **Gráfico:** Mostrar la **Figura 8** (Diagrama Entidad-Relación - ERD en español).
* **Entidades Clave en PostgreSQL:** `pacientes`, `historias_clinicas`, `consultas`, `citas`, `facturas`, `pagos`, `archivos_pacientes`, `inventario`, `movimientos_inventario` y `auditoria_logs`.
* **Seguridad a Nivel de Fila (Row Level Security - RLS) y RBAC:**
  * Separación estricta de roles (`admin`, `doctor`, `recepcionista` / `asistente`): el módulo de activos físicos (`inventario`) y la edición clínica profunda están protegidos según el rol autenticado, registrando cada operación en `auditoria_logs`.

---

### Lámina 13: Demostración Visual de la Suite MediZen
* **Mosaico Gráfico:** Mostrar las maquetas de UI (Figuras 9, 10, 11, 12 y 13).
* **Puntos Fuertes a Señalar:**
  * **Expediente Clínico en 8 Pestañas con Banner de Alertas (`PatientClinicalBanner`):** Código correlativo `HC-XXXXX`, grupo sanguíneo, alergias, seguro médico, contacto de emergencia, medicación habitual, transfusiones, `Timeline` y carga de estudios en `archivos_pacientes`.
  * **Calculadora Obstétrica en Vivo (Regla de Naegele):** Cálculo instantáneo de edad gestacional (`sem + días`) y FPP al ingresar o editar la FUM.
  * **Exportación PDF Bajo Demanda (*Code-Splitting*):** Generación de Historia Clínica Completa y Récipes en PDF (`jsPDF`) con envío directo a WhatsApp.
  * **Personalización Dinámica sin Desfase de Hidratación (`ThemeCustomizer` y `MedizenLogo`):** Cinco paletas clínicas sincronizadas con `--primary` desde la carga inicial SSR.
  * **Finanzas Bimonetarias (BCV) y Kárdex de Inventario:** Facturación en USD/VES vinculada a `servicios.costo_base` y control de insumos médicos.

---

### Lámina 14: Pruebas y Evaluación de Calidad (ISO/IEC 25010)
* **Tabla 14:** Mostrar la matriz de calidad de software bajo estándar ISO 25010.
* **Resultados Obtenidos:**
  * *Adecuación Funcional:* 100% de requerimientos clínicos, financieros y de inventario cubiertos (10 casos de prueba CP-01 a CP-10 aprobados).
  * *Rendimiento e Hidratación SSR/CSR:* Consultas en < 300 ms, esqueletos de carga (`PatientProfileSkeleton`) sin saltos visuales (CLS = 0) y carga diferida de generadores PDF.
  * *Optimización Core Web Vitals:* Tiempo de respuesta a la interacción (*Interaction to Next Paint* - INP) < 50 ms mediante aislamiento de micro-componentes (`LiveClock`).
  * *Seguridad:* 0 vulnerabilidades en pruebas de fuerza bruta, inyección y control de acceso por roles.
* **Métrica de Usabilidad Estandarizada (SUS):**
  * **Puntaje: 88,5 / 100 (Grado A - Nivel Sobresaliente)** otorgado por el personal de la clínica.

---

### Lámina 15: Impacto Operativo y Eficiencia (Antes vs. Después)
* **Tabla 13:** Matriz comparativa de tiempos reales cronometrados.
* **Cifras Contundentes de Impacto:**
  * ⏱️ Búsqueda de historia clínica anterior: **De 6,2 min a 0,2 min (-96,7%)**.
  * ⏱️ Redacción y entrega de récipe médico: **De 7,0 min a 1,2 min (-82,8%)**.
  * ⏱️ Registro y llenado de consulta médica: **De 18,0 min a 5,5 min (-69,4%)**.
  * 📁 Extravío de expedientes médicos: **De 12 casos/mes a 0 casos (100% resuelto)**.
* **Promedio General:** **Reducción superior al 70% en todos los tiempos operativos**.

---

### Lámina 16: Conclusiones y Recomendaciones
* **Conclusiones:**
  1. Se cumplieron al 100% los cuatro objetivos específicos del ciclo de desarrollo.
  2. MediZen transformó la dinámica asistencial de FemeSalud, elevando la calidad de vida de las pacientes y la productividad de la especialista.
  3. Se demostró la viabilidad de implementar arquitecturas modernas (React 19 + TanStack Start + Supabase + Web Crypto) en el contexto socioproductivo regional.
* **Recomendaciones:**
  1. Extender el módulo a telemedicina y portal de autoservicio de citas para pacientes.
  2. Replicar el modelo tecnológico en otros centros ambulatorios y consultorios de los Llanos Centrales.

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
| **0:00 - 0:45** | Mostrar el bloqueo por inactividad (`InactivityLockOverlay`) e ingresar el PIN de 4 dígitos. | *"Iniciamos con la bóveda criptográfica y el bloqueo por inactividad. La Dra. Carli Sole protege su estación con un PIN de 4 dígitos validado con SHA-256 con sal y PBKDF2 de 100.000 iteraciones, con bloqueo anti-fuerza bruta al quinto intento fallido."* |
| **0:45 - 1:45** | En el Dashboard, presionar `Ctrl + K`, buscar una paciente y mostrar el `PatientClinicalBanner` y las 8 pestañas. | *"El buscador universal abre el expediente `HC-XXXXX` en menos de 300 ms. En el banner superior vemos alertas críticas (tipo de sangre, alergias, seguro, contacto de emergencia) y debajo las 8 pestañas clínicas, incluyendo medicación habitual, transfusiones, Timeline y estudios adjuntos."* |
| **1:45 - 3:00** | Ir a la pestaña *Obstétrico* o *Editar Expediente*, cambiar la FUM y mostrar el cálculo automático de EG y FPP. | *"Al ingresar la Fecha de Última Menstruación (FUM), el algoritmo aplica en vivo la Regla de Naegele y calcula instantáneamente las semanas y días de edad gestacional y la Fecha Probable de Parto sin usar calculadoras manuales."* |
| **3:00 - 4:00** | Hacer clic en *"Exportar Documentos"* -> *"Historia Clínica (PDF)"* y luego generar un *"Récipe PDF"* / WhatsApp. | *"Mediante carga diferida de jsPDF, compilamos en memoria tanto la Historia Clínica Completa como el récipe médico vectorizado con membrete oficial, listo para imprimir o enviar por WhatsApp a la paciente."* |
| **4:00 - 5:00** | Mostrar la Agenda en tiempo real, la tasa BCV en Finanzas y el Kárdex de Inventario. | *"Finalmente, la agenda sincroniza estados por WebSockets, el módulo financiero concilia pagos en dólares y bolívares a tasa BCV, y el módulo de Activos Físicos controla el kárdex de insumos médicos de la clínica."* |

---

## 3. BANCO DE PREGUNTAS TÍPICAS DEL JURADO Y RESPUESTAS TÉCNICAS

Prepárense para estas 7 preguntas frecuentes de los docentes de informática de la UPTLLJR:

#### P1: ¿Por qué decidieron usar un PIN de 4 dígitos y cómo evitan ataques de fuerza bruta?
> **Respuesta:** *"En el ejercicio médico asistencial, la especialista atiende decenas de pacientes al día y necesita bloquear y desbloquear su pantalla con rapidez cuando se levanta a realizar un examen físico. Implementamos un esquema de doble capa: la sesión autenticada de Supabase se resguarda con un recubrimiento de bloqueo por inactividad (`InactivityLockOverlay`), donde el PIN se verifica contra un hash SHA-256 con sal aleatoria de 16 bytes y deriva claves AES-GCM de 256 bits mediante PBKDF2 con 100.000 iteraciones. Además, cuenta con limitación de tasa (rate-limiting): al quinto intento fallido consecutivo, la interfaz bloquea cualquier intento durante 60 segundos."*

#### P2: ¿Qué sucede si se interrumpe el servicio eléctrico o la conexión a Internet, o si el usuario refresca la página?
> **Respuesta:** *"Consideramos la realidad de nuestra región desde el diseño arquitectónico. Gracias a TanStack Query v5, el Service Worker (`sw.js`) con estrategia Network-First y la sincronización de sesión/rol en caché local, el sistema soporta micro-cortes sin perder el borrador clínico y permite refrescar el navegador (`F5`) manteniendo la sesión activa, el rol del usuario y el tema visual personalizado sin redirigir erróneamente a la pantalla de login."*

#### P3: ¿Cómo garantizan que el personal de recepción no tenga acceso a módulos administrativos o historias confidenciales?
> **Respuesta:** *"Aplicamos control de acceso basado en roles (RBAC) tanto en la interfaz (ocultando módulos restringidos como Activos Físicos/Inventario para roles no administradores y cacheando el rol verificado) como en el motor PostgreSQL mediante políticas Row Level Security (RLS) y registro inmutable en la tabla `auditoria_logs`."*

#### P4: ¿Por qué utilizaron un modelo híbrido relacional con columnas `JSONB` en PostgreSQL (`historias_clinicas` y `consultas`)?
> **Respuesta:** *"Porque la información demográfica, el agendamiento (`citas`) y la facturación (`facturas`, `pagos`) requieren integridad referencial ACID estricta en Tercera Forma Normal, mientras que los datos clínicos especializados (`datos_extras`, `signos_vitales`, `datos_especialidad`) evolucionan según la especialidad médica. El tipo `JSONB` nativo de PostgreSQL 15 nos permite almacenar antecedentes gineco-obstétricos, medicación habitual, transfusiones y notas clínicas con flexibilidad documental sin sacrificar velocidad ni transacciones SQL."*

#### P5: ¿De qué manera este proyecto se articula con las Líneas de Investigación del PNFI y el Plan de la Patria?
> **Respuesta:** *"Se inscribe en la Línea 1 del PNFI (Desarrollo de Software Libre y Soluciones Web) y la Línea 2 (Seguridad Lógica y Gestión de Datos), empleando estándares abiertos universales. Frente al Plan de la Patria, tributa al Gran Objetivo Histórico I, Objetivo Nacional 1.5, construyendo soberanía tecnológica y reduciendo la dependencia de paquetes comerciales foráneos privativos en un sector crítico como la salud."*

#### P6: ¿Cómo determinaron la muestra y qué validez metodológica tienen sus instrumentos?
> **Respuesta:** *"Dado que se trata de una investigación-acción participativa en una unidad socioproductiva específica, se empleó un muestreo no probabilístico de tipo censal/intencional sobre los actores directos involucrados (especialista, asistente y usuarias). La validez de los instrumentos de recolección técnica se certificó mediante juicio de expertos metodológicos e informáticos según los baremos institucionales de la UPTLLJR."*

#### P7: ¿Qué evidencias cuantitativas respaldan que el sistema es un éxito operativo?
> **Respuesta:** *"Contamos con dos métricas concluyentes en el informe: primero, la Tabla 13 demuestra una reducción superior al 70% en todos los tiempos operativos cronometrados (la búsqueda de expedientes bajó de 6,2 min a menos de 15 segundos y la emisión de récipes de 7 min a 1,2 min). Segundo, la evaluación estandarizada de usabilidad mediante la escala SUS arrojó 88,5 puntos sobre 100, ubicando a MediZen en Grado A de satisfacción y facilidad de uso."*

---

## 4. CONSEJOS CLAVE PARA EL DÍA DE LA DEFENSA

1. **Vestimenta Formal:** Traje formal acorde al acto de grado/defensa de ingeniería.
2. **Postura Corporal:** Mirar a los ojos a los jurados, hablar con tono pausado, claro y seguro. Nunca leer las diapositivas; las diapositivas son un soporte visual para el jurado, no un teleprónter.
3. **Distribución del Tiempo:**
   * Autor 1 (Kevin): Fases I y II (Problema, Justificación, Bases Teóricas y Legales) -> ~7 min.
   * Autor 2 (Charlys): Fases III y IV (Metodología, Ingeniería, Demo y Resultados) -> ~8 min.
   * Conclusiones compartidas -> ~2 min.
4. **Respaldo Tecnológico:** Llevar la presentación en dos pendrives distintos y tener un video grabado de respaldo de la pantalla por si falla la conexión a internet en el aula de defensa.
