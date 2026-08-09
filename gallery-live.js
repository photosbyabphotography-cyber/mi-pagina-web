(() => {
  const cfg = window.AB_SUPABASE;
  if (!cfg || !window.supabase) return;

  const sb = window.supabase.createClient(cfg.url, cfg.publishableKey);
  const body = document.body;
  const uiCategory = body.dataset.portfolioCategory;
  const gallery = document.querySelector('.wedding-gallery');
  const heroImg = document.querySelector('.wedding-hero > img');
  const empty = document.getElementById('portfolioEmpty');
  if (!uiCategory || !gallery) return;

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

  const route = routes[uiCategory] || { db:uiCategory, folder:null };

  function matches(photo) {
    if (!route.folder) return true;
    return (photo.storage_path || '').startsWith(`${route.db}/${route.folder}/`);
  }

  async function load() {
    const { data, error } = await sb
      .from('portfolio_photos')
      .select('id,category,storage_path,public_url,alt_text,sort_order,is_cover,created_at')
      .eq('category', route.db)
      .eq('is_visible', true)
      .order('sort_order', {ascending:true})
      .order('created_at', {ascending:true});

    if (error) {
      console.warn('Portfolio Supabase fallback:', error.message);
      return;
    }

    const photos = (data || []).filter(matches);

    gallery.innerHTML = '';
    empty?.classList.toggle('hidden', photos.length > 0);

    const cover = photos.find(p => p.is_cover) || photos[0];
    if (cover && heroImg) heroImg.src = cover.public_url;

    photos.forEach((photo, index) => {
      const button = document.createElement('button');
      button.className = 'gallery-item reveal visible';
      button.dataset.full = photo.public_url;
      button.setAttribute('aria-label', `Abrir fotografía ${index+1}`);

      const img = document.createElement('img');
      img.src = photo.public_url;
      img.alt = photo.alt_text || 'Fotografía por AB Photography';
      img.loading = 'lazy';
      img.decoding = 'async';

      button.appendChild(img);
      gallery.appendChild(button);
    });

    window.dispatchEvent(new CustomEvent('ab-gallery-rebuilt'));
  }

  load();
})();
