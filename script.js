(() => {
  "use strict";

  const header = document.querySelector("#header");
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".nav");
  const year = document.querySelector("#year");

  if (year) year.textContent = new Date().getFullYear();

  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 40);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  menuButton?.addEventListener("click", () => {
    const isOpen = nav?.classList.toggle("open") ?? false;
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", () => {
      nav?.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
    });
  });

  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    revealElements.forEach((element) => observer.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("visible"));
  }

  const lightbox = document.querySelector(".lightbox");
  const lightboxImg = lightbox?.querySelector("img");
  const closeButton = lightbox?.querySelector(".lightbox-close");
  const prevButton = lightbox?.querySelector(".lightbox-prev");
  const nextButton = lightbox?.querySelector(".lightbox-next");
  const counter = lightbox?.querySelector(".lightbox-count");
  let galleryItems = [...document.querySelectorAll(".portfolio-lightbox-item, .gallery-item")];

  let currentIndex = 0;
  let savedScrollY = 0;
  let touchStartX = 0;
  let lastTrigger = null;

  const setViewerState = (open) => {
    if (!lightbox) return;
    lightbox.classList.toggle("open", open);
    lightbox.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("lightbox-open", open);
  };

  const renderImage = (index, immediate = false) => {
    if (!lightboxImg || !galleryItems.length) return;
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];
    const source = item.dataset.full || item.querySelector("img")?.currentSrc || item.querySelector("img")?.src;
    if (!source) return;

    const update = () => {
      lightboxImg.src = source;
      lightboxImg.alt = item.querySelector("img")?.alt || "Fotografía ampliada";
      if (counter) counter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
      lightboxImg.style.opacity = "1";
    };

    if (immediate) update();
    else {
      lightboxImg.style.opacity = "0";
      window.setTimeout(update, 130);
    }
  };

  const openLightbox = (index, trigger) => {
    savedScrollY = window.scrollY;
    lastTrigger = trigger;
    renderImage(index, true);
    setViewerState(true);
    closeButton?.focus({ preventScroll: true });
  };

  const closeLightbox = () => {
    if (!lightbox?.classList.contains("open")) return;
    setViewerState(false);
    if (lightboxImg) {
      lightboxImg.removeAttribute("src");
      lightboxImg.style.opacity = "1";
    }
    window.scrollTo(0, savedScrollY);
    lastTrigger?.focus({ preventScroll: true });
  };

  setViewerState(false);
  lightboxImg?.removeAttribute("src");

  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => openLightbox(index, item));
  });
  window.addEventListener("ab-gallery-rebuilt", () => {
    galleryItems = [...document.querySelectorAll(".portfolio-lightbox-item, .gallery-item")];
    galleryItems.forEach((item, index) => item.addEventListener("click", () => openLightbox(index)));
  });

  closeButton?.addEventListener("click", closeLightbox);
  prevButton?.addEventListener("click", (event) => { event.stopPropagation(); renderImage(currentIndex - 1); });
  nextButton?.addEventListener("click", (event) => { event.stopPropagation(); renderImage(currentIndex + 1); });
  lightbox?.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  lightbox?.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  lightbox?.addEventListener("touchend", (event) => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 45) renderImage(currentIndex + (delta < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (!lightbox?.classList.contains("open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") renderImage(currentIndex - 1);
    if (event.key === "ArrowRight") renderImage(currentIndex + 1);
  });
})();

