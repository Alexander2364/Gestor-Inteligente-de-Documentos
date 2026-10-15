# API

La API se ejecuta por defecto en `http://localhost:3000`.

## POST `/upload/mobile`

Procesa una fotografía de un documento tomada con un dispositivo móvil. El endpoint preprocesa la imagen, ejecuta OCR con Tesseract y clasifica el texto extraído.

### Request

- **Content-Type:** `multipart/form-data`
- **Campo:** `file`
- **Formatos aceptados:** JPEG/JPG, PNG, HEIC y HEIF
- **Tamaño máximo:** 10 MB

Ejemplo:

```bash
curl -X POST http://localhost:3000/upload/mobile \
  -F "file=@./acta-inmovilizacion.jpg"
```

### Response `200 OK`

```json
{
  "tipoDocumento": "ACTA_INMOVILIZACION",
  "confianza": 0.92,
  "campos": {
    "numeroActa": "ACT-2026-001",
    "tipoAccion": "INMOVILIZACION",
    "fecha": "14/10/2026",
    "ruc": "20123456789",
    "bienes": [
      {
        "numero": "1",
        "cantidad": "10",
        "unidadMedida": "cajas",
        "descripcion": "Repuestos",
        "observaciones": ""
      }
    ],
    "lugarCustodia": "Almacen SUNAT"
  },
  "resumenEjecutivo": "Acta de inmovilizacion ACT-2026-001. Revisar los datos extraidos y validar la integridad del documento.",
  "templateSugerido": "ACTA_INMOVILIZACION"
}
```

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `tipoDocumento` | `string` | Tipo de documento clasificado. |
| `confianza` | `number` | Confianza de la clasificacion, entre `0` y `1`. |
| `campos` | `object` | Campos extraidos del documento. |
| `resumenEjecutivo` | `string` | Resumen generado a partir de la clasificacion. |
| `templateSugerido` | `string` | Tipo de plantilla sugerida para el frontend. |

### Errores

| HTTP | Caso | Ejemplo de respuesta |
| --- | --- | --- |
| `400` | No se envio el campo `file`. | `{ "error": "No se envio ninguna imagen" }` |
| `415` | El MIME no es una imagen movil admitida. | `{ "error": "Tipo de imagen no soportado: text/plain" }` |
| `500` | Fallo durante el preprocesamiento, OCR o clasificacion. | `{ "error": "Error procesando imagen" }` |

## GET `/template/:tipoDocumento`

Devuelve la plantilla de campos que el frontend debe utilizar para un tipo de documento.

### Request

El tipo de documento se envia como parametro en la URL. Actualmente existen plantillas para `ACTA_INMOVILIZACION` y `ACTA_INCAUTACION`.

Ejemplo:

```bash
curl http://localhost:3000/template/ACTA_INMOVILIZACION
```

### Response `200 OK`

```json
{
  "tipoDocumento": "ACTA_INMOVILIZACION",
  "area": "Prevencion del Contrabando",
  "campos": [
    {
      "nombre": "numeroActa",
      "label": "N° Acta",
      "tipo": "text",
      "requerido": true
    },
    {
      "nombre": "tipoAccion",
      "label": "Tipo de Accion",
      "tipo": "select",
      "opciones": [
        "INMOVILIZACION",
        "INCAUTACION"
      ]
    },
    {
      "nombre": "bienes",
      "label": "Bienes",
      "tipo": "array",
      "subcampos": [
        { "nombre": "numero", "label": "N°", "tipo": "text" },
        { "nombre": "cantidad", "label": "Cantidad", "tipo": "text" },
        { "nombre": "unidadMedida", "label": "Unidad de Medida", "tipo": "text" },
        { "nombre": "descripcion", "label": "Descripcion", "tipo": "text" },
        { "nombre": "observaciones", "label": "Observaciones", "tipo": "text" }
      ]
    }
  ]
}
```

### Errores

| HTTP | Caso | Ejemplo de respuesta |
| --- | --- | --- |
| `400` | `tipoDocumento` contiene caracteres no validos. | `{ "error": "Tipo de documento invalido" }` |
| `404` | No existe una plantilla para el tipo indicado. | `{ "error": "Plantilla no encontrada" }` |
| `500` | Error inesperado del servidor. | `{ "error": "Error interno del servidor" }` |
