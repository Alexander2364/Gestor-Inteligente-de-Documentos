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

## Calidad, lint y hooks

| Comando | Qué hace |
|---|---|
| `npm run lint` | ESLint (flat config en `eslint.config.mjs`) |
| `npm run lint:fix` | ESLint con `--fix` |
| `npm run format` / `npm run format:check` | Prettier sobre `src/` y `tests/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |

Los hooks de Git (Husky) se instalan solos al ejecutar `npm install` (script
`prepare`). En cada commit, `lint-staged` ejecuta `eslint --fix` y
`prettier --write` **solo** sobre los archivos preparados.

### Escaneo de secretos (Gitleaks)

- En CI se ejecuta siempre (`gitleaks/gitleaks-action`) sobre los commits del PR.
- En local es opcional: si tienes el binario `gitleaks` instalado, el hook
  `pre-commit` lo ejecuta automáticamente; si no, se omite y el CI lo cubre igual.
- Instalación (verifica con `gitleaks version`): binario oficial en
  <https://github.com/gitleaks/gitleaks/releases>; macOS `brew install gitleaks`;
  Windows `scoop install gitleaks`.
- Configuración: `.gitleaks.toml` (allowlist para `.env.example`, locks, etc.).

### Qué corre dónde

| Comprobación | Local (pre-commit) | CI |
|---|---|---|
| ESLint + Prettier | sí (archivos staged) | sí |
| Gitleaks | sí, si está instalado | sí |
| `tsc --noEmit` | — | sí |
| Vitest | — | sí |

### Integración continua (GitHub Actions)

`.github/workflows/main.yml` se ejecuta en cada push a `develop`/`main` y en
cada Pull Request hacia esas ramas:

| Job | Comprueba |
|---|---|
| `Lint, tipos, tests y build` | `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test` y `npm run build` |
| `Escaneo de secretos` | Gitleaks sobre el historial completo |

- Todo corre en **un solo job**: se instala una única vez (antes eran 5 jobs
  encadenados que reinstalaban dependencias 5 veces).
- La versión de Node la fija `.nvmrc` (**22**, la misma que el `Dockerfile`).
- `PUPPETEER_SKIP_DOWNLOAD=true`: los tests mockean Puppeteer, así que no se
  descarga Chromium.
- Las ejecuciones antiguas de la misma rama se cancelan solas (`concurrency`).

> Para que estos checks **bloqueen el merge**, márcalos como *required status
> checks* en la protección de rama usando los nombres exactos de los jobs:
> `Lint, tipos, tests y build` y `Escaneo de secretos`.
