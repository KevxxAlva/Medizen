---
name: auditoria-ui-performance
description: >-
  Audita componentes y pantallas frontend (React, Tailwind CSS, shadcn/ui) evaluando rendimiento (INP, re-renders, Core Web Vitals), calidad de UI/UX mobile-first, accesibilidad y estados de interacción. Usa esta skill cuando el usuario pregunte si una interfaz está buena, pida revisar o auditar un componente/pantalla, comparta capturas de alertas de rendimiento (como React Scan o Lighthouse), o quiera optimizar la fluidez y diseño de su interfaz.
---

# Auditoría UI y Performance

Evalúa de forma integral la calidad visual, experiencia de usuario (UX) y rendimiento técnico de componentes y pantallas web en React, Tailwind CSS y shadcn/ui, entregando diagnósticos accionables y código optimizado.

## Cuándo usar esta skill

* El usuario pregunta si su interfaz, pantalla o componente "está bueno" o pide feedback de UI/UX.
* El usuario comparte código de un componente (React/Tailwind) o una captura de pantalla para auditar su calidad o rendimiento.
* Se reportan problemas de lentitud al hacer clic, bloqueos del hilo principal o alertas de métricas como **INP** (Interaction to Next Paint), **LCP** o **CLS**.
* Se busca validar el diseño mobile-first, tamaños táctiles, accesibilidad o estados de carga antes de pasar a producción.

## Pasos de Auditoría

### 1. Analizar el contexto de entrada
Identifica si el usuario compartió una captura de pantalla (diseño visual o alerta de DevTools / React Scan / Lighthouse), un fragmento de código (o ruta de archivo en el proyecto), o ambos.

### 2. Auditar Rendimiento y Reactividad (Objetivo INP < 200ms)
* **Manejadores de eventos (`onClick`, `onChange`)**: Verifica que no ejecuten lógica síncrona pesada ni provoquen re-renderizados masivos que bloqueen el pintado del siguiente fotograma. Si un cambio de estado dispara un render pesado (como filtrar listas grandes o cambiar vistas de calendario), aplica `useTransition` (`startTransition`) para separar el feedback visual inmediato de la actualización pesada.
* **Cálculos en el cuerpo del componente**: Detecta operaciones `.filter()`, `.map()`, `.sort()` o instanciación repetitiva de fechas (`new Date()`) en cada render y envuélvelas en `useMemo`.
* **Estabilidad de referencias y listas**: Revisa que las listas usen `key` únicas y estables (nunca el índice del array si la lista cambia de orden o se filtra) y que los componentes hijos pesados no se re-rendericen innecesariamente.

### 3. Auditar UI/UX y Diseño Mobile-First (Tailwind CSS)
* **Áreas táctiles (Touch Targets)**: Asegura que botones, pestañas y controles interactivos tengan al menos `44x44px` en pantallas móviles (ej. `min-h-11`, `h-11` o `p-3` adecuado) para evitar toques fallidos.
* **Feedback de interacción**: Verifica que todo elemento interactivo tenga estados visuales claros: `hover:`, `focus-visible:ring-2`, feedback táctil inmediato (`active:scale-95` o cambio de opacidad) y estado `disabled:opacity-50 disabled:pointer-events-none`.
* **Estados de la interfaz**: Comprueba que existan estados de carga (skeletons o spinners durante peticiones o `isPending`), estados vacíos claros (*empty states*) y manejo de errores, evitando saltos de diseño (CLS).
* **Jerarquía y Contraste**: Revisa la legibilidad de textos secundarios (`text-muted-foreground`), el contraste en modo oscuro/claro y el espaciado consistente.

### 4. Auditar Accesibilidad (a11y)
* Verifica el uso de etiquetas semánticas (`<button type="button">`, `<nav>`, `<main>`) en lugar de `<div onClick>`.
* Exige `aria-label` descriptivos en botones que solo contienen iconos.

### 5. Entregar el Reporte y Código Optimizado
Estructura siempre la respuesta en tres bloques claros y directos:
1. **Veredicto Rápido**: Resumen de 1-2 líneas sobre el estado actual (qué funciona bien y cuál es el cuello de botella principal).
2. **Hallazgos Clave (Priorizados)**: Lista concreta dividida en **Crítico** (bloqueos de INP, fallos de usabilidad), **Mejora UI/UX** y **Accesibilidad**.
3. **Solución en Código**: El fragmento de código refactorizado listo para copiar y pegar que resuelve los problemas detectados.

## Gotchas

* **No sugieras optimizaciones prematuras** (`useMemo`/`useCallback` en variables primitivas simples) que ensucien el código sin aportar ganancia real en el hilo principal.
* **En interfaces mobile-first, no confíes únicamente en estados `:hover`**, ya que en pantallas táctiles no existen o se quedan pegados tras el toque; prioriza estados `:active` y transiciones rápidas (`transition-transform duration-150`).
* **Cuando el usuario solo suba una imagen de una alerta de rendimiento sin el código fuente**, explica la causa exacta del bloqueo, ofrece el patrón de código específico para solucionarlo y pide el componente para refactorizarlo directamente.
