-- ==========================================================
-- AB PHOTOGRAPHY - PHOTOBOOTH PRIVADO + EXPIRACIÓN 3 DÍAS
-- Ejecutar UNA sola vez en Supabase > SQL Editor.
-- ==========================================================

-- 1. El bucket photobooth pasa a PRIVADO.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photobooth',
  'photobooth',
  false,
  2097152,
  array['image/jpeg']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Mantener únicamente permiso anónimo de SUBIDA.
drop policy if exists "Photobooth anonymous uploads" on storage.objects;

create policy "Photobooth anonymous uploads"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'photobooth'
  and (storage.foldername(name))[1] = 'sessions'
  and lower(storage.extension(name)) in ('jpg','jpeg')
);

-- No se crea policy anónima de SELECT, UPDATE o DELETE.

-- 3. Registro privado de cada foto.
create table if not exists public.photobooth_photos (
  access_token uuid primary key,
  path text not null unique,
  event_slug text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 days')
);

alter table public.photobooth_photos enable row level security;

-- El navegador puede registrar una foto recién subida,
-- pero NO puede leer la tabla.
drop policy if exists "Photobooth register uploads" on public.photobooth_photos;

create policy "Photobooth register uploads"
on public.photobooth_photos
for insert
to anon, authenticated
with check (
  path like 'sessions/%'
  and char_length(path) <= 500
  and char_length(event_slug) between 1 and 64
  and expires_at > now() + interval '2 days 23 hours'
  and expires_at <= now() + interval '3 days 5 minutes'
);

-- Índice para que la limpieza de expirados sea rápida.
create index if not exists photobooth_photos_expires_at_idx
on public.photobooth_photos (expires_at);
