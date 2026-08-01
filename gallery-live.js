(() => {
  const cfg = window.AB_SUPABASE;
  if (!cfg || !window.supabase) return;
  const sb = window.supabase.createClient(cfg.url, cfg.publishableKey);
  const body = document.body;
  const category = body.dataset.portfolioCategory;
  const gallery = document.querySelector('.wedding-gallery');
  const heroImg = document.querySelector('.wedding-hero > img');
  const empty = document.getElementById('portfolioEmpty');
  if (!category || !gallery) return;

  async function load() {
    const { data, error } = await sb
      .from('portfolio_photos')
      .select('id,public_url,alt_text,sort_order,is_cover')
      .eq('category', category)
      .eq('is_visible', true)
      .order('sort_order', {ascending:true})
      .order('created_at', {ascending:true});

    // If the Supabase setup has not been run yet, keep the static wedding gallery.
    if (error) {
      console.warn('Portfolio Supabase fallback:', error.message);
      return;
    }

    gallery.innerHTML = '';
    const photos = data || [];
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
