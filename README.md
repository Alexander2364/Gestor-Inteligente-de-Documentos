# Gestor-Inteligente-de-Documentos
prototipo funcional de un sistema automatizado
# Reglas del proyecto

## Ramas

- `main`: código estable para la sustentación.
- `develop`: integración del código.
- `feature/*`: desarrollo de funcionalidades.
- `fix/*`: corrección de errores.
- `docs/*`: documentación.

## Regla obligatoria

Nadie puede hacer push directamente a `main` o `develop`.

Todo cambio debe realizarse mediante una rama de trabajo y posteriormente mediante Pull Request.

Flujo:

`feature/* → develop → main`

## Nombres de ramas

Ejemplos correctos:

- `feature/backend-basico`
- `feature/frontend-dashboard`
- `feature/rpa-correos`
- `fix/error-cors`
- `docs/readme`

Si el nombre de la rama no cumple este formato, el Pull Request será rechazado.

## Commits

Todos los commits deben utilizar:

- `feat:` para nuevas funcionalidades.
- `fix:` para correcciones.
- `docs:` para documentación.
- `chore:` para mantenimiento.

Ejemplos:

`feat: añadir endpoint /upload`

`fix: corregir error de CORS`

`docs: actualizar README`

`chore: actualizar dependencias`

**Si no usan este estándar, les rechazo el PR.**
