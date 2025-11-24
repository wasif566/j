document.addEventListener("partialsLoaded", () => {

  // CONFIG: update filenames/paths if needed
  const JSON_PATHS = ['stiched35.json', 'unstitched35.json'];
  const PRODUCT_PAGE = 'product.html';

  const input = document.getElementById("searchInput");
  if (!input) return;

  /* Create dropdown element once */
  let suggBox = document.getElementById("searchSuggestions");
  if (!suggBox) {
    suggBox = document.createElement("div");
    suggBox.id = "searchSuggestions";
    // ensure parent's positioning so absolute CSS works
    input.parentElement.style.position = input.parentElement.style.position || 'relative';
    input.parentElement.appendChild(suggBox);
  }

  let ALL_PRODUCTS = [];

  const safeLower = v => (v === null || v === undefined) ? '' : String(v).toLowerCase();

  /* Load from both JSON files (waits and merges arrays) */
  async function loadAllProducts() {
    const arr = [];
    for (const p of JSON_PATHS) {
      try {
        const r = await fetch(p);
        if (!r.ok) { console.warn('Failed to fetch', p, r.status); continue; }
        const j = await r.json();
        if (Array.isArray(j.products)) arr.push(...j.products);
        else if (Array.isArray(j)) arr.push(...j);
      } catch (e) {
        console.error("LOAD ERR:", p, e);
      }
    }
    ALL_PRODUCTS = arr;
    console.info('Search: loaded products count =', ALL_PRODUCTS.length);
  }

  /* highlight matched text */
  function highlight(txt, q) {
    if (!txt) return '';
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return String(txt).replace(new RegExp("(" + esc + ")", "ig"), "<mark>$1</mark>");
  }

  function escapeHtml(s){ return String(s || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

  /* Render suggestions (safe) */
  function renderSuggestions(q) {
    const query = String(q || '').trim().toLowerCase();
    if (!query) {
      suggBox.style.display = "none";
      return;
    }

    const matches = ALL_PRODUCTS.filter(p => {
      const title = safeLower(p.title);
      const cat = safeLower(p.category);
      const id = safeLower(String(p.id || ''));
      return title.includes(query) || cat.includes(query) || id.includes(query);
    }).slice(0, 10);

    if (!matches.length) {
      suggBox.innerHTML = `<div class="sugg" role="option" aria-selected="false" style="padding:10px">No results</div>`;
      suggBox.style.display = "block";
      return;
    }

    suggBox.innerHTML = "";

    matches.forEach(p => {
      const id = (p.id === undefined || p.id === null) ? '' : String(p.id);
      const title = p.title || '';
      const cat = p.category || '';
      const img = p.img || '';

      const div = document.createElement("div");
      div.className = "sugg";
      div.setAttribute('role','option');
      div.setAttribute('tabindex','0');
      div.dataset.pid = id;
      div.innerHTML = `
        ${img ? `<img src="${escapeHtml(img)}" alt="${escapeHtml(title)}">` : ''}
        <div class="meta-w">
          <div class="label">${highlight(title, query)}</div>
          <div class="meta">${escapeHtml(cat)} · ${escapeHtml(String(id))}</div>
        </div>
      `;

      // stopPropagation to avoid document click hiding race and navigate safely
      div.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (!id) {
          console.warn('Search: clicked product has no id', p);
          return;
        }
        const trimmed = String(id).trim();
        const dest = PRODUCT_PAGE + '?id=' + encodeURIComponent(trimmed);
        console.info('Search: navigating to', dest);
        window.location.href = dest;
      });

      // keyboard activation
      div.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); div.click(); }
      });

      suggBox.appendChild(div);
    });

    suggBox.style.display = "block";
  }

  /* debounce helper */
  function debounce(fn, wait = 120) {
    let t;
    return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
  }

  /* Input listener (enabled after products loaded) */
  (async function initSearch() {
    await loadAllProducts(); // WAIT for data

    const handler = debounce(() => renderSuggestions(input.value || ''), 90);
    input.addEventListener("input", handler);

    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const first = suggBox.querySelector('.sugg');
        if (first) { first.click(); return; }
        // fallback: open first matching product from ALL_PRODUCTS
        const q = String(input.value || '').trim().toLowerCase();
        if (q) {
          const fb = ALL_PRODUCTS.find(p => safeLower(p.title).includes(q) || safeLower(p.category).includes(q) || String(p.id || '').toLowerCase().includes(q));
          if (fb && fb.id) window.location.href = PRODUCT_PAGE + '?id=' + encodeURIComponent(String(fb.id).trim());
        }
      } else if (ev.key === 'ArrowDown') {
        const first = suggBox.querySelector('.sugg');
        if (first) first.focus();
      }
    });

    // Hide when clicking outside (use mousedown to avoid race with item click)
    document.addEventListener('mousedown', (e) => {
      if (!suggBox.contains(e.target) && e.target !== input) {
        suggBox.style.display = 'none';
      }
    });

    // show when focusing input if it has value
    input.addEventListener('focus', () => {
      if (input.value && input.value.trim()) renderSuggestions(input.value);
    });

  })().catch(err => console.error('Search init failed', err));

});

(function(){
  // ====== CONFIG: Replace with your number (international, no plus) ======
  const PHONE = '923148549885'; // <-- REPLACE with your WhatsApp number e.g. 92300XXXXXXX 
  const PREFILL = "Hello, I'm interested to place an order. Please assist."; // message
  // ======================================================================

  // build wa.me url safely
  function waUrl(phone, text){
    const t = encodeURIComponent(String(text || ''));
    return 'https://wa.me/' + encodeURIComponent(String(phone)) + '?text=' + t;
  }

  // attach behaviour when DOM ready (wait if partials loader injects header/footer)
  function attachWhatsapp() {
    const node = document.getElementById('whatsappContact');
    if(!node) return;
    const href = waUrl(PHONE, PREFILL);
    node.setAttribute('href', href);

    // open in new tab (we already set target=_blank in HTML)
    node.addEventListener('click', function(e){
      // no special prevention — link will open
      // Optional: track event or animate
    });

    // keyboard accessibility: enter/space should open link (anchor already supports)
    // add aria to label
    node.setAttribute('aria-label', 'Contact us on WhatsApp (opens in new tab)');
  }

  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    attachWhatsapp();
  } else {
    document.addEventListener('DOMContentLoaded', attachWhatsapp);
  }

  // if you use partial loader which emits 'partialsLoaded', attach again after partials loaded
  document.addEventListener('partialsLoaded', attachWhatsapp);
})();
