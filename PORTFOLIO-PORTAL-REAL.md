# Photographer Portal real — Portafolio

## Qué permite
- Subir varias fotos desde el portal.
- Elegir categoría: Bodas, Quinceañeras, Sesiones o Eventos.
- Ocultar/mostrar sin borrar.
- Elegir la foto de portada.
- Cambiar el orden.
- Eliminar permanentemente.
- Importar las 28 fotos actuales de Bodas para administrarlas.

## Instalación
1. En Supabase abre **SQL Editor**.
2. Copia y ejecuta `SUPABASE-PORTFOLIO-SETUP.sql`.
3. Copia todos los archivos de este paquete a la carpeta local de GitHub.
4. En GitHub Desktop: **Commit to main** y después **Push origin**.
5. Entra a `https://abphotographytx.com/admin.html`.
6. Abre **Portfolio Manager**.

## Importante
El botón **Importar las 28 fotos actuales de Bodas** se usa una sola vez.
Después podrás ocultarlas, ordenarlas o elegir portada desde el portal.


## Actualización Drag & Drop
- Se eliminó el botón de importar fotografías.
- Se eliminaron los botones Subir/Bajar.
- El orden se cambia arrastrando miniaturas.
- El nuevo orden se guarda automáticamente.
- También puedes arrastrar fotografías desde una carpeta de Windows hacia el área de carga.
- En celular, mantén presionado el icono ⋮⋮ y arrastra la foto.


## Vista de dos columnas
- El administrador muestra siempre 2 columnas.
- El orden visual se lee de izquierda a derecha y luego continúa en la siguiente fila.
- Cada miniatura muestra un número para confirmar su posición.
- Al arrastrar una foto, el orden se guarda automáticamente.


## Galería pública móvil en filas
La galería pública ahora usa dos columnas con orden estricto de izquierda a derecha:

1 2
3 4
5 6

Para evitar huecos, las miniaturas usan una proporción uniforme 4:5 y pueden recortar ligeramente los bordes.
Al abrir una fotografía en el lightbox se muestra la imagen completa.
