// load-partials.js
(function () {
  const PARTIALS = [
    { id: 'siteHeader', url: 'header.html' },
    { id: 'siteFooter', url: 'footer.html' }
  ];

  function whenReady(fn){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  async function fetchText(url){
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
    return await res.text();
  }

  // inject partial html into placeholder, run <script> tags inside fetched HTML
  async function injectPartial(id, url){
    const container = document.getElementById(id);
    if (!container) return { id, ok: false, reason: 'missing placeholder' };

    try {
      const html = await fetchText(url);
      const tmp = document.createElement('div');
      tmp.innerHTML = html;

      // Move non-script nodes first
      Array.from(tmp.childNodes).forEach(node => {
        if (node.nodeName.toLowerCase() !== 'script') {
          container.appendChild(node.cloneNode(true));
        }
      });

      // Then handle scripts in order
      const scripts = Array.from(tmp.querySelectorAll('script'));
      for (const s of scripts) {
        const newS = document.createElement('script');
        // copy attributes
        for (const attr of s.attributes) newS.setAttribute(attr.name, attr.value);
        if (s.src) {
          // ensure executed in order
          newS.async = false;
        } else {
          newS.textContent = s.textContent;
        }
        container.appendChild(newS);
        // external scripts will load automatically; inline scripts execute on insertion
      }

      return { id, ok: true };
    } catch (err) {
      console.error('injectPartial error', id, url, err);
      return { id, ok: false, reason: String(err) };
    }
  }

  whenReady(async () => {
    const results = [];
    for (const p of PARTIALS) {
      // clear placeholder
      const el = document.getElementById(p.id);
      if (el) el.innerHTML = '';
      results.push(await injectPartial(p.id, p.url));
    }

    // dispatch event other scripts can listen to
    const ev = new CustomEvent('partialsLoaded', { detail: { results }});
    document.dispatchEvent(ev);

    const okAll = results.every(r => r.ok);
    if (!okAll) console.warn('Some partials failed to load:', results);
  });
})();


// header.js — cleaned: cart-count sync only, NO drawer/slider code
(function(){
  const CART_COUNT_ID = 'cartCount';
  const CART_BTN_ID = 'cartBtn';
  const CART_STORAGE_KEY = 'clothify_cart_v1'; // your cart array storage
  const FALLBACK_COUNT_KEY = 'cartCount'; // legacy count key

  // small helpers
  function safeNum(v){ const n = Number(v); return Number.isFinite(n) && n>=0 ? Math.floor(n) : 0; }
  function readFallbackCount(){ try { return safeNum(localStorage.getItem(FALLBACK_COUNT_KEY) || 0); } catch(e){ return 0 } }

  // compute count from cart array if present
  function countFromCartStorage(){
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return readFallbackCount();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return readFallbackCount();
      return arr.reduce((s,i)=> s + (safeNum(i.qty) || 0), 0);
    } catch(e){
      return readFallbackCount();
    }
  }

  // UI accessor
  const cartCountEl = () => document.getElementById(CART_COUNT_ID);

  function setCountUI(n, animate){
    const el = cartCountEl();
    if(!el) return;
    const prev = safeNum(el.textContent || 0);
    el.textContent = String(n);
    el.setAttribute('aria-label', `${n} items in cart`);
    if (animate && n > prev) {
      el.classList.remove('cart-pulse');
      void el.offsetWidth; // reflow
      el.classList.add('cart-pulse');
    }
  }

  // public API to set count
  function setCartCount(count, persist){
    const n = Math.max(0, Math.floor(Number(count) || 0));
    setCountUI(n, true);
    if (persist) {
      try { localStorage.setItem(FALLBACK_COUNT_KEY, String(n)); } catch(e){}
      document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count: n } }));
    }
  }

  // init UI (prefers cart array if present)
  function initCountUI(){
    const n = countFromCartStorage();
    setCountUI(n, false);
    try { localStorage.setItem(FALLBACK_COUNT_KEY, String(n)); } catch(e){}
  }


  // listen to storage & custom events to sync UI across tabs and pages
  window.addEventListener('storage', (ev) => {
    if (!ev.key || ev.key === FALLBACK_COUNT_KEY || ev.key === CART_STORAGE_KEY) {
      initCountUI();
    }
  });

  document.addEventListener('cartUpdated', (e) => {
    const n = safeNum(e?.detail?.count);
    if (Number.isFinite(n)) setCountUI(n, true);
    else initCountUI();
  });

  // expose API
  window.Clothify = window.Clothify || {};
  window.Clothify.setCartCount = setCartCount;
  window.Clothify.syncFromStorage = initCountUI;

  // init on DOM ready and also after your loader injects partials
  function init(){
    initCountUI();
    bindCartButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

  // If your loader dispatches 'partialsLoaded' when header HTML is injected, re-run
  document.addEventListener('partialsLoaded', function(){
    // allow header to be injected first, then bind
    init();
  });

})();


document.addEventListener("cartSliderLoaded", () => {
  const slider = document.getElementById("cartSlider");
  const closeBtn = document.getElementById("closeCartSlider");

  function openSlider() {
    slider.classList.add("show");
  }

  function closeSlider() {
    slider.classList.remove("show");
  }

  closeBtn.addEventListener("click", closeSlider);

  slider.querySelector(".cart-slider-overlay")
    ?.addEventListener("click", closeSlider);

  // HEADER ka cart button bhi open kare
  const cartBtn = document.getElementById("cartBtn");
  cartBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    openSlider();
  });

  // PRODUCT PAGE jab addToCart kare to open ho jaye
  document.addEventListener("openCart", () => {
    openSlider();
  });
});


