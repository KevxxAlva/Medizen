# Medizen — Suite Clínica Inteligente 🏥✨

<div align="center">

![Medizen Logo](public/favicon.svg)

**Plataforma médica integral (_FemeSalud_) para la gestión clínica, operativa y financiera con renderizado híbrido SSR, sincronización en tiempo real y experiencia mobile-first.**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.168-FF4154?style=flat-square&logo=react&logoColor=white)](https://tanstack.com/start)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.2-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%26%20Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Bun](https://img.shields.io/badge/Bun-Runtime%20%26%20PM-FBF0DF?style=flat-square&logo=bun&logoColor=black)](https://bun.sh/)

</div>

---

## 🌟 Acerca de Medizen

**Medizen** (_Medicina + Zen Flow_) centraliza la operación diaria de consultorios y clínicas (**FemeSalud**) en una aplicación web instalable (PWA) construida sobre **TanStack Start**, **React 19** y **Supabase**. Permite a médicos, recepcionistas y administradores coordinar sala de espera, agenda, expedientes clínicos, facturación multimoneda, honorarios médicos, inventario y reportes ejecutivos con baja latencia y aislamiento estricto por rol.

---

## 🚀 Módulos y Rutas del Sistema

### 🩺 Operación Clínica

- **Dashboard Ejecutivo (`/`)**: KPIs clínicos y financieros en vivo, gráficas interactivas (`@tanstack/charts` y `recharts`), metas y eventos programados (`DashboardGoalsAndEvents`), widget de calendario (`DashboardCalendarWidget`), tesorería diaria (`DashboardDailyTreasuryCard`), perspectivas clínicas (`AiClinicalInsightsCard`), calculadora cambiaria y reportes PDF.
- **Sala de Espera y Turnos (`/sala-espera`)**: Tablero operativo en tiempo real entre recepción, consultorios y caja (_Citados / Por Llegar_, _En Sala de Espera_ y _En Consultorio_), habilitado para roles **Recepción** y **Admin**.
- **Agenda Inteligente (`/agenda`)**: Gestión de citas sincronizada por WebSockets con recordatorios automatizados mediante Supabase Edge Function (`appointment-reminders`).
- **Pacientes y Expedientes (`/pacientes`, `/pacientes/$patientId`)**: Ficha demográfica y antecedentes clínicos, timeline cronológico (`PatientTimeline`), notas clínicas (`ClinicalNotesPanel`), archivos adjuntos (`PatientFilesTab`), calculadoras médicas (`medicalCalculators.ts`), dictado por voz (`VoiceDictationButton`) y exportación de historia médica completa en PDF (`generateFullHistoryPdf.ts`).
- **Servicios Médicos (`/servicios`) y Personal (`/doctores`)**: Catálogo centralizado de consultas, ecografías y procedimientos con costos base; administración de personal médico y perfiles _(ruta `/doctores` restringida a `admin`)_.

### 💳 Finanzas Multimoneda e Inventario

- **Tasas Cambiarias en Tiempo Real (`useExchangeRate`)**: Sincronización periódica (cada 60 s) para conversión entre **Dólar BCV ($)**, **Euro BCV (€)**, **USDT Binance P2P** y **Bolívares (Bs.)**, con calculadora integrada (`BcvCalculatorDialog`).
- **Ventas y Facturación (`/facturacion`)**: Emisión y cobro de facturas con partición por médico (`invoiceDoctorPartition.ts`), comprobantes individuales en PDF (`generateIndividualInvoice.ts`) y **Cierre de Caja / Reporte Z** (`CashCloseDialog`, `generateCashCloseReport.ts`).
- **Cuentas (`/cuentas`), Honorarios Médicos (`/honorarios`) y Métodos de Pago (`/metodos-pago`)**: Tesorería, conciliación de cuentas, cálculo de honorarios (con apoyo de la Edge Function `doctor-fees`) y configuración de métodos de pago _(restringidos a `admin`)_.
- **Inventario y Activos Físicos (`/stocks`)**: Control de existencias, insumos y stock _(restringido a `admin`)_.

### 📊 Reportes, Récipes, Auditoría y PWA

- **Centro de Reportes (`/reportes`)**: Análisis financiero, operativo y de captación filtrable por rango de fechas y médico, con exportación a **PDF** y **CSV** (`generateExecutiveReport.ts`).
- **Récipes Médicos, Configuración y Soporte (`/configuracion`, `/support`)**: Diseñador visual de récipes (`RecipeDesigner`, `RecipeLivePreview`), verificación por código (`RecipeVerificationModal`), envío directo por **WhatsApp** (`sendRecipeViaWhatsApp`), y personalización de temas (modo claro, modo oscuro negro puro y paletas de acento).
- **Auditoría (`/auditoria`)**: Registro de trazabilidad administrativa de operaciones _(restringido a `admin`)_.
- **Instalación PWA (`/descargar`) y Navegación Rápida (`/auth`, `/descargar`)**: Página dedicada de instalación para Windows, macOS, Android e iOS con código QR (`sw.js`, `manifest.webmanifest`), paleta de comandos (`Ctrl+K` / `CommandMenu`), barra lateral colapsable (`AppSidebar`) y barra inferior móvil (`BottomNavBar`).

---

## 🔒 Seguridad, Roles y Rendimiento

- **Aislamiento Estricto por Rol (`useUserRoleScope` + `AdminPathGuard` + RLS)**: Soporta los perfiles `admin`, `recepcionista` y `doctor`. Los médicos acceden exclusivamente a sus propios pacientes, citas, métricas y partición de facturas.
- **Acceso Rápido con PIN y Bloqueo por Inactividad**: Bóveda local en cliente cifrada con Web Cryptography API (`PBKDF2` + `AES-GCM` de 256 bits) para desbloqueo por PIN de 4 dígitos y bloqueo automático de pantalla tras 10 minutos de inactividad (`useInactivityLock`, `InactivityLockOverlay`).
- **Caché Multinivel L1/L2 (`setupPersistentQueryCache`)**: Caché en memoria con TanStack React Query v5 hidratada instantáneamente desde `localStorage` (ventana L2 de 30 minutos para catálogos y métricas) bajo estrategia _Stale-While-Revalidate_, combinada con `useRealtimeSync`.
- **Optimización INP & SSR Híbrido**: Renderizado con TanStack Start + Nitro (`src/server.ts`), precarga de rutas por intención (`defaultPreload: "intent"`), aislamiento de estado y transiciones concurrentes (`startTransition`, `useSyncExternalStore`) para mantener fluida la respuesta en escritorio y móvil.

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
| **Backend & Base de Datos**    | [Supabase](https://supabase.com/) _(PostgreSQL, RLS, Auth, WebSockets Realtime, Edge Functions)_                                                                                        |
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

> Nota: `src/integrations/supabase/client.ts` también acepta `VITE_SUPABASE_ANON_KEY` como alias de respaldo en cliente. `SUPABASE_SERVICE_ROLE_KEY` solo debe configurarse en el entorno del servidor.

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

La aplicación iniciará en el puerto configurado por Vite (por defecto `http://localhost:5173`).

---

## 📁 Estructura del Proyecto

```text
Medizen/
├── .agents/skills/          # Skills de agente (auditoría UI/INP, commits, web guidelines, media)
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
│   │   ├── patient-detail/  # Secciones del expediente clínico del paciente
│   │   ├── patient-form/    # Formulario modular de registro de pacientes
│   │   ├── physical-asset/  # Módulo de inventario y existencias
│   │   ├── reports/         # Centro de descargas PDF/CSV y analítica
│   │   ├── services/        # Catálogo y gestión de servicios médicos
│   │   ├── settings/        # Diseñador visual de récipes y configuración clínica
│   │   ├── skeletons/       # Estados de carga progresiva
│   │   ├── support/         # Centro de soporte
│   │   ├── ui/              # Primitivas Radix UI / Tailwind CSS v4
│   │   ├── waiting-room/    # Tablero en vivo de sala de espera y turnos
│   │   ├── AppSidebar.tsx   # Navegación lateral responsiva con drawer móvil
│   │   ├── BottomNavBar.tsx # Barra de navegación inferior táctil
│   │   ├── InactivityLockOverlay.tsx # Bloqueo de sesión por inactividad con PIN
│   │   └── MedizenLogo.tsx  # Isotipo SVG sincronizado con el tema activo
│   ├── hooks/               # Hooks (auth, alcance por rol, tasas BCV/USDT, Realtime, PWA, PIN lock, voz)
│   ├── integrations/        # Cliente Supabase cliente/servidor, auth-middleware y tipos DB
│   ├── lib/
│   │   ├── api/             # Capa de consultas y mutaciones hacia Supabase
│   │   ├── auth/            # Bóveda criptográfica local y acceso rápido por PIN
│   │   ├── cache/           # Caché multinivel L1/L2 (persistentQueryCache.ts)
│   │   ├── constants/       # Constantes de dominio
│   │   ├── pdf/             # Generadores de historia clínica completa en PDF
│   │   └── utils/           # Generadores de PDF/CSV (récipes, facturas, Reporte Z) y WhatsApp
│   ├── routes/              # Enrutamiento basado en archivos (TanStack Start / Router)
│   │   ├── _authenticated/  # Rutas protegidas por sesión y guardia de administrador
│   │   ├── __root.tsx       # Shell HTML raíz, PWA SW, tema y QueryClientProvider
│   │   ├── auth.tsx         # Acceso estándar, PIN rápido y recuperación
│   │   └── descargar.tsx    # Landing de instalación PWA con QR multiplataforma
│   ├── types/               # Definiciones TypeScript compartidas
│   ├── router.tsx           # Configuración de Router + QueryClient + caché persistente
│   ├── start.ts             # Middlewares globales de TanStack Start
│   ├── server.ts            # Punto de entrada SSR con captura y renderizado de errores
│   └── styles.css           # Tailwind CSS v4 y tokens de diseño
├── supabase/
│   ├── functions/           # Edge Functions (appointment-reminders, doctor-fees)
│   ├── migrations/          # Migraciones SQL y políticas RLS
│   └── config.toml          # Configuración local de Supabase
├── package.json
├── tsconfig.json
├── vercel.json              # Configuración de despliegue ("framework": "tanstack-start")
└── vite.config.ts           # TanStack Start + Nitro (preset vercel)
```

---

<div align="center">

Desarrollado para la gestión clínica de alta eficiencia.  
**Medizen — Medicina en Flujo Continuo.**

</div>
