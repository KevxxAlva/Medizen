# Medizen — Suite Clínica Inteligente & Plataforma SaaS Multi-Tenant 🏥✨

<div align="center">

![Medizen Logo](public/favicon.svg)

**Plataforma médica integral (_Medizen_) con arquitectura Multi-Tenant SaaS, gestión clínica multiespecialidad, control financiero multimoneda, renderizado híbrido SSR, sincronización en tiempo real y experiencia mobile-first.**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.168-FF4154?style=flat-square&logo=react&logoColor=white)](https://tanstack.com/start)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.2-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%26%20Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Bun](https://img.shields.io/badge/Bun-Runtime%20%26%20PM-FBF0DF?style=flat-square&logo=bun&logoColor=black)](https://bun.sh/)
[![Licencia](https://img.shields.io/badge/Licencia-Propietaria%20%7C%20Todos%20los%20derechos%20reservados-1E3A8A?style=flat-square)](LICENSE)

</div>

---

## 🌟 Acerca de Medizen

**Medizen** (_Medicina + Zen Flow_) centraliza la operación diaria de consultorios y clínicas (**Clínica FemeSalud** y múltiples organizaciones afiliadas) en una aplicación web instalable (PWA) construida sobre **TanStack Start**, **React 19** y **Supabase**. Permite a médicos, recepcionistas, administradores de clínica y al **Super Administrador SaaS** coordinar sala de espera, agenda, expedientes clínicos, facturación multimoneda, honorarios médicos, inventario, reportes ejecutivos y suscripciones multi-clínica con baja latencia y aislamiento estricto por inquilino (`id_clinica`) y por rol.

---

## 🚀 Módulos y Rutas del Sistema

### 🏢 Plataforma Multi-Tenant SaaS y Super Administrador (`/superadmin`)

- **Arquitectura Multi-Inquilino (`public.clinicas` + `id_clinica`)**: Cada clínica u organización opera en su propio espacio aislado mediante políticas estrictas _Row Level Security_ (RLS) e índices compuestos por clínica (`pacientes_clinica_documento_unique`, `pacientes_clinica_email_unique`).
- **Planes Comerciales SaaS y Modo Demo (14 Días)**:
  - **Plan Básico (\$15 / mes)**: Hasta 2 médicos y 500 pacientes; incluye Dashboard, Sala de Espera, Agenda, Historias Clínicas, Récipes y Servicios.
  - **Plan Pro (\$25 / mes)**: Hasta 8 médicos y pacientes ilimitados; añade Finanzas Multimoneda (Cuentas, Ventas, Honorarios, Métodos de Pago) e Inventario.
  - **Plan Enterprise (\$45 / mes)**: Médicos, pacientes y consultas ilimitados; añade Centro de Reportes Ejecutivos PDF/CSV y Bitácora Visual de Auditoría.
  - **Modo Prueba Gratuita (`demo`, 14 días)**: Banner superior con cuenta regresiva automática y bloqueo al vencimiento.
- **Panel Maestro del Super Administrador (`/superadmin`)**:
  - Registro instantáneo de nuevas clínicas con aprovisionamiento automático de su usuario administrador (`superadmin_create_clinic`).
  - Control de pagos mensuales, fechas de corte (`+30 días`), estados (`Al día`, `Por vencer`, `Vencido`) y recordatorios de cobro en 1 clic por **WhatsApp**.
  - Monitoreo en vivo de capacidad del plan (barras de progreso de médicos y pacientes), listado de personal por clínica, desvinculación de cuentas y **cambio directo de contraseñas** (`superadmin_reset_user_password`).
  - **Anuncios Globales en Tiempo Real**: Difusión de avisos informativos, preventivos o de actualización que aparecen al instante en la parte superior de todas las clínicas activas.
  - Protección institucional: el **Nombre Oficial de la Clínica** y el **RIF** están bloqueados para edición exclusiva del Super Administrador.

### 🩺 Operación Clínica

- **Landing Comercial (`/`) y Dashboard Ejecutivo (`/dashboard`)**: Página comercial con planes SaaS y descarga PWA en `/`; tablero ejecutivo en `/dashboard` con KPIs clínicos y financieros en vivo, gráficas interactivas (`@tanstack/charts` y `recharts`), metas y eventos programados (`DashboardGoalsAndEvents`), widget de calendario (`DashboardCalendarWidget`), tesorería diaria (`DashboardDailyTreasuryCard`), perspectivas clínicas (`AiClinicalInsightsCard`), calculadora cambiaria y reportes PDF.
- **Sala de Espera y Turnos (`/sala-espera`)**: Tablero operativo Kanban en tiempo real entre recepción, consultorios y caja (_Citados / Por Llegar_, _En Sala de Espera_, _En Consultorio_ y _Atendidos / Caja_), habilitado para roles **Recepción** y **Admin**.
- **Agenda Inteligente (`/agenda`)**: Gestión de citas sincronizada por WebSockets con recordatorios automatizados mediante Supabase Edge Function (`appointment-reminders`).
- **Pacientes y Expedientes (`/pacientes`, `/pacientes/$patientId`)**: Ficha demográfica y antecedentes clínicos, timeline cronológico (`PatientTimeline`), notas clínicas (`ClinicalNotesPanel`), archivos adjuntos (`PatientFilesTab`), calculadoras médicas y obstétricas por Regla de Naegele (`medicalCalculators.ts`), curva evolutiva de signos vitales (`PatientVitalsChart`), dictado por voz (`VoiceDictationButton`) y exportación de historia médica completa en PDF (`generateFullHistoryPdf.ts`).
- **Servicios Médicos (`/servicios`) y Personal (`/doctores`)**: Catálogo centralizado de consultas, ecografías y procedimientos con costos base; administración de personal médico y perfiles con control automático de límites según el plan SaaS contratado _(ruta `/doctores` restringida a `admin`)_.

### 💳 Finanzas Multimoneda e Inventario

- **Tasas Cambiarias en Tiempo Real (`useExchangeRate`)**: Sincronización periódica (cada 60 s) para conversión entre **Dólar BCV (\$)**, **Euro BCV (€)**, **USDT Binance P2P** y **Bolívares (Bs.)**, con calculadora integrada (`BcvCalculatorDialog`).
- **Ventas y Facturación (`/facturacion`)**: Emisión automática de factura post-consulta y cobro multimoneda con partición por médico (`invoiceDoctorPartition.ts`), calculadora **Cashea** (inicial + 3 cuotas sin interés), comprobantes individuales en PDF (`generateIndividualInvoice.ts`) y **Cierre de Caja / Reporte Z** (`CashCloseDialog`, `generateCashCloseReport.ts`).
- **Cuentas (`/cuentas`), Honorarios Médicos (`/honorarios`) y Métodos de Pago (`/metodos-pago`)**: Tesorería, conciliación de cuentas, cálculo de honorarios médicos y configuración de los 6 métodos de pago venezolanos _(restringidos a `admin`)_.
- **Inventario y Activos Físicos (`/stocks`)**: Control de existencias, insumos y stock por clínica _(restringido a `admin`)_.

### 📊 Reportes, Récipes, Auditoría y PWA

- **Centro de Reportes (`/reportes`)**: Análisis financiero, operativo y de captación filtrable por rango de fechas y médico, con exportación a **PDF** y **CSV** (`generateExecutiveReport.ts`).
- **Récipes Médicos, Configuración y Soporte (`/configuracion`, `/support`)**: Diseñador visual de récipes (`RecipeDesigner`, `RecipeLivePreview`), órdenes de laboratorio e informes ecográficos en PDF, verificación oficial de documentos por código (`RecipeVerificationModal` sobre `document_verifications`), envío directo por **WhatsApp** (`sendRecipeViaWhatsApp`), y personalización de temas (modo claro, modo oscuro negro puro y paletas de acento).
- **Auditoría (`/auditoria`)**: Registro inmutable de trazabilidad administrativa de operaciones (`audit_logs`) con filtros multicriterio y exportación PDF _(restringido a `admin`)_.
- **Instalación PWA (`/descargar`) y Acceso Unificado (`/auth`)**: Inicio de sesión único inteligente que redirige automáticamente a `/superadmin` o `/dashboard` según el perfil del usuario, desbloqueo rápido por PIN de 4 dígitos, página dedicada de instalación PWA con código QR (`sw.js`, `manifest.webmanifest`), paleta de comandos (`Ctrl+K` / `CommandMenu`), barra lateral colapsable (`AppSidebar`) y barra inferior móvil (`BottomNavBar`).

---

## 🔒 Seguridad, Roles, Tiempo Real y Rendimiento

- **Aislamiento Estricto Multi-Tenant y por Rol (`id_clinica` + `useUserRoleScope` + RLS)**: Soporta los perfiles `superadmin`, `admin`, `recepcionista` y `doctor`. Ninguna clínica puede visualizar ni modificar registros de otra organización, y los médicos acceden exclusivamente a sus propios pacientes, citas, métricas y partición de facturas.
- **Sincronización Triple en Tiempo Real (`useRealtimeSync.ts`)**: Escucha simultáneamente eventos `postgres_changes` en todas las tablas del esquema `public` (con *debounce* de `250 ms`), un canal WebSocket Broadcast instantáneo (`medizen-saas-broadcast`) y revalidación continua silenciosa para que cambios de plan, anuncios globales, suspensiones, turnos en sala de espera, citas, consultas y pagos se reflejen en vivo sin presionar `F5`.
- **Acceso Rápido con PIN y Bloqueo por Inactividad**: Bóveda local en cliente cifrada con Web Cryptography API (`PBKDF2` + `AES-GCM` de 256 bits) para desbloqueo por PIN de 4 dígitos y bloqueo automático de pantalla tras inactividad (`useInactivityLock`, `InactivityLockOverlay`).
- **Caché Multinivel L1/L2 (`setupPersistentQueryCache`)**: Caché en memoria con TanStack React Query v5 hidratada instantáneamente desde `localStorage` bajo estrategia _Stale-While-Revalidate_, combinada con invalidación selectiva en tiempo real.
- **Optimización INP & SSR Híbrido**: Renderizado con TanStack Start + Nitro (`src/server.ts`), precarga de rutas por intención (`defaultPreload: "intent"`), aislamiento de estado y calificación **100 / 100 en `react-doctor`**.

---

## 🛠️ Stack Tecnológico

| Capa                           | Tecnologías                                                                                                                                                                             |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework Full-Stack & SSR** | [TanStack Start](https://tanstack.com/start) (`src/start.ts`, `src/server.ts`) + [Nitro](https://nitro.build/) _(preset Vercel)_                                                        |
| **UI & Lenguaje**              | [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/)                                                                                                      |
| **Build Tool**                 | [Vite 7](https://vite.dev/) (`@lovable.dev/vite-tanstack-config`)                                                                                                                       |
| **Enrutamiento & Estado**      | [TanStack Router](https://tanstack.com/router) + [TanStack React Query v5](https://tanstack.com/query)                                                                                  |
| **Visualización de Datos**     | [TanStack Charts](https://tanstack.com/charts) + [Recharts](https://recharts.org/)                                                                                                      |
| **Estilos & Componentes**      | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI / shadcn/ui](https://www.radix-ui.com/) + [Framer Motion](https://www.framer.com/motion/) + [Lucide Icons](https://lucide.dev/) |
| **Backend & Base de Datos**    | [Supabase](https://supabase.com/) _(PostgreSQL 15, Multi-Tenant RLS, Auth, WebSockets Realtime & Broadcast, RPCs, Edge Functions)_                                                      |
| **Documentos & Utilidades**    | [jsPDF](https://github.com/parallax/jsPDF) + `jspdf-autotable` + `xlsx` + `qrcode` + `zod` + `react-hook-form`                                                                          |
| **Runtime & Paquetes**         | [Bun](https://bun.sh/)                                                                                                                                                                  |

---

## 💻 Instalación y Puesta en Marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/KevxxAlva/Medizen.git
cd Medizen
```

### 2. Instalar dependencias

```bash
bun install
```

### 3. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las credenciales de tu proyecto Supabase:

```env
# Cliente (navegador / Vite)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-publishable-o-anon-key

# Servidor SSR / Funciones de Administrador (TanStack Start)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_PUBLISHABLE_KEY=tu-publishable-o-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

> Nota: `src/integrations/supabase/client.ts` también acepta `VITE_SUPABASE_ANON_KEY` como alias de respaldo en cliente. El esquema consolidado completo de base de datos se encuentra en [`supabase/database_complete.sql`](supabase/database_complete.sql).

### 4. Comandos Disponibles

```bash
# Servidor de desarrollo (Vite + TanStack Start)
bun run dev

# Compilar para producción
bun run build

# Compilar en modo desarrollo
bun run build:dev

# Previsualizar compilación de producción
bun run preview

# Linter y formateo de código
bun run lint
bun run format
```

---

## 📁 Estructura del Proyecto

```text
Medizen/
├── .agents/skills/          # Skills de agente (auditoría UI/INP, commits, web guidelines, media)
├── docs/proyecto_uptlljr/   # Documentación académica UPTLLJR (capítulos MD + Informe PDF APA 7)
├── public/                  # Activos estáticos, favicons SVG adaptativos, manifest y sw.js (PWA)
├── src/
│   ├── components/          # Componentes y vistas por dominio
│   │   ├── agenda/          # Calendario y vistas de agenda
│   │   ├── appointment/     # Formularios y gestión de citas
│   │   ├── audit/           # Visor de logs de auditoría
│   │   ├── auth/            # Formularios de login, PIN, recuperación y bootstrap
│   │   ├── command/         # Acciones de la paleta de comandos (Ctrl+K)
│   │   ├── consultation/    # Historia clínica y asistente en consulta
│   │   ├── dashboard/       # Métricas, gráficas, calculadora BCV y tesorería diaria
│   │   ├── facturacion/     # Componentes auxiliares de facturación
│   │   ├── finance/         # Ventas, cuentas, honorarios, métodos de pago y Reporte Z
│   │   ├── landing/         # Landing page comercial SaaS, planes y descarga PWA
│   │   ├── patient-detail/  # Secciones del expediente clínico del paciente
│   │   ├── patient-form/    # Formulario modular de registro de pacientes
│   │   ├── physical-asset/  # Módulo de inventario y existencias
│   │   ├── reports/         # Centro de descargas PDF/CSV y analítica
│   │   ├── services/        # Catálogo y gestión de servicios médicos
│   │   ├── settings/        # Diseñador visual de récipes y configuración clínica
│   │   ├── skeletons/       # Estados de carga progresiva
│   │   ├── superadmin/      # Panel Maestro SaaS (gestión de clínicas, pagos, planes y anuncios)
│   │   ├── support/         # Centro de soporte
│   │   ├── ui/              # Primitivas Radix UI / Tailwind CSS v4
│   │   ├── waiting-room/    # Tablero en vivo de sala de espera y turnos
│   │   ├── AppSidebar.tsx   # Navegación lateral responsiva con control de plan SaaS
│   │   ├── BottomNavBar.tsx # Barra de navegación inferior táctil
│   │   ├── InactivityLockOverlay.tsx # Bloqueo de sesión por inactividad con PIN
│   │   └── MedizenLogo.tsx  # Isotipo SVG sincronizado con el tema activo
│   ├── hooks/               # Hooks (auth, alcance por rol/clínica, tasas BCV/USDT, Realtime, PWA, PIN lock, voz)
│   ├── integrations/        # Cliente Supabase cliente/servidor, auth-middleware y tipos DB
│   ├── lib/
│   │   ├── api/             # Consultas y mutaciones hacia Supabase (incluye superadmin.ts y clinic.ts)
│   │   ├── auth/            # Bóveda criptográfica local y acceso rápido por PIN
│   │   ├── cache/           # Caché multinivel L1/L2 (persistentQueryCache.ts)
│   │   ├── constants/       # Constantes de dominio
│   │   ├── pdf/             # Generadores de historia clínica completa en PDF
│   │   └── utils/           # Generadores de PDF/CSV (récipes, facturas, Reporte Z) y WhatsApp
│   ├── routes/              # Enrutamiento basado en archivos (TanStack Start / Router)
│   │   ├── _authenticated/  # Rutas protegidas por sesión, plan SaaS y guardia de administrador/superadmin
│   │   ├── __root.tsx       # Shell HTML raíz, PWA SW, tema, Realtime y QueryClientProvider
│   │   ├── index.tsx        # Landing comercial de Medizen SaaS
│   │   ├── auth.tsx         # Acceso unificado (Clínicas y Super Admin), PIN rápido y recuperación
│   │   └── descargar.tsx    # Landing de instalación PWA con QR multiplataforma
│   ├── types/               # Definiciones TypeScript compartidas
│   ├── router.tsx           # Configuración de Router + QueryClient + caché persistente
│   ├── start.ts             # Middlewares globales de TanStack Start
│   ├── server.ts            # Punto de entrada SSR con captura y renderizado de errores
│   └── styles.css           # Tailwind CSS v4 y tokens de diseño
├── supabase/
│   ├── database_complete.sql # Esquema SQL consolidado completo (Multi-Tenant + RPCs + RLS + Realtime)
│   ├── functions/           # Edge Functions (appointment-reminders, doctor-fees)
│   ├── migrations/          # Migraciones SQL incrementales, políticas RLS y Realtime
│   └── config.toml          # Configuración local de Supabase
├── LICENSE                  # Licencia propietaria (Todos los derechos reservados)
├── package.json
├── tsconfig.json
├── vercel.json              # Configuración de despliegue ("framework": "tanstack-start")
└── vite.config.ts           # TanStack Start + Nitro (preset vercel)
```

---

## 📄 Licencia

Este proyecto es **software propietario** bajo **Todos los derechos reservados**.

- **Titular:** Kevin Alvarez (`KevxxAlva`) — Medizen (`© 2026`)
- **Documento de licencia:** Consulta el archivo [`LICENSE`](LICENSE) en la raíz del repositorio para conocer los términos completos, restricciones de reproducción/redistribución y contacto de licenciamiento.
- **Marco legal operativo:** Dentro de la aplicación también está disponible el Centro Legal en `/legal`.

---

<div align="center">

Desarrollado para la gestión clínica de alta eficiencia.  
**Medizen — Medicina en Flujo Continuo.**

</div>
