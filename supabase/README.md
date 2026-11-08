# Migraciones de Supabase

Este directorio contiene las migraciones SQL versionadas del esquema de Supabase
usado por el backend del Gestor Inteligente de Documentos.

## Estructura

- `supabase/migrations/001_initial_schema.sql`: esquema inicial (tablas
  `documents`, `document_analysis`, `extracted_metadata`, `document_derivations`,
  índices y RLS base).

## Cómo aplicar

Las migraciones se aplican en orden numérico sobre la base de datos de Supabase:

```bash
# Local (Supabase CLI o psql contra una instancia local)
psql "$SUPABASE_URL" < supabase/migrations/001_initial_schema.sql

# Producción: aplicar desde el SQL Editor de Supabase o mediante la CLI de Supabase
supabase db push  # si se usa Supabase CLI vinculado al proyecto remoto
```

## Reglas

1. Cada migración es un archivo `.sql` nombrado `NNN_descripcion.sql`.
2. Las migraciones son inmutables: una vez mergeadas a `develop`, no se
   modifican; para cambios nuevos se crea una siguiente migración.
3. Cada migración debe ser idempotente (`create table if not exists`) para
   poder reejecutarse sin fallar.
4. Los cambios de esquema deben ir acompañados de una actualización de
   `src/types/supabase.ts` y de los servicios que consumen las tablas.

## Validación en CI (pendiente)

Según el roadmap de Phase 2, se debe agregar un job de CI que valide las
migraciones (por ejemplo, aplicándolas contra un PostgreSQL efímero o
comprobando su sintaxis) antes de permitir el merge a `develop`.
