(() => {
  const cfg = window.AB_SUPABASE;
  const sb = window.supabase.createClient(cfg.url, cfg.publishableKey);

  const checkingView = document.getElementById('checkingView');
  const managerView = document.getElementById('managerView');
  const categoryEl = document.getElementById('category');
  const filesEl = document.getElementById('files');
  const uploadBtn = document.getElementById('uploadBtn');
  const dropZone = document.getElementById('dropZone');
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const status = document.getElementById('status');
  const progressBar = document.getElementById('progressBar');

  let photos = [];
  let draggedId = null;
  let orderSavingBadge = null;

  const labels = {
    weddings:'Bodas',
    quinceaneras:'Quinceañeras',
    sessions:'Sesiones · Archivo actual',
    'sessions-couples':'Sesiones · Parejas',
    'sessions-graduation':'Sesiones · Graduación',
    'sessions-maternity':'Sesiones · Embarazo',
    'sessions-family':'Sesiones · Familiar',
    'events-baptisms':'Eventos · Bautizos',
    'events-birthdays':'Eventos · Cumpleaños',
    'events-baby-shower':'Eventos · Baby Shower',
    'events-bridal-shower':'Eventos · Bridal Shower',
    events:'Eventos'
  };


  // Las subcategorías nuevas se guardan dentro de las categorías originales
  // de Supabase para conservar compatibilidad con la base de datos existente.
  const categoryRoutes = {
    'sessions-couples':    { db:'sessions', folder:'couples' },
    'sessions-graduation': { db:'sessions', folder:'graduation' },
    'sessions-maternity':  { db:'sessions', folder:'maternity' },
    'sessions-family':     { db:'sessions', folder:'family' },
    'events-baptisms':     { db:'events', folder:'baptisms' },
    'events-birthdays':    { db:'events', folder:'birthdays' },
    'events-baby-shower':  { db:'events', folder:'baby-shower' },
    'events-bridal-shower':{ db:'events', folder:'bridal-shower' }
  };

  function routeFor(uiCategory = categoryEl.value) {
    return categoryRoutes[uiCategory] || { db:uiCategory, folder:null };
  }

  function belongsToRoute(photo, uiCategory = categoryEl.value) {
    const route = routeFor(uiCategory);
    if (photo.category !== route.db) return false;
    if (!route.folder) {
      // "Archivo actual": solo archivos que no estén dentro de una de las
      // subcarpetas administradas por este portal.
      const managed = Object.values(categoryRoutes)
        .filter(r => r.db === route.db)
        .some(r => (photo.storage_path || '').startsWith(`${route.db}/${r.folder}/`));
      return !managed;
    }
    return (photo.storage_path || '').startsWith(`${route.db}/${route.folder}/`);
  }


  const managedSections = [
    ['sessions-couples','Sesiones · Parejas'],
    ['sessions-graduation','Sesiones · Graduación'],
    ['sessions-maternity','Sesiones · Embarazo'],
    ['sessions-family','Sesiones · Familiar'],
    ['events-baptisms','Eventos · Bautizos'],
    ['events-birthdays','Eventos · Cumpleaños'],
    ['events-baby-shower','Eventos · Baby Shower'],
    ['events-bridal-shower','Eventos · Bridal Shower']
  ];

  async function renderVisibilityControls() {
    const host = document.getElementById('categoryVisibilityGrid');
    if (!host) return;

    const { data, error } = await sb
      .from('portfolio_photos')
      .select('id,category,storage_path,is_visible');
    if (error) {
      host.innerHTML = '<p class="muted">No se pudo cargar la visibilidad.</p>';
      return;
    }

    host.innerHTML = '';
    managedSections.forEach(([uiCategory,label]) => {
      const rows = (data || []).filter(p => belongsToRoute(p, uiCategory));
      const hasPhotos = rows.length > 0;
      const shown = hasPhotos && rows.some(p => p.is_visible);

      const row = document.createElement('label');
      row.className = 'visibility-row';
      row.innerHTML = `<span><strong>${label}</strong><br><small>${hasPhotos ? (shown ? 'Visible en la web' : 'Oculta') : 'Sin fotos · se oculta automáticamente'}</small></span>
        <input class="visibility-toggle" type="checkbox" ${shown ? 'checked' : ''} ${hasPhotos ? '' : 'disabled'} aria-label="Cambiar visibilidad de ${label}">`;

      const input = row.querySelector('input');
      input.addEventListener('change', async () => {
        const makeVisible = input.checked;
        const results = await Promise.all(rows.map(p =>
          sb.from('portfolio_photos').update({is_visible:makeVisible}).eq('id',p.id)
        ));
        const failed = results.find(r => r.error);
        if (failed) {
          input.checked = !makeVisible;
          setStatus('No se pudo cambiar la visibilidad: ' + failed.error.message, true);
          return;
        }
        setStatus(`${label}: ${makeVisible ? 'visible' : 'oculta'} en la página.`);
        await renderVisibilityControls();
        if (uiCategory === categoryEl.value) await loadPhotos();
      });

      host.appendChild(row);
    });
  }

  function setStatus(text, error=false) {
    status.textContent = text || '';
    status.style.color = error ? '#7d2e2e' : '#4e4945';
  }

  async function requireAdmin() {
    const { data:{ session } } = await sb.auth.getSession();
    if (!session) {
      location.href = 'admin.html';
      return false;
    }

    const { data, error } = await sb
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error || data?.role !== 'admin') {
      checkingView.innerHTML = `
        <div class="panel">
          <h2>Acceso no autorizado</h2>
          <p class="note">Esta cuenta no tiene permisos de administrador.</p>
          <a class="btn" href="admin.html">Volver</a>
        </div>`;
      return false;
    }

    checkingView.classList.add('hidden');
    managerView.classList.remove('hidden');
    return true;
  }

  async function loadPhotos() {
    setStatus('Cargando fotografías…');

    const route = routeFor();
    const { data, error } = await sb
      .from('portfolio_photos')
      .select('*')
      .eq('category', route.db)
      .order('sort_order', { ascending:true })
      .order('created_at', { ascending:true });

    if (error) {
      setStatus('No se pudo cargar el portafolio: ' + error.message, true);
      return;
    }

    photos = (data || []).filter(photo => belongsToRoute(photo));
    render();
    renderVisibilityControls();
    setStatus(`${photos.length} fotografía(s) en ${labels[categoryEl.value]}. Orden: izquierda a derecha y después continúa en la siguiente fila. Arrastra para cambiarlo.`);
  }

  function render() {
    grid.innerHTML = '';
    empty.classList.toggle('hidden', photos.length > 0);

    photos.forEach((photo, index) => {
      const card = document.createElement('article');
      card.className =
        'card' +
        (!photo.is_visible ? ' hidden-card' : '') +
        (photo.is_cover ? ' is-cover' : '');

      card.draggable = true;
      card.dataset.id = photo.id;
      card.dataset.position = String(index + 1);

      card.innerHTML = `
        <div class="drag-handle" title="Arrastrar para ordenar" aria-label="Arrastrar para ordenar">⋮⋮</div>
        <div class="cover-badge">★ PORTADA</div>
        <div class="thumb"><img src="${photo.public_url}" alt=""></div>
        <div class="meta">
          <div class="name" title="${photo.original_name || ''}">
            ${photo.original_name || 'Fotografía'}
          </div>
          <div class="controls">
            <button data-action="cover">★ Usar como portada</button>
            <button data-action="toggle">${photo.is_visible ? 'Ocultar' : 'Mostrar'}</button>
            <button data-action="delete" class="wide">Eliminar definitivamente</button>
          </div>
        </div>`;

      card.querySelector('[data-action="cover"]').onclick = () => setCover(photo);
      card.querySelector('[data-action="toggle"]').onclick = () => toggleVisible(photo);
      card.querySelector('[data-action="delete"]').onclick = () => removePhoto(photo);

      card.addEventListener('dragstart', onDragStart);
      card.addEventListener('dragover', onDragOver);
      card.addEventListener('dragleave', onDragLeave);
      card.addEventListener('drop', onDrop);
      card.addEventListener('dragend', onDragEnd);

      enableTouchSorting(card);
      grid.appendChild(card);
    });
  }

  function onDragStart(e) {
    draggedId = e.currentTarget.dataset.id;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedId);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-target');
    e.dataTransfer.dropEffect = 'move';
  }

  function onDragLeave(e) {
    e.currentTarget.classList.remove('drag-target');
  }

  async function onDrop(e) {
    e.preventDefault();
    const targetId = e.currentTarget.dataset.id;
    e.currentTarget.classList.remove('drag-target');
    if (!draggedId || draggedId === targetId) return;
    reorderByIds(draggedId, targetId);
    await saveOrder();
  }

  function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.card.drag-target').forEach(el => el.classList.remove('drag-target'));
    draggedId = null;
  }

  function reorderByIds(sourceId, targetId) {
    const sourceIndex = photos.findIndex(p => p.id === sourceId);
    const targetIndex = photos.findIndex(p => p.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [moved] = photos.splice(sourceIndex, 1);
    photos.splice(targetIndex, 0, moved);
    render();
  }

  function showSavingBadge(text='Guardando orden…') {
    orderSavingBadge?.remove();
    orderSavingBadge = document.createElement('div');
    orderSavingBadge.className = 'order-saving';
    orderSavingBadge.textContent = text;
    document.body.appendChild(orderSavingBadge);
  }

  async function saveOrder() {
    showSavingBadge();

    const updates = photos.map((photo, index) =>
      sb.from('portfolio_photos').update({ sort_order:index }).eq('id', photo.id)
    );

    const results = await Promise.all(updates);
    const failed = results.find(r => r.error);

    if (failed) {
      showSavingBadge('No se pudo guardar');
      setStatus(failed.error.message, true);
      setTimeout(() => orderSavingBadge?.remove(), 1800);
      return;
    }

    photos = photos.map((photo, index) => ({...photo, sort_order:index}));
    showSavingBadge('Orden guardado');
    setTimeout(() => orderSavingBadge?.remove(), 1000);
    setStatus(`${photos.length} fotografía(s) en ${labels[categoryEl.value]}.`);
  }

  // Touch sorting for phones/tablets: long press then drag card.
  function enableTouchSorting(card) {
    let active = false;
    let clone = null;
    let startTimer = null;

    card.addEventListener('touchstart', (e) => {
      if (!e.target.closest('.drag-handle')) return;
      const touch = e.touches[0];

      startTimer = setTimeout(() => {
        active = true;
        draggedId = card.dataset.id;
        card.classList.add('dragging');

        clone = card.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = `${touch.clientX - 75}px`;
        clone.style.top = `${touch.clientY - 100}px`;
        clone.style.width = '150px';
        clone.style.pointerEvents = 'none';
        clone.style.zIndex = '999';
        clone.style.opacity = '.9';
        clone.style.transform = 'scale(.95)';
        document.body.appendChild(clone);
      }, 280);
    }, {passive:true});

    card.addEventListener('touchmove', (e) => {
      if (!active) return;
      e.preventDefault();

      const touch = e.touches[0];
      clone.style.left = `${touch.clientX - 75}px`;
      clone.style.top = `${touch.clientY - 100}px`;

      document.querySelectorAll('.card.drag-target').forEach(el => el.classList.remove('drag-target'));
      const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.card');
      if (target && target !== card) target.classList.add('drag-target');
    }, {passive:false});

    card.addEventListener('touchend', async (e) => {
      clearTimeout(startTimer);
      if (!active) return;

      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.card');

      if (target && target.dataset.id && target.dataset.id !== draggedId) {
        reorderByIds(draggedId, target.dataset.id);
        await saveOrder();
      }

      active = false;
      draggedId = null;
      clone?.remove();
      clone = null;
      card.classList.remove('dragging');
      document.querySelectorAll('.card.drag-target').forEach(el => el.classList.remove('drag-target'));
    }, {passive:true});

    card.addEventListener('touchcancel', () => {
      clearTimeout(startTimer);
      active = false;
      draggedId = null;
      clone?.remove();
      clone = null;
      card.classList.remove('dragging');
    });
  }

  async function setCover(photo) {
    setStatus('Actualizando la portada de la categoría…');

    // Limpia la portada únicamente dentro de la subcategoría que está visible.
    const clearResults = await Promise.all(
      photos
        .filter(p => p.id !== photo.id && p.is_cover)
        .map(p => sb.from('portfolio_photos').update({is_cover:false}).eq('id', p.id))
    );
    const failed = clearResults.find(r => r.error);
    if (failed) return setStatus(failed.error.message, true);

    const { error } = await sb
      .from('portfolio_photos')
      .update({is_cover:true, is_visible:true})
      .eq('id', photo.id);

    if (error) return setStatus(error.message, true);
    await loadPhotos();
  }

  async function toggleVisible(photo) {
    const { error } = await sb
      .from('portfolio_photos')
      .update({is_visible:!photo.is_visible})
      .eq('id', photo.id);

    if (error) return setStatus(error.message, true);
    await loadPhotos();
  }

  async function removePhoto(photo) {
    if (!confirm('Esta acción eliminará la fotografía de forma permanente. ¿Continuar?')) return;

    setStatus('Eliminando fotografía…');

    const { error: storageError } = await sb.storage
      .from('portfolio')
      .remove([photo.storage_path]);

    if (storageError) return setStatus(storageError.message, true);

    const { error } = await sb
      .from('portfolio_photos')
      .delete()
      .eq('id', photo.id);

    if (error) return setStatus(error.message, true);
    await loadPhotos();
  }

  async function imageToWebp(file) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Archivo no compatible: ' + file.name);
    }

    const bitmap = await createImageBitmap(file);
    const max = 2400;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', {alpha:false});
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('No se pudo optimizar ' + file.name)),
        'image/webp',
        .84
      );
    });
  }

  async function nextSortOrder(uiCategory) {
    const route = routeFor(uiCategory);
    const { data, error } = await sb
      .from('portfolio_photos')
      .select('category,storage_path,sort_order')
      .eq('category', route.db)
      .order('sort_order', {ascending:false});

    if (error) return 0;
    const matching = (data || []).filter(photo => belongsToRoute(photo, uiCategory));
    return (matching[0]?.sort_order ?? -1) + 1;
  }

  async function uploadFiles(files) {
    if (!files.length) return;

    const uiCategory = categoryEl.value;
    const route = routeFor(uiCategory);
    const category = route.db;
    let order = await nextSortOrder(uiCategory);

    for (let i=0; i<files.length; i++) {
      const file = files[i];
      progressBar.style.width = `${Math.round((i/files.length)*100)}%`;
      setStatus(`Optimizando y subiendo ${i+1} de ${files.length}: ${file.name}`);

      let body;
      try {
        body = await imageToWebp(file);
      } catch (e) {
        setStatus(e.message, true);
        continue;
      }

      const safeBase = file.name
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]+/g,'-')
        .toLowerCase();

      const folderPrefix = route.folder ? `${category}/${route.folder}` : category;
      const path = `${folderPrefix}/${Date.now()}-${i}-${safeBase}.webp`;

      const { error: uploadError } = await sb.storage
        .from('portfolio')
        .upload(path, body, {
          contentType:'image/webp',
          cacheControl:'31536000',
          upsert:false
        });

      if (uploadError) {
        setStatus(uploadError.message, true);
        continue;
      }

      const { data: publicData } = sb.storage
        .from('portfolio')
        .getPublicUrl(path);

      const { data:{ user } } = await sb.auth.getUser();

      const { error: dbError } = await sb
        .from('portfolio_photos')
        .insert({
          category,
          storage_path:path,
          public_url:publicData.publicUrl,
          original_name:file.name,
          alt_text:`${labels[uiCategory]} fotografiada por AB Photography`,
          sort_order:order++,
          is_visible:true,
          created_by:user?.id || null
        });

      if (dbError) {
        await sb.storage.from('portfolio').remove([path]);
        setStatus(dbError.message, true);
      }
    }

    progressBar.style.width = '100%';
    setTimeout(() => progressBar.style.width='0%', 700);
    filesEl.value = '';
    await loadPhotos();
  }

  function openFilePicker() {
    filesEl.click();
  }

  dropZone.addEventListener('click', openFilePicker);
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  });

  ['dragenter','dragover'].forEach(type => {
    dropZone.addEventListener(type, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave','drop'].forEach(type => {
    dropZone.addEventListener(type, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = [...e.dataTransfer.files].filter(file => file.type.startsWith('image/'));
    if (!files.length) {
      setStatus('No se encontraron imágenes compatibles.', true);
      return;
    }
    uploadFiles(files);
  });

  uploadBtn.onclick = () => {
    const files = [...filesEl.files];
    if (!files.length) return setStatus('Selecciona una o más fotografías.', true);
    uploadFiles(files);
  };

  filesEl.addEventListener('change', () => {
    if (filesEl.files.length) {
      setStatus(`${filesEl.files.length} fotografía(s) seleccionada(s).`);
    }
  });

  categoryEl.onchange = loadPhotos;

  document.getElementById('logoutBtn').onclick = async () => {
    await sb.auth.signOut();
    location.href='admin.html';
  };

  requireAdmin().then(ok => ok && loadPhotos());
})();
