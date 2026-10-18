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


Nuevas Funcionalidades
-Despliegue de la Plataforma en Contenedores 
El núcleo del backend ha sido empaquetado utilizando Docker. Como se evidencia en el archivo Dockerfile en la raíz del repositorio, el entorno de Node.js se construye con todas las dependencias necesarias del sistema (incluyendo librerías para el manejo de imágenes y OCR).

-Flujo de Captura y Recepción de Datos 

El dispositivo móvil o cámara actúa como el nodo físico que digitaliza el documento. Una vez capturada la fotografía, esta se envía a la API contenida en nuestro backend. 

-Preprocesamiento de Imágenes y OCR (Extracción) 

Una fotografía de un documento físico suele tener ruido, mala iluminación o perspectivas distorsionadas. El código aborda este problema antes de la extracción de texto:

-Procesamiento por IA y Persistencia de Datos 

El ciclo del procesamiento culmina con la interpretación inteligente y el almacenamiento:




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
| `install` | `npm ci` (puerta de entrada) |
| `typecheck` | `npm run typecheck` |
| `lint` | `npm run lint` y `npm run format:check` |
| `test` | `npm run test` |
| `build` | `npm run build` |
| `Escaneo de secretos` | Gitleaks sobre el historial completo |

- `typecheck`, `lint`, `test` y `build` corren **en paralelo** (todos esperan a
  `install`) en lugar de encadenarse, así el pipeline termina antes.
- La versión de Node la fija `.nvmrc` (**22**, la misma que el `Dockerfile`).
- `PUPPETEER_SKIP_DOWNLOAD=true`: los tests mockean Puppeteer, así que no se
  descarga Chromium.
- Las ejecuciones antiguas de la misma rama se cancelan solas (`concurrency`).

> **No renombrar los jobs `install`, `typecheck`, `lint`, `test` y `build`**:
> están fijados como *required status checks* en los rulesets `Proteccion-main`
> y `proteccion-develop`. Si desaparecen, los Pull Request quedan bloqueados.
