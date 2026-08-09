(() => {
  const cfg = window.AB_SUPABASE;
  if (!cfg || !window.supabase) return;

  const sb = window.supabase.createClient(cfg.url, cfg.publishableKey);
  const cards = [...document.querySelectorAll('[data-cover-category]')];
  if (!cards.length) return;

  const routes = {
    'sessions-couples':     { db:'sessions', folder:'couples' },
    'sessions-graduation':  { db:'sessions', folder:'graduation' },
    'sessions-maternity':   { db:'sessions', folder:'maternity' },
    'sessions-family':      { db:'sessions', folder:'family' },
    'events-baptisms':      { db:'events', folder:'baptisms' },
    'events-birthdays':     { db:'events', folder:'birthdays' },
    'events-baby-shower':   { db:'events', folder:'baby-shower' },
    'events-bridal-shower': { db:'events', folder:'bridal-shower' }
  };

  const routeFor = ui => routes[ui] || { db:ui, folder:null };

  function matches(photo, uiCategory) {
    const route = routeFor(uiCategory);
    if (photo.category !== route.db) return false;
    if (!route.folder) return true;
    return (photo.storage_path || '').startsWith(`${route.db}/${route.folder}/`);
  }

  async function updateCategoryCovers() {
    const dbCategories = [...new Set(cards.map(card => routeFor(card.dataset.coverCategory).db))];

    const { data, error } = await sb
      .from('portfolio_photos')
      .select('category,storage_path,public_url,alt_text,is_cover,sort_order,created_at')
      .eq('is_visible', true)
      .in('category', dbCategories)
      .order('sort_order', { ascending:true })
      .order('created_at', { ascending:true });

    if (error) {
      console.warn('AB Photography: no se pudieron cargar las portadas dinámicas.', error.message);
      return;
    }

    for (const card of cards) {
      const uiCategory = card.dataset.coverCategory;
      const photos = (data || []).filter(photo => matches(photo, uiCategory));
      const cover = photos.find(photo => photo.is_cover) || photos[0];
      const img = card.querySelector('img');

      if (!cover || !img) continue;
      img.src = cover.public_url;
      img.alt = cover.alt_text || img.alt;
      img.removeAttribute('srcset');
    }
  }

  updateCategoryCovers();
})();
