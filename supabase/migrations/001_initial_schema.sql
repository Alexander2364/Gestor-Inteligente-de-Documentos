-- Migración 001: esquema inicial del Gestor Inteligente de Documentos.
--
-- Las tablas reflejan los tipos definidos en src/types/supabase.ts.
-- El backend se autentica con SUPABASE_SECRET_KEY (service_role), por lo que
-- las consultas del servidor omiten RLS. Las políticas de RLS se definen como
-- base para futuros accesos directos desde el frontend; pueden endurecerse sin
-- afectar al backend actual.

-- Tabla principal: documentos subidos al sistema.
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  file_name text not null,
  storage_url text not null,
  upload_date timestamptz not null default now(),
  processing_status text not null default 'pending'
    check (processing_status in ('pending','processing','completed','failed'))
);

-- Análisis de categoría/IA generado por el clasificador (Gemini o local).
create table if not exists public.document_analysis (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  document_category text not null,
  confidence_percentage numeric not null default 0
    check (confidence_percentage between 0 and 100),
  ai_summary text,
  processed_at timestamptz not null default now()
);

-- Metadatos extraídos (RUC, montos, domicilios, etc.).
create table if not exists public.extracted_metadata (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  field_name text not null,
  field_value text not null,
  confidence numeric not null default 0
    check (confidence between 0 and 100)
);

-- Derivaciones a áreas (SUNAT, aduanas, recaudación, etc.).
create table if not exists public.document_derivations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  target_area text not null,
  derivation_reason text,
  status text not null default 'PENDING'
    check (status in ('PENDING','NOTIFICADO','pending','in-progress','completed','failed')),
  created_at timestamptz not null default now()
);

-- Índices para consultas frecuentes del backend y n8n.
create index if not exists idx_documents_status on public.documents(processing_status);
create index if not exists idx_documents_upload_date on public.documents(upload_date desc);
create index if not exists idx_document_analysis_document on public.document_analysis(document_id);
create index if not exists idx_extracted_metadata_document on public.extracted_metadata(document_id);
create index if not exists idx_document_derivations_document on public.document_derivations(document_id);
create index if not exists idx_document_derivations_status on public.document_derivations(status);
create index if not exists idx_document_derivations_target_area on public.document_derivations(target_area);

-- Habilitar RLS (base para futuras políticas; el backend usa service_role y la omite).
alter table public.documents enable row level security;
alter table public.document_analysis enable row level security;
alter table public.extracted_metadata enable row level security;
alter table public.document_derivations enable row level security;

-- Comentarios de documentación.
comment on table public.documents is 'Documentos subidos al sistema (origen de verdad del catálogo).';
comment on table public.document_analysis is 'Resultado de clasificación de IA por documento.';
comment on table public.extracted_metadata is 'Campos y datos clave extraídos de cada documento.';
comment on table public.document_derivations is 'Derivaciones de documentos a áreas organizacionales.';
