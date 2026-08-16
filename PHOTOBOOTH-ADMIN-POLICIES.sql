-- AB Photography — permisos privados para el panel Photobooth
-- Ejecutar una sola vez en Supabase > SQL Editor.
--
-- El público/anon sigue SIN poder listar, leer o borrar fotos.
-- Estos permisos se aplican únicamente a sesiones de Supabase Auth.

drop policy if exists "Photobooth admin read metadata" on public.photobooth_photos;
drop policy if exists "Photobooth admin delete metadata" on public.photobooth_photos;
drop policy if exists "Photobooth admin read files" on storage.objects;
drop policy if exists "Photobooth admin delete files" on storage.objects;

create policy "Photobooth admin read metadata"
on public.photobooth_photos
for select
to authenticated
using (true);

create policy "Photobooth admin delete metadata"
on public.photobooth_photos
for delete
to authenticated
using (true);

create policy "Photobooth admin read files"
on storage.objects
for select
to authenticated
using (bucket_id = 'photobooth');

create policy "Photobooth admin delete files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'photobooth');
