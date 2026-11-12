export type LegalDocId = "terminos" | "privacidad" | "datos-clinicos" | "cookies" | "seguridad";

export interface LegalClause {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  id: LegalDocId;
  shortTitle: string;
  title: string;
  subtitle: string;
  badge: string;
  readingTime: string;
  summaryPoints: string[];
  callout?: {
    tone: "info" | "warning" | "security";
    title: string;
    body: string;
  };
  clauses: LegalClause[];
}

export const LEGAL_VERSION = "v2.0.0";
export const LEGAL_LAST_UPDATED = "Noviembre 2026";

export const LEGAL_DOC_IDS: readonly LegalDocId[] = [
  "terminos",
  "privacidad",
  "datos-clinicos",
  "cookies",
  "seguridad",
] as const;

export function parseLegalDocId(value: unknown): LegalDocId {
  if (typeof value === "string" && (LEGAL_DOC_IDS as readonly string[]).includes(value)) {
    return value as LegalDocId;
  }
  return "terminos";
}

export const LEGAL_DOCUMENTS: Record<LegalDocId, LegalDocument> = {
  terminos: {
    id: "terminos",
    shortTitle: "Términos de Uso",
    title: "Términos y Condiciones de Uso",
    subtitle:
      "Condiciones generales que rigen el acceso, operación administrativa, emisión de documentos clínicos y uso de la plataforma Medizen — Suite Clínica Inteligente.",
    badge: "Marco Contractual",
    readingTime: "4 min de lectura",
    summaryPoints: [
      "Uso exclusivo para gestión clínica, citas, expedientes y tesorería de centros médicos autorizados.",
      "Cada usuario es responsable de sus credenciales, clave de acceso rápido (PIN) y sesiones abiertas.",
      "La clínica operadora valida los datos fiscales, tasas cambiarias aplicables y acreditación de su personal.",
    ],
    callout: {
      tone: "info",
      title: "Naturaleza del Servicio",
      body: "Medizen proporciona herramientas digitales de organización clínica y administrativa. Cada centro de salud o profesional independiente que opera la instancia mantiene el control directo sobre sus pacientes, historias médicas, tarifas y comprobantes emitidos.",
    },
    clauses: [
      {
        id: "objeto-alcance",
        title: "1. Objeto y Ámbito de Aplicación",
        paragraphs: [
          "Los presentes Términos y Condiciones regulan el acceso y utilización de la aplicación web e instalable (PWA) Medizen — Suite Clínica Inteligente, destinada a consultorios, policlínicas y centros médicos especializados.",
          "Al iniciar sesión, desbloquear una cuenta mediante Acceso Rápido con PIN o utilizar cualquiera de los módulos de agenda, historia clínica, sala de espera, facturación, inventario o reportes, el usuario acepta sujetarse íntegramente a estas condiciones y a las políticas complementarias publicadas en este Centro Legal.",
        ],
      },
      {
        id: "cuentas-roles",
        title: "2. Cuentas Autorizadas, Roles y Custodia de Credenciales",
        paragraphs: [
          "El acceso al sistema se asigna mediante cuentas individuales vinculadas a perfiles operativos con alcances diferenciados (Administrador, Recepcionista y Doctor).",
        ],
        bullets: [
          "Las credenciales de acceso (correo y contraseña) y el PIN de 4 dígitos de la bóveda local son personales e intransferibles.",
          "Está estrictamente prohibido compartir sesiones activas o divulgar claves entre miembros del personal o terceros.",
          "En estaciones de trabajo compartidas (por ejemplo, mostradores de recepción), el usuario debe cerrar sesión al finalizar su turno y evitar el guardado permanente de acceso rápido sin autorización de administración.",
          "La administración del centro médico es responsable de revocar o ajustar oportunamente los privilegios de cualquier usuario que cese en sus funciones.",
        ],
      },
      {
        id: "uso-permitido",
        title: "3. Uso Clínico, Administrativo y Prohibiciones",
        paragraphs: [
          "Medizen debe utilizarse únicamente para fines legítimos de atención sanitaria, coordinación de consultorios y control administrativo interno del centro operador.",
        ],
        bullets: [
          "Se prohíbe intentar evadir políticas de aislamiento por rol (Row Level Security), extraer masivamente datos de pacientes sin autorización o alterar registros de auditoría.",
          "Se prohíbe emitir récipes, informes médicos o comprobantes en nombre de otro profesional colegiado o sin respaldo asistencial real.",
          "El envío de récipes, recordatorios o comprobantes por canales externos como WhatsApp se ejecuta únicamente bajo acción voluntaria e inspección previa del usuario operador.",
        ],
      },
      {
        id: "finanzas-tasas",
        title: "4. Facturación Multimoneda, Tasas Referenciales y Reporte Z",
        paragraphs: [
          "La plataforma integra módulos de control financiero, conversión multimoneda (incluyendo referencias a Dólar BCV, Euro BCV y USDT), liquidación de honorarios médicos y generación de comprobantes PDF o cierres diarios (Reporte Z).",
          "Los tipos de cambio mostrados automáticamente cumplen una función informativa y de asistencia operativa. Corresponde exclusivamente al centro médico y a su personal administrativo validar la tasa vigente, los impuestos aplicables y los requisitos fiscales locales antes de emitir recibos o facturas definitivas.",
        ],
      },
      {
        id: "propiedad-disponibilidad",
        title: "5. Propiedad Intelectual y Actualizaciones Continuas",
        paragraphs: [
          "La interfaz, arquitectura de software, código fuente, componentes visuales, marca denominativa y emblema oficial de Medizen pertenecen a sus titulares y licenciantes, quedando prohibida su reproducción no autorizada, ingeniería inversa o redistribución comercial.",
          "Como aplicación web progresiva (PWA), Medizen puede recibir mejoras de seguridad, rendimiento y correcciones de forma continua sin requerir reinstalaciones manuales por parte del usuario.",
        ],
      },
      {
        id: "legislacion-jurisdiccion",
        title: "6. Legislación Aplicable y Modificaciones",
        paragraphs: [
          "Estos términos se interpretan en armonía con la normativa sanitaria, civil, mercantil y de delitos informáticos aplicable al territorio de operación del centro médico, incluyendo la República Bolivariana de Venezuela.",
          "Medizen podrá actualizar el contenido de este Centro Legal para reflejar mejoras técnicas o requerimientos normativos, indicando siempre la versión y fecha de última revisión vigente.",
        ],
      },
    ],
  },

  privacidad: {
    id: "privacidad",
    shortTitle: "Política de Privacidad",
    title: "Política de Privacidad y Protección de Datos",
    subtitle:
      "Transparencia sobre qué datos trata Medizen, bajo qué medidas criptográficas se resguardan y cómo el centro médico gestiona la privacidad de pacientes y personal.",
    badge: "Privacidad Clínica",
    readingTime: "5 min de lectura",
    summaryPoints: [
      "Tránsito cifrado TLS/HTTPS y aislamiento estricto de registros por médico mediante Row Level Security (RLS).",
      "Cero venta, cesión publicitaria o monetización de historias clínicas o datos de pacientes.",
      "Bóveda local cifrada con Web Crypto (PBKDF2 + AES-GCM 256 bits) y cierre automático por inactividad.",
    ],
    callout: {
      tone: "security",
      title: "Control Institucional de los Datos",
      body: "Los expedientes clínicos y registros administrativos pertenecen al centro de salud operador (Responsable del Tratamiento). Medizen actúa como plataforma tecnológica segura para almacenar, consultar y auditar dicha información exclusivamente para la prestación asistencial.",
    },
    clauses: [
      {
        id: "categorias-datos",
        title: "1. Categorías de Información Tratada",
        paragraphs: [
          "Para cumplir su función asistencial y administrativa, Medizen procesa estrictamente los datos que el centro médico y su personal autorizan ingresar:",
        ],
        bullets: [
          "Datos del personal clínico y administrativo: nombre completo, correo electrónico institucional, rol operativo, especialidad, universidad de egreso y registros profesionales (MPPS / CMC).",
          "Datos identificativos de pacientes: nombres y apellidos, documento de identidad/cédula, fecha y lugar de nacimiento, teléfono, dirección, estado civil y contacto de referencia.",
          "Datos sensibles de salud: motivos de consulta, antecedentes médicos y gineco-obstétricos, evolución clínica, signos, notas de voz transcritas, diagnósticos, récipes emitidos y documentos o estudios adjuntos.",
          "Datos administrativos y financieros: citas, turnos de sala de espera, pagos registrados, métodos de pago, honorarios médicos y bitácora de auditoría operativa.",
        ],
      },
      {
        id: "finalidad-tratamiento",
        title: "2. Finalidad Exclusiva y Confidencialidad",
        paragraphs: [
          "La información tratada en Medizen se destina exclusivamente a coordinar la atención médica, emitir historia clínica y récipes verificables, administrar la agenda y llevar la contabilidad operativa del centro clínico.",
          "Medizen no vende, alquila, comparte con redes publicitarias ni utiliza datos médicos de pacientes para entrenar modelos comerciales externos.",
        ],
      },
      {
        id: "seguridad-tecnica",
        title: "3. Salvaguardas Técnicas Implementadas",
        paragraphs: [
          "La plataforma aplica defensa en profundidad tanto en la nube como en el navegador del usuario:",
        ],
        bullets: [
          "Cifrado en tránsito mediante TLS/HTTPS entre el dispositivo del usuario y la infraestructura de base de datos.",
          "Políticas Row Level Security (RLS) en PostgreSQL (Supabase) para restringir consultas y escrituras según el rol autenticado; los especialistas visualizan únicamente los pacientes, consultas y particiones que les corresponden.",
          "Bóveda criptográfica local mediante Web Cryptography API (derivación de clave PBKDF2 y cifrado simétrico AES-GCM de 256 bits) cuando el usuario habilita el desbloqueo por PIN de 4 dígitos.",
          "Bloqueo automático de pantalla tras inactividad prolongada y registro de trazabilidad administrativa en el módulo Auditoría.",
        ],
      },
      {
        id: "conservacion-derechos",
        title: "4. Conservación y Derechos de los Titulares",
        paragraphs: [
          "Los expedientes clínicos y registros fiscales se conservan durante el tiempo exigido por la normativa sanitaria y administrativa aplicable al centro de salud.",
          "Cualquier paciente o integrante del personal que requiera acceder, rectificar o actualizar sus datos personales o clínicos debe dirigir su solicitud directamente a la dirección médica o administración del centro clínico tratante.",
        ],
      },
      {
        id: "integraciones-externas",
        title: "5. Transferencias Operativas e Integraciones",
        paragraphs: [
          "La información permanece alojada en la infraestructura en la nube configurada para el proyecto (Supabase PostgreSQL y Storage) con controles de acceso autenticados.",
          "Cuando un médico o recepcionista decide compartir un récipe o recordatorio por WhatsApp, la transmisión sale del entorno Medizen hacia la aplicación de mensajería elegida por el usuario bajo su responsabilidad de verificación de destinatario.",
        ],
      },
    ],
  },

  "datos-clinicos": {
    id: "datos-clinicos",
    shortTitle: "Aviso Médico y Sanitario",
    title: "Confidencialidad Médica y Aviso Sanitario",
    subtitle:
      "Lineamientos sobre secreto profesional, validez de récipes digitales verificables y alcance de las herramientas de apoyo clínico dentro de Medizen.",
    badge: "Ética y Cumplimiento",
    readingTime: "3 min de lectura",
    summaryPoints: [
      "Medizen es un sistema de registro y gestión; no emite diagnósticos autónomos ni reemplaza al médico.",
      "Los récipes digitales incluyen verificación por código oficial para prevenir adulteraciones.",
      "No debe utilizarse para atención de urgencias vitales en reemplazo de un servicio médico de emergencia.",
    ],
    callout: {
      tone: "warning",
      title: "Aviso Importante sobre Criterio Profesional",
      body: "Las calculadoras clínicas, indicadores de pacientes, dictado por voz y vistas de perspectivas clínicas sirven únicamente como asistencia informativa. Toda decisión diagnóstica, prescripción farmacológica o conducta terapéutica corresponde exclusivamente al profesional de la salud facultado y colegiado.",
    },
    clauses: [
      {
        id: "secreto-medico",
        title: "1. Secreto Profesional y Custodia de la Historia Clínica",
        paragraphs: [
          "Todo usuario con acceso a expedientes médicos (personal facultativo, enfermería, recepción o administración) queda obligado a preservar el secreto profesional respecto de diagnósticos, antecedentes, imágenes clínicas y datos personales consultados en pantalla o exportados en PDF.",
          "La exportación de historias clínicas completas o comprobantes en PDF debe resguardarse en medios seguros y entregarse exclusivamente al paciente titular o persona legalmente autorizada.",
        ],
      },
      {
        id: "recetas-verificables",
        title: "2. Récipes Digitales y Verificación de Autenticidad",
        paragraphs: [
          "Los récipes emitidos desde el diseñador oficial incorporan la identificación del centro médico configurada en el sistema, los datos de registro sanitario del médico tratante (MPPS / CMC) y un código oficial o QR de verificación.",
          "Cualquier farmacia, paciente o institución receptora puede comprobar la autenticidad del código emitido mediante la herramienta «Verificar Récipe» disponible desde la pantalla de acceso o el menú de comandos.",
        ],
      },
      {
        id: "limitacion-asistencial",
        title: "3. Alcance de Calculadoras y Dictado por Voz",
        paragraphs: [
          "Las herramientas auxiliares como calculadoras obstétricas/clínicas o transcripción de voz a texto dependen de la exactitud de los parámetros introducidos y del micrófono del dispositivo. El médico tratante debe revisar y confirmar siempre el texto final antes de guardar la nota evolutiva o imprimir un récipe.",
        ],
      },
      {
        id: "emergencias",
        title: "4. Exclusión de Atención de Emergencias",
        paragraphs: [
          "Medizen no es un sistema de monitoreo de soporte vital ni un canal de respuesta ante emergencias médicas. Ante cualquier situación crítica de salud, el paciente debe acudir de inmediato al servicio de urgencias médicas más cercano.",
        ],
      },
    ],
  },

  cookies: {
    id: "cookies",
    shortTitle: "Almacenamiento y PWA",
    title: "Política de Cookies, Caché Local y App Instalada (PWA)",
    subtitle:
      "Detalle técnico transparente sobre los datos locales que Medizen guarda en tu navegador o equipo instalado para ofrecer arranque rápido y seguridad.",
    badge: "Transparencia Técnica",
    readingTime: "3 min de lectura",
    summaryPoints: [
      "Sin cookies de publicidad, analítica invasiva ni rastreadores de terceros.",
      "Solo almacenamiento funcional para sesión autenticada, preferencias visuales, caché L1/L2 y bóveda PIN.",
      "Puedes borrar cuentas guardadas o limpiar tu almacenamiento en cualquier momento desde la app.",
    ],
    clauses: [
      {
        id: "sin-rastreadores",
        title: "1. Ausencia de Rastreadores Publicitarios",
        paragraphs: [
          "Medizen no instala cookies de seguimiento comercial, píxeles publicitarios ni perfiles de comportamiento entre sitios web externos. Todo almacenamiento local cumple exclusivamente una función operativa, de interfaz o de seguridad clínica.",
        ],
      },
      {
        id: "inventario-almacenamiento",
        title: "2. Qué Datos Almacena Medizen Localmente",
        paragraphs: [
          "Dependiendo de las funciones que actives en tu navegador o ventana de aplicación instalada, el dispositivo conserva los siguientes elementos:",
        ],
        bullets: [
          "Token de sesión autenticada (Supabase Auth) para mantener tu acceso abierto mientras trabajas.",
          "Caché multinivel L1/L2 en localStorage (TanStack Query, ventana temporal de 30 minutos) para acelerar el cambio entre Agenda, Pacientes y Tablero sin recargas innecesarias.",
          "Bóveda cifrada AES-GCM (256 bits) de Acceso Rápido si optas por registrar un PIN de 4 dígitos en un equipo personal o de consultorio.",
          "Preferencias de interfaz: tema claro/oscuro, color de acento, estado colapsado de la barra lateral e información básica institucional cacheada para impresión rápida.",
          "Registro de Service Worker (/sw.js) y manifiesto PWA (/manifest.webmanifest) para ejecutar Medizen en ventana independiente con su ícono oficial.",
        ],
      },
      {
        id: "control-usuario",
        title: "3. Cómo Limpiar o Revocar el Almacenamiento Local",
        paragraphs: [
          "Tienes control total sobre los datos guardados en el dispositivo que estás usando:",
        ],
        bullets: [
          "En Configuración → Seguridad puedes eliminar o cambiar tu PIN de Acceso Rápido en cualquier momento.",
          "En la pantalla de inicio de sesión por PIN puedes pulsar «Olvidar esta cuenta» para eliminar inmediatamente el perfil y su bóveda cifrada de ese equipo.",
          "Al pulsar «Cerrar sesión», Medizen invalida los tokens activos y limpia la caché de consultas clínicas en memoria.",
        ],
      },
    ],
  },

  seguridad: {
    id: "seguridad",
    shortTitle: "Seguridad y Buenas Prácticas",
    title: "Arquitectura de Seguridad y Buenas Prácticas Operativas",
    subtitle:
      "Controles implementados en Medizen y obligaciones mínimas de higiene digital para médicos, recepcionistas y administradores.",
    badge: "Seguridad Operativa",
    readingTime: "4 min de lectura",
    summaryPoints: [
      "Aislamiento de rutas administrativas y validación de permisos tanto en frontend como en base de datos.",
      "Bloqueo automático por inactividad para proteger historiales médicos si te ausentas del escritorio.",
      "Bitácora de Auditoría continua disponible para usuarios con rol Administrador.",
    ],
    callout: {
      tone: "security",
      title: "Regla de Oro en Equipos Compartidos",
      body: "Si utilizas Medizen en una computadora pública, compartida o de recepción rotativa, no actives el Acceso Rápido con PIN ni dejes la sesión abierta al retirarte de tu puesto.",
    },
    clauses: [
      {
        id: "control-acceso",
        title: "1. Control de Acceso Basado en Roles (RBAC + RLS)",
        paragraphs: [
          "Medizen segrega estrictamente las capacidades operativas según el rol asignado a cada usuario:",
        ],
        bullets: [
          "Administrador: acceso completo a configuración institucional, personal médico, tesorería, cuentas, inventario, honorarios y bitácora de auditoría.",
          "Recepcionista: gestión operativa de sala de espera, citas, registro de pacientes y cobros en caja según permisos vigentes, sin acceso a configuración administrativa restringida.",
          "Doctor: acceso estricto a su propia agenda, pacientes asignados, historias clínicas, evolución médica y su respectiva partición de honorarios/facturación.",
        ],
      },
      {
        id: "inactividad-auditoria",
        title: "2. Bloqueo por Inactividad y Trazabilidad",
        paragraphs: [
          "Cuando no se detecta actividad durante 10 minutos continuos en una sesión protegida, la interfaz superpone un bloqueo de privacidad que oculta el expediente clínico hasta validar nuevamente la identidad del usuario.",
          "Asimismo, las acciones clave del sistema generan entradas de trazabilidad consultables por el Administrador en el módulo Auditoría para esclarecer cambios, altas o movimientos administrativos.",
        ],
      },
      {
        id: "responsabilidades-usuario",
        title: "3. Obligaciones de Higiene Digital del Personal",
        paragraphs: [
          "La seguridad técnica requiere acompañamiento humano constante en el consultorio:",
        ],
        bullets: [
          "Utilizar contraseñas robustas y no reutilizar claves personales en la cuenta clínica.",
          "Verificar la dirección URL oficial del centro antes de introducir credenciales o instalar la PWA.",
          "Reportar de inmediato a la administración y soporte (/support) ante extravío de un teléfono o sospecha de acceso no autorizado.",
        ],
      },
    ],
  },
};
