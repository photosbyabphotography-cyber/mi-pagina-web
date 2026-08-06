(() => {
  const cfg = window.AB_SUPABASE;
  if (!cfg || !window.supabase) return;

  const sb = window.supabase.createClient(cfg.url, cfg.publishableKey);
  const cards = [...document.querySelectorAll('[data-cover-category]')];
  if (!cards.length) return;

  async function updateCategoryCovers() {
    const { data, error } = await sb
      .from('portfolio_photos')
      .select('category,public_url,alt_text,is_cover,sort_order,created_at')
      .eq('is_visible', true)
      .in('category', cards.map(card => card.dataset.coverCategory))
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('AB Photography: no se pudieron cargar las portadas dinámicas.', error.message);
      return;
    }

    const grouped = new Map();
    for (const photo of data || []) {
      if (!grouped.has(photo.category)) grouped.set(photo.category, []);
      grouped.get(photo.category).push(photo);
    }

    for (const card of cards) {
      const category = card.dataset.coverCategory;
      const photos = grouped.get(category) || [];
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
