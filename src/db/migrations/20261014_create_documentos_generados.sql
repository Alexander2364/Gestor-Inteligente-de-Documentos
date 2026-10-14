CREATE TABLE IF NOT EXISTS documentos_generados (
  id SERIAL PRIMARY KEY,
  tipo_documento VARCHAR(100) NOT NULL,
  area VARCHAR(255) NOT NULL,
  datos_json JSONB NOT NULL,
  pdf_url TEXT NOT NULL,
  fecha_generacion TIMESTAMP NOT NULL DEFAULT NOW(),
  usuario VARCHAR(255)
);