/* --- Bilingual experience --- */
(() => {
  const translations = {
    es: {
      navPortfolio:"Portafolio", navServices:"Servicios", navExperience:"Experiencia", navBook:"Reservar",
      heroKicker:"AB Photography · Texas",
      heroTitle:"Más que un recuerdo. Una parte de su historia.",
      heroSub:"Bodas · Quinceañeras · Parejas · Eventos",
      heroCta:"Consultar disponibilidad", heroInstagram:"Ver Instagram", heroFacebook:"Ver Facebook",
      portfolioKicker:"Portafolio", portfolioTitle:"Historias organizadas por celebración.", weddingCategoryKicker:"Portafolio", weddingCategoryTitle:"Bodas", weddingCategoryLink:"Ver galería completa", quinceCategoryKicker:"Portafolio", quinceCategoryTitle:"Quinceañeras", sessionsCategoryKicker:"Portafolio", sessionsCategoryTitle:"Sesiones", eventsCategoryKicker:"Portafolio", eventsCategoryTitle:"Eventos",
      servicesKicker:"Servicios", servicesTitle:"Historias diferentes merecen una forma diferente de ser contadas.",
      svcWeddingTitle:"Bodas", svcWeddingText:"Una cobertura atenta a los grandes momentos y a los detalles que hacen único su día.",
      svcQuinceTitle:"Quinceañeras", svcQuinceText:"Retratos y cobertura de celebración con una mirada elegante, natural y llena de emoción.",
      svcCouplesTitle:"Engagement", svcCouplesText:"Sesiones pensadas para reflejar su conexión con naturalidad y sin poses forzadas.",
      svcEventsTitle:"Eventos", svcEventsText:"Celebraciones familiares, aniversarios, graduaciones y momentos que merecen conservarse.",
      experienceKicker:"Cómo trabajamos", experienceTitle:"Un proceso sencillo.",
      galleryKicker:"Galería", galleryTitle:"Algunas historias no necesitan palabras.",
      contactKicker:"Disponibilidad", contactTitle:"Hablemos de su celebración.",
      submitButton:"Enviar mensaje", backTop:"Volver arriba"
    },
    en: {
      navPortfolio:"Portfolio", navServices:"Services", navExperience:"Experience", navBook:"Inquire",
      heroKicker:"AB Photography · South Texas",
      heroTitle:"More than a memory. A part of your story.",
      heroSub:"Weddings · Quinceañeras · Couples · Events",
      heroCta:"Check availability", heroInstagram:"View Instagram", heroFacebook:"View Facebook",
      portfolioKicker:"Portfolio", portfolioTitle:"Stories organized by celebration.", weddingCategoryKicker:"Portfolio", weddingCategoryTitle:"Weddings", weddingCategoryLink:"View full gallery", quinceCategoryKicker:"Portfolio", quinceCategoryTitle:"Quinceañeras", sessionsCategoryKicker:"Portfolio", sessionsCategoryTitle:"Sessions", eventsCategoryKicker:"Portfolio", eventsCategoryTitle:"Events",
      servicesKicker:"Services", servicesTitle:"Every story deserves its own way of being told.",
      svcWeddingTitle:"Weddings", svcWeddingText:"Thoughtful coverage of the meaningful moments and details that make the day your own.",
      svcQuinceTitle:"Quinceañeras", svcQuinceText:"Portraits and celebration coverage with an elegant, natural and heartfelt approach.",
      svcCouplesTitle:"Couples", svcCouplesText:"Sessions created to reflect your connection naturally, without forced poses.",
      svcEventsTitle:"Events", svcEventsText:"Family celebrations, anniversaries, graduations and moments worth preserving.",
      experienceKicker:"How it works", experienceTitle:"A simple process.",
      galleryKicker:"Gallery", galleryTitle:"Some stories need no words.",
      contactKicker:"Availability", contactTitle:"Let us talk about your celebration.",
      submitButton:"Send inquiry", backTop:"Back to top"
    }
  };

  function setLang(lang, persist=true){
    if(!translations[lang]) return;
    document.documentElement.lang = lang;
    Object.entries(translations[lang]).forEach(([id,text])=>{
      const el = document.getElementById(id);
      if(el) el.textContent = text;
    });
    document.querySelectorAll("[data-set-lang]").forEach(btn=>{
      btn.classList.toggle("is-active", btn.dataset.setLang === lang);
    });
    if(persist) localStorage.setItem("ab-language", lang);
  }

  const gate = document.getElementById("languageGate");
  const stored = localStorage.getItem("ab-language");
  if(stored){
    setLang(stored,false);
    gate?.classList.add("is-hidden");
  }

  document.querySelectorAll("[data-lang-choice]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      setLang(btn.dataset.langChoice,true);
      gate?.classList.add("is-hidden");
    });
  });
  document.querySelectorAll("[data-set-lang]").forEach(btn=>{
    btn.addEventListener("click",()=>setLang(btn.dataset.setLang,true));
  });
  document.querySelector(".language-gate-close")?.addEventListener("click",()=>{
    setLang(stored || "es", false);
    gate?.classList.add("is-hidden");
  });
})();


