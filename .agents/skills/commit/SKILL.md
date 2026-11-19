---
name: commit
description: >-
  Analiza los cambios del repositorio mediante git diff y git status, agrega los archivos al área de preparación (staging) y genera automáticamente commits semánticos bajo el estándar Conventional Commits (feat, fix, refactor, chore, docs, style, etc.).
---

# Skill: Commit Semántico Automatizado

Este skill guía la preparación, análisis y creación automática de commits siguiendo el estándar de **Conventional Commits**.

## Procedimiento Paso a Paso

### 1. Inspección del Estado
Ejecutar los siguientes comandos para evaluar qué archivos han cambiado y entender el contexto:
```bash
git status -s
git diff
```

### 2. Preparación de Cambios (Staging)
Agregar los cambios al área de preparación:
```bash
git add .
```
> [!NOTE]
> Verificar que no se incluyan por error archivos con contraseñas, variables de entorno (`.env`), tokens o archivos temporales de compilación.

### 3. Análisis de Tipos Convencionales
Identificar el tipo principal del commit según los cambios observados:
* `feat`: Nueva funcionalidad o módulo para el usuario o sistema.
* `fix`: Corrección de errores, bugs o comportamientos inesperados.
* `refactor`: Reestructuración de código sin alterar su funcionamiento externo.
* `style`: Cambios de formato, CSS, colores, estilos o apariencia visual.
* `docs`: Documentación, README o comentarios explicativos.
* `chore`: Mantenimiento, dependencias, configuraciones o limpieza de archivos obsoletos.
* `test`: Adición o modificación de pruebas.

### 4. Construcción del Mensaje
El mensaje debe seguir la estructura:
```text
<tipo>(<alcance opcional>): <descripción concisa en modo imperativo>

[Cuerpo explicativo opcional si los cambios abarcan múltiples áreas]
```

Ejemplos:
* `feat(compras): eliminar modulo de compras y rutas asociadas`
* `fix(citas): calcular costo base real en facturacion automatica`
* `style(theme): corregir renderizado del icono de luna en modo oscuro`

### 5. Ejecución del Commit
Crear el commit con el mensaje generado:
```bash
git commit -m "<mensaje>"
```

### 6. Verificación
Comprobar que el commit se haya creado exitosamente y que el árbol de trabajo quede limpio:
```bash
git log -n 1 --stat
git status
```
