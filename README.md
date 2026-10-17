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
