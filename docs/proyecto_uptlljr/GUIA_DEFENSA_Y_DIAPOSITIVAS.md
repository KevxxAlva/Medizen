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

### Lámina 11: Seguridad Criptográfica y Bóveda de PIN Local
* **Gráfico:** Mostrar la **Figura 7** (Diagrama de Secuencia de Seguridad).
* **Innovación en el Cliente:**
  * **Problema resuelto:** No se guardan contraseñas en texto plano ni en `localStorage`.
  * **Algoritmo PBKDF2:** Deriva una clave simétrica de 256 bits a partir del PIN con 100.000 iteraciones SHA-256 y sal criptográfica única.
  * **Cifrado AES-GCM:** Cifra el token de sesión de Supabase en memoria. Auto-bloqueo tras 5 minutos de inactividad.

---

### Lámina 12: Modelo de Datos Relacional y Privacidad RLS
* **Gráfico:** Mostrar la **Figura 8** (Diagrama Entidad-Relación - ERD).
* **Entidades Clave:** `PATIENTS`, `CONSULTATIONS`, `APPOINTMENTS`, `RECIPES`, `INVOICES`.
* **Seguridad a Nivel de Fila (Row Level Security - RLS):**
  * Políticas en el kernel de PostgreSQL: La recepcionista solo tiene permiso para `APPOINTMENTS` y datos demográficos; el acceso a `CONSULTATIONS` está restringido estrictamente al rol `doctor`.

---

### Lámina 13: Demostración Visual de la Suite MediZen
* **Mosaico Gráfico:** Mostrar las maquetas de UI (Figuras 9, 10, 11, 12 y 13).
* **Puntos Fuertes a Señalar:**
  * Diseño táctil *Mobile-First* operable desde tablets de consultorio o PC de escritorio.
  * Buscador global rápido con `Ctrl + K`.
  * Récipes médicos vectorizados de alta resolución listos para imprimir o enviar al instante.

---

### Lámina 14: Pruebas y Evaluación de Calidad (ISO/IEC 25010)
* **Tabla 14:** Mostrar la matriz de calidad de software bajo estándar ISO 25010.
* **Resultados Obtenidos:**
  * *Adecuación Funcional:* 100% de requerimientos clínicos operativos cubiertos.
  * *Rendimiento:* Consultas a base de datos en menos de 300 ms; sincronización en <1 s.
  * *Seguridad:* 0 vulnerabilidades en pruebas de inyección y escalada de privilegios.
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
  3. Se demostró la viabilidad de implementar arquitecturas modernas (React 19 + Supabase + Web Crypto) en el contexto socioproductivo regional.
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
| **0:00 - 0:45** | Abrir la aplicación en pantalla de bloqueo. Ingresar el PIN de 4 dígitos. | *"Iniciamos con la bóveda criptográfica. La Dra. Carli Sole no requiere contraseñas complejas en cada atención; introduce su PIN de 4 dígitos, la Web Crypto API deriva la clave PBKDF2 en memoria y desbloquea la estación médica en menos de un segundo."* |
| **0:45 - 1:45** | En el Dashboard, presionar `Ctrl + K` o usar la barra superior. Escribir una cédula (ej. `V-18.452.190`). | *"El buscador universal reactivo filtra en menos de 300 ms. Al hacer clic, accedemos al expediente completo: datos personales, antecedentes médicos y el historial cronológico de todas sus visitas previas."* |
| **1:45 - 3:00** | Clic en *"Nueva Consulta"*. Seleccionar especialidad, ingresar signos vitales y probar la calculadora obstétrica. | *"Durante la consulta médica, el sistema adapta los campos según la especialidad. Si es obstétrica, ingresamos la FUM y el algoritmo calcula en tiempo real las semanas de gestación y la fecha probable de parto de forma automática."* |
| **3:00 - 4:00** | Redactar diagnóstico breve, agregar un medicamento en el récipe y hacer clic en *"Generar Récipe PDF"*. | *"Finalizada la evaluación, el sistema compila en memoria un récipe médico vectorizado de alta resolución con jsPDF. Con un solo clic se envía por WhatsApp Web a la paciente o se imprime en el consultorio."* |
| **4:00 - 5:00** | Ir a la Agenda de Citas y mostrar el estado del turno cambiado a *"Finalizada"*. | *"En la recepción, la asistente visualiza la cita actualizada en tiempo real mediante WebSockets, procesa la facturación en bolívares o divisas y cierra el ciclo de atención sin que nadie haya tenido que levantarse de su puesto."* |

---

## 3. BANCO DE PREGUNTAS TÍPICAS DEL JURADO Y RESPUESTAS TÉCNICAS

Prepárense para estas 7 preguntas frecuentes de los docentes de informática de la UPTLLJR:

#### P1: ¿Por qué decidieron usar un PIN de 4 dígitos en lugar de una contraseña tradicional?
> **Respuesta:** *"En el ejercicio médico asistencial, la especialista atiende decenas de pacientes al día y no es viable ingresar contraseñas de 16 caracteres en cada consulta. Para conciliar ergonomía médica con máxima seguridad, implementamos una bóveda local: el usuario se autentica inicialmente con sus credenciales maestras y luego el PIN numérico sirve como semilla para derivar una clave simétrica AES-GCM de 256 bits mediante PBKDF2 con 100.000 iteraciones y sal aleatoria. La contraseña nunca queda en texto plano en el navegador y la sesión se bloquea automáticamente por inactividad."*

#### P2: ¿Qué sucede si se interrumpe el servicio eléctrico o la conexión a Internet en Valle de la Pascua?
> **Respuesta:** *"Consideramos la realidad de nuestra región desde el diseño arquitectónico. Gracias a TanStack Query v5, la aplicación cuenta con un modo semi-offline: la consulta en curso se mantiene retenida en la memoria reactiva del cliente. Si la conexión parpadea, la médica sigue redactando sin pérdida de información; una vez restaurado el enlace, el sistema reintenta la sincronización con peticiones HTTP idempotentes, evitando duplicidades."*

#### P3: ¿Cómo garantizan que el personal de recepción no tenga acceso a los diagnósticos confidenciales de las pacientes?
> **Respuesta:** *"No nos limitamos a ocultar botones en el frontend; la restricción está blindada en el motor de base de datos relacional PostgreSQL mediante Row Level Security (RLS). Existe una política estricta que valida el token JWT del usuario operante: si el rol es 'reception', el motor bloquea a nivel de kernel cualquier sentencia SELECT sobre las tablas de consultas y récipes. La asistente solo puede interactuar con citas y datos demográficos básicos."*

#### P4: ¿Por qué seleccionaron React 19 y TypeScript en lugar de tecnologías tradicionales como PHP o plantillas monolíticas?
> **Respuesta:** *"Porque una clínica requiere sincronización en tiempo real e interactividad inmediata sin recargar la página completa. React 19 como Single Page Application (SPA) combinado con TypeScript garantiza un tipado estricto que reduce en más del 80% los errores en tiempo de ejecución. Además, su arquitectura basada en componentes reutilizables asegura una alta mantenibilidad y portabilidad Mobile-First a largo plazo."*

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