/* --- Complete bilingual copy + WhatsApp inquiry --- */
(() => {
  const copy = {
    es: {
      title: "AB Photography | Fotografía en Laredo, San Antonio y Corpus Christi",
      description: "AB Photography captura bodas, quinceañeras, parejas y eventos en Laredo, San Antonio y Corpus Christi con un estilo elegante, romántico y atemporal.",
      intro: "Fotografía elegante y natural para celebrar lo que importa.",
      experienceBody: "Desde el primer mensaje hasta la entrega final, todo está pensado para que disfruten su celebración con tranquilidad.",
      steps: [
        ["Conversemos","Conocemos su fecha, el lugar y lo que desean conservar de ese día."],
        ["Preparamos","Organizamos los tiempos y detalles importantes para que todo fluya con naturalidad."],
        ["Entregamos","Reciben sus fotografías en una galería privada, limpia y fácil de compartir."]
      ],
      quote: "“Las mejores fotografías no solo muestran lo que ocurrió. También conservan lo que se sintió.”",
      contactBody: "Será un gusto conocer los detalles de su celebración y ayudarles a conservar esos recuerdos.",
      labelName:"Nombre", labelEmail:"Email", labelPhone:"Teléfono", labelDate:"Fecha",
      labelCity:"Ciudad / Venue", labelService:"Tipo de servicio", labelMessage:"Cuéntanos sobre tu evento",
      phName:"Tu nombre", phEmail:"tu@email.com", phPhone:"956 000 0000",
      phCity:"Laredo, San Antonio, Corpus Christi...", phMessage:"Cuéntanos fecha, lugar, tipo de evento y detalles importantes.",
      servicePlaceholder:"Selecciona una opción",
      submit:"Enviar consulta por WhatsApp",
      note:"WhatsApp se abrirá con su información lista para enviar.",
      footer:"Porque algunos momentos merecen volver a sentirse.",
      whatsapp:"WhatsApp"
    },
    en: {
      title: "AB Photography | Wedding & Quinceañera Photographer in South Texas",
      description: "AB Photography documents weddings, quinceañeras, couples and events across Laredo, San Antonio and Corpus Christi with an elegant, romantic and timeless approach.",
      intro: "Elegant, natural photography for the moments that matter.",
      experienceBody: "From the first message to the final delivery, everything is designed so you can enjoy your celebration with peace of mind.",
      steps: [
        ["Let us talk","We learn your date, location and what you most want to preserve from the day."],
        ["We prepare","We organize the timeline and important details so everything can flow naturally."],
        ["We deliver","You receive your photographs in a private, clean and easy-to-share gallery."]
      ],
      quote: "“The best photographs don't just show what happened. They preserve how it felt.”",
      contactBody: "We'd love to hear about your celebration and help preserve those memories.",
      labelName:"Name", labelEmail:"Email", labelPhone:"Phone", labelDate:"Date",
      labelCity:"City / Venue", labelService:"Service type", labelMessage:"Tell us about your event",
      phName:"Your name", phEmail:"you@email.com", phPhone:"956 000 0000",
      phCity:"Laredo, San Antonio, Corpus Christi...", phMessage:"Share your date, venue, event type and any important details.",
      servicePlaceholder:"Select an option",
      submit:"Send inquiry on WhatsApp",
      note:"WhatsApp will open with your information ready to send.",
      footer:"Because some moments deserve to be felt again.",
      whatsapp:"WhatsApp"
    }
  };

  function setText(sel, text){
    const el = document.querySelector(sel);
    if(el) el.textContent = text;
  }
  function setPlaceholder(sel, text){
    const el = document.querySelector(sel);
    if(el) el.placeholder = text;
  }

  function applyFullLanguage(lang){
    const c = copy[lang] || copy.es;
    document.title = c.title;
    const md = document.querySelector('meta[name="description"]');
    if(md) md.setAttribute("content", c.description);

    const intro = document.querySelector(".intro p");
    if(intro) intro.textContent = c.intro;

    const exp = document.querySelector(".experience-copy > p:last-child");
    if(exp) exp.textContent = c.experienceBody;

    const stepEls = document.querySelectorAll(".steps .step");
    c.steps.forEach((s,i)=>{
      if(stepEls[i]){
        const h = stepEls[i].querySelector("h3");
        const p = stepEls[i].querySelector("p");
        if(h) h.textContent = s[0];
        if(p) p.textContent = s[1];
      }
    });

    setText(".quote p", c.quote);
    const contactP = document.querySelector(".contact-copy > p:not(.kicker)");
    if(contactP) contactP.textContent = c.contactBody;

    ["Name","Email","Phone","Date","City","Service","Message"].forEach(k=>{
      setText("#label"+k, c["label"+k]);
    });
    setPlaceholder("#waName", c.phName);
    setPlaceholder("#waEmail", c.phEmail);
    setPlaceholder("#waPhone", c.phPhone);
    setPlaceholder("#waCity", c.phCity);
    setPlaceholder("#waMessage", c.phMessage);
    setText("#servicePlaceholder", c.servicePlaceholder);
    setText("#submitButton", c.submit);
    setText("#formNote", c.note);

    const footerP = document.querySelector(".footer p");
    if(footerP){
      footerP.innerHTML = `© <span id="year">${new Date().getFullYear()}</span> AB Photography. ${c.footer}`;
    }
  }

  const originalSetLang = window.setLang;
  const applyStored = () => {
    const lang = localStorage.getItem("ab-language") || document.documentElement.lang || "es";
    setTimeout(()=>applyFullLanguage(lang),0);
  };

  document.querySelectorAll("[data-lang-choice], [data-set-lang]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const lang = btn.dataset.langChoice || btn.dataset.setLang;
      setTimeout(()=>applyFullLanguage(lang),0);
    });
  });
  applyStored();

  const form = document.getElementById("whatsappInquiryForm");
  if(form){
    form.addEventListener("submit",(e)=>{
      e.preventDefault();
      const lang = localStorage.getItem("ab-language") || document.documentElement.lang || "es";
      const v = id => (document.getElementById(id)?.value || "").trim();
      const name = v("waName"), email = v("waEmail"), phone = v("waPhone"),
            date = v("waDate"), city = v("waCity"), service = v("waService"), message = v("waMessage");

      let lines;
      if(lang === "en"){
        lines = [
          "Hi AB Photography! I’d like to check availability.",
          "",
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone || "Not provided"}`,
          `Event: ${service}`,
          `Date: ${date || "Not provided"}`,
          `City / Venue: ${city || "Not provided"}`,
          "",
          `Details: ${message}`
        ];
      } else {
        lines = [
          "¡Hola AB Photography! Quisiera consultar disponibilidad.",
          "",
          `Nombre: ${name}`,
          `Email: ${email}`,
          `Teléfono: ${phone || "No proporcionado"}`,
          `Evento: ${service}`,
          `Fecha: ${date || "No proporcionada"}`,
          `Ciudad / Venue: ${city || "No proporcionado"}`,
          "",
          `Detalles: ${message}`
        ];
      }
      const url = "https://wa.me/19563079162?text=" + encodeURIComponent(lines.join("\n"));
      window.open(url, "_blank", "noopener");
    });
  }
})();
