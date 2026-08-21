-- AB PHOTOGRAPHY — CONFIGURACIÓN DE EVENTOS DEL PHOTOBOOTH
-- Ejecutar una sola vez en Supabase > SQL Editor.

create table if not exists public.photobooth_events (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null unique,
  display_name text not null,
  event_date date,
  footer_text text not null default 'CAPTURA · SONRÍE · REPITE',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.photobooth_events enable row level security;

drop policy if exists "Photobooth public active event configs" on public.photobooth_events;
drop policy if exists "Photobooth admin read event configs" on public.photobooth_events;
drop policy if exists "Photobooth admin insert event configs" on public.photobooth_events;
drop policy if exists "Photobooth admin update event configs" on public.photobooth_events;
drop policy if exists "Photobooth admin delete event configs" on public.photobooth_events;

-- El iPad sin login solo puede leer eventos marcados como activos.
create policy "Photobooth public active event configs"
on public.photobooth_events
for select
to anon
using (active = true);

-- El panel autenticado puede administrar todos los eventos.
create policy "Photobooth admin read event configs"
on public.photobooth_events
for select
to authenticated
using (true);

create policy "Photobooth admin insert event configs"
on public.photobooth_events
for insert
to authenticated
with check (true);

create policy "Photobooth admin update event configs"
on public.photobooth_events
for update
to authenticated
using (true)
with check (true);

create policy "Photobooth admin delete event configs"
on public.photobooth_events
for delete
to authenticated
using (true);
