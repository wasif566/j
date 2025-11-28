document.addEventListener("partialsLoaded", () => {
  const input = document.getElementById("searchInput");
  if (!input) return;

  let suggBox = document.getElementById("searchSuggestions");
  if (!suggBox) {
    suggBox = document.createElement("div");
    suggBox.id = "searchSuggestions";
    input.parentElement.appendChild(suggBox);
  }

  let ALL_PRODUCTS = [];

  async function loadAllProducts() {
    // use canonical filenames — make sure these exist
    const map = [
      { path: "stitched35.json", source: "stitched" },
      { path: "unstitched35.json", source: "unstitched" }
    ];

    const arr = [];
    for (const entry of map) {
      try {
        const r = await fetch(entry.path);
        if (!r.ok) { console.warn("Failed load", entry.path, r.status); continue; }
        const j = await r.json();
        if (Array.isArray(j.products)) {
          // tag each product with its source before merging
          j.products.forEach(p => {
            p._source = entry.source;
            arr.push(p);
          });
        }
      } catch (e) {
        console.error("LOAD ERR:", entry.path, e);
      }
    }
    ALL_PRODUCTS = arr;
  }

  loadAllProducts();

  function renderSuggestions(q) {
    q = String(q || "").trim().toLowerCase();
    if (!q) {
      suggBox.style.display = "none";
      return;
    }

    const match = ALL_PRODUCTS.filter(p => {
      const title = String(p.title || "").toLowerCase();
      const cat = String(p.category || "").toLowerCase();
      const id = String(p.id || "").toLowerCase();
      return title.includes(q) || cat.includes(q) || id.includes(q);
    }).slice(0, 10);

    if (!match.length) {
      suggBox.innerHTML = `<div class="sugg">No results</div>`;
      suggBox.style.display = "block";
      return;
    }

    suggBox.innerHTML = "";
    match.forEach(p => {
      const div = document.createElement("div");
      div.className = "sugg";
      div.innerHTML = `
        <img src="${p.img || ''}" alt="">
        <div class="meta-w">
          <div class="label">${highlight(p.title || '', q)}</div>
          <div class="meta">${p.category || ''} · ${p.id} · ${p._source}</div>
        </div>
      `;

      // include source param so product page knows which JSON to read
      div.addEventListener("click", () => {
        const url = `product.html?source=${encodeURIComponent(p._source)}&id=${encodeURIComponent(p.id)}`;
        window.location.href = url;
      });

      suggBox.appendChild(div);
    });

    suggBox.style.display = "block";
  }

  function highlight(txt, q) {
    if (!q) return txt;
    const reg = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return txt.replace(reg, "<mark>$1</mark>");
  }

  input.addEventListener("input", () => renderSuggestions(input.value));

  document.addEventListener("click", (e) => {
    if (!suggBox.contains(e.target) && e.target !== input) {
      suggBox.style.display = "none";
    }
  });
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

