(() => {
  const cfg = window.AB_SUPABASE;
  const sb = window.supabase.createClient(cfg.url, cfg.publishableKey);
  const checkingView = document.getElementById('checkingView');
  const managerView = document.getElementById('managerView');
  const categoryEl = document.getElementById('category');
  const filesEl = document.getElementById('files');
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const status = document.getElementById('status');
  const progressBar = document.getElementById('progressBar');
  let photos = [];

  const labels = {
    weddings:'Bodas', quinceaneras:'Quinceañeras', sessions:'Sesiones', events:'Eventos'
  };

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
    const { data, error } = await sb.from('profiles').select('role').eq('id', session.user.id).single();
    if (error || data?.role !== 'admin') {
      checkingView.innerHTML = '<div class="panel"><h2>Acceso no autorizado</h2><p class="note">Esta cuenta no tiene permisos de administrador.</p><a class="btn" href="admin.html">Volver</a></div>';
      return false;
    }
    checkingView.classList.add('hidden');
    managerView.classList.remove('hidden');
    return true;
  }

  async function loadPhotos() {
    setStatus('Cargando fotografías…');
    const category = categoryEl.value;
    const { data, error } = await sb
      .from('portfolio_photos')
      .select('*')
      .eq('category', category)
      .order('sort_order', { ascending:true })
      .order('created_at', { ascending:true });

    if (error) {
      setStatus('No se pudo cargar el portafolio: ' + error.message, true);
      return;
    }
    photos = data || [];
    render();
    setStatus(`${photos.length} fotografía(s) en ${labels[category]}.`);
  }

  function render() {
    grid.innerHTML = '';
    empty.classList.toggle('hidden', photos.length > 0);
    photos.forEach((photo, index) => {
      const card = document.createElement('article');
      card.className = 'card' + (!photo.is_visible ? ' hidden-card' : '') + (photo.is_cover ? ' is-cover' : '');
      card.innerHTML = `
        <div class="cover-badge">★ PORTADA</div>
        <div class="thumb"><img src="${photo.public_url}" alt=""></div>
        <div class="meta">
          <div class="name" title="${photo.original_name || ''}">${photo.original_name || 'Fotografía'}</div>
          <div class="controls">
            <button data-action="cover">★ Portada</button>
            <button data-action="toggle">${photo.is_visible ? 'Ocultar' : 'Mostrar'}</button>
            <button data-action="up">↑ Subir</button>
            <button data-action="down">↓ Bajar</button>
            <button data-action="delete" class="wide">Eliminar definitivamente</button>
          </div>
        </div>`;
      card.querySelector('[data-action="cover"]').onclick = () => setCover(photo);
      card.querySelector('[data-action="toggle"]').onclick = () => toggleVisible(photo);
      card.querySelector('[data-action="up"]').onclick = () => move(photo, -1);
      card.querySelector('[data-action="down"]').onclick = () => move(photo, 1);
      card.querySelector('[data-action="delete"]').onclick = () => removePhoto(photo);
      grid.appendChild(card);
    });
  }

  async function setCover(photo) {
    const category = categoryEl.value;
    setStatus('Actualizando portada…');
    const { error: clearError } = await sb.from('portfolio_photos').update({is_cover:false}).eq('category', category);
    if (clearError) return setStatus(clearError.message, true);
    const { error } = await sb.from('portfolio_photos').update({is_cover:true, is_visible:true}).eq('id', photo.id);
    if (error) return setStatus(error.message, true);
    await loadPhotos();
  }

  async function toggleVisible(photo) {
    const { error } = await sb.from('portfolio_photos').update({is_visible:!photo.is_visible}).eq('id', photo.id);
    if (error) return setStatus(error.message, true);
    await loadPhotos();
  }

  async function move(photo, direction) {
    const index = photos.findIndex(p => p.id === photo.id);
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const other = photos[target];
    const a = photo.sort_order ?? index;
    const b = other.sort_order ?? target;
    const { error:e1 } = await sb.from('portfolio_photos').update({sort_order:b}).eq('id', photo.id);
    const { error:e2 } = await sb.from('portfolio_photos').update({sort_order:a}).eq('id', other.id);
    if (e1 || e2) return setStatus((e1 || e2).message, true);
    await loadPhotos();
  }

  async function removePhoto(photo) {
    if (!confirm('Esta acción eliminará la fotografía de forma permanente. ¿Continuar?')) return;
    setStatus('Eliminando fotografía…');
    const { error: storageError } = await sb.storage.from('portfolio').remove([photo.storage_path]);
    if (storageError) return setStatus(storageError.message, true);
    const { error } = await sb.from('portfolio_photos').delete().eq('id', photo.id);
    if (error) return setStatus(error.message, true);
    await loadPhotos();
  }

  async function imageToWebp(file) {
    if (!file.type.startsWith('image/')) throw new Error('Archivo no compatible: ' + file.name);
    const bitmap = await createImageBitmap(file);
    const max = 2400;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', {alpha:false});
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    return await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo optimizar ' + file.name)), 'image/webp', .84);
    });
  }

  async function nextSortOrder(category) {
    const { data } = await sb.from('portfolio_photos').select('sort_order').eq('category', category).order('sort_order',{ascending:false}).limit(1);
    return (data?.[0]?.sort_order ?? -1) + 1;
  }

  async function uploadFiles(files) {
    const category = categoryEl.value;
    let order = await nextSortOrder(category);
    for (let i=0; i<files.length; i++) {
      const file = files[i];
      progressBar.style.width = `${Math.round((i/files.length)*100)}%`;
      setStatus(`Optimizando y subiendo ${i+1} de ${files.length}: ${file.name}`);
      let body;
      try { body = await imageToWebp(file); }
      catch (e) { setStatus(e.message, true); continue; }

      const safeBase = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g,'-').toLowerCase();
      const path = `${category}/${Date.now()}-${i}-${safeBase}.webp`;
      const { error: uploadError } = await sb.storage.from('portfolio').upload(path, body, {
        contentType:'image/webp', cacheControl:'31536000', upsert:false
      });
      if (uploadError) { setStatus(uploadError.message, true); continue; }

      const { data: publicData } = sb.storage.from('portfolio').getPublicUrl(path);
      const { data:{ user } } = await sb.auth.getUser();
      const { error: dbError } = await sb.from('portfolio_photos').insert({
        category, storage_path:path, public_url:publicData.publicUrl,
        original_name:file.name, alt_text:`${labels[category]} fotografiada por AB Photography`,
        sort_order:order++, is_visible:true, created_by:user?.id || null
      });
      if (dbError) {
        await sb.storage.from('portfolio').remove([path]);
        setStatus(dbError.message, true);
      }
    }
    progressBar.style.width = '100%';
    setTimeout(()=>progressBar.style.width='0%', 700);
    filesEl.value = '';
    await loadPhotos();
  }

  async function importCurrentWeddingPhotos() {
    if (categoryEl.value !== 'weddings') {
      setStatus('Selecciona la categoría Bodas para importar las fotos actuales.', true);
      return;
    }
    if (!confirm('Esto registrará en Supabase las 28 fotografías actuales de Bodas para poder administrarlas. ¿Continuar?')) return;

    const existing = new Set(photos.map(p => p.source_key).filter(Boolean));
    let order = await nextSortOrder('weddings');
    for (let i=1; i<=28; i++) {
      const sourceKey = `static-wedding-${String(i).padStart(3,'0')}`;
      if (existing.has(sourceKey)) continue;
      setStatus(`Importando fotografía actual ${i} de 28…`);
      progressBar.style.width = `${Math.round((i/28)*100)}%`;
      const localPath = `assets/weddings/wedding-${String(i).padStart(3,'0')}.webp`;
      try {
        const response = await fetch(localPath);
        if (!response.ok) throw new Error('No se encontró ' + localPath);
        const blob = await response.blob();
        const storagePath = `weddings/imported-${String(i).padStart(3,'0')}.webp`;
        const { error: upErr } = await sb.storage.from('portfolio').upload(storagePath, blob, {
          contentType:'image/webp', cacheControl:'31536000', upsert:true
        });
        if (upErr) throw upErr;
        const { data: pub } = sb.storage.from('portfolio').getPublicUrl(storagePath);
        const { data:{ user } } = await sb.auth.getUser();
        const { error: dbErr } = await sb.from('portfolio_photos').insert({
          category:'weddings', storage_path:storagePath, public_url:pub.publicUrl,
          original_name:`wedding-${String(i).padStart(3,'0')}.webp`,
          alt_text:`Fotografía de boda ${i} por AB Photography`,
          sort_order:order++, is_visible:true, is_cover:i===4, source_key:sourceKey,
          created_by:user?.id || null
        });
        if (dbErr) throw dbErr;
      } catch (e) {
        setStatus(`Error importando la foto ${i}: ${e.message}`, true);
      }
    }
    progressBar.style.width='100%';
    setTimeout(()=>progressBar.style.width='0%',700);
    await loadPhotos();
  }

  document.getElementById('uploadBtn').onclick = () => {
    const files = [...filesEl.files];
    if (!files.length) return setStatus('Selecciona una o más fotografías.', true);
    uploadFiles(files);
  };
  categoryEl.onchange = loadPhotos;
  document.getElementById('importCurrentBtn').onclick = importCurrentWeddingPhotos;
  document.getElementById('logoutBtn').onclick = async () => { await sb.auth.signOut(); location.href='admin.html'; };

  requireAdmin().then(ok => ok && loadPhotos());
})();
