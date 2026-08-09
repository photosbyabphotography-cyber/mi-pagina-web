# Fix de subcategorías y Supabase

Las categorías nuevas ya no se insertan como valores nuevos en `portfolio_photos.category`.

Se conserva la estructura original:
- `sessions`
- `events`

Y se separan mediante `storage_path`:
- `sessions/couples/`
- `sessions/graduation/`
- `sessions/maternity/`
- `sessions/family/`
- `events/baptisms/`
- `events/birthdays/`
- `events/baby-shower/`
- `events/bridal-shower/`

Esto mantiene compatibilidad con la base de datos y las políticas existentes.
