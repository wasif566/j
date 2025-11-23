document.addEventListener("partialsLoaded", () => {

  const input = document.getElementById("searchInput");
  if (!input) return;

  /* Create dropdown element once */
  let suggBox = document.getElementById("searchSuggestions");
  if (!suggBox) {
    suggBox = document.createElement("div");
    suggBox.id = "searchSuggestions";
    input.parentElement.appendChild(suggBox);
  }

  let ALL_PRODUCTS = [];

  /* Load from both JSON files */
  async function loadAllProducts() {
    const paths = ["stiched35.json", "unstitched35.json"];
    let arr = [];

    for (const p of paths) {
      try {
        const r = await fetch(p);
        const j = await r.json();
        if (Array.isArray(j.products)) arr.push(...j.products);
      } catch (e) {
        console.error("LOAD ERR:", e);
      }
    }

    ALL_PRODUCTS = arr;
  }

  loadAllProducts();


  /* Render suggestions */
  function renderSuggestions(q) {
    q = q.trim().toLowerCase();
    if (!q) {
      suggBox.style.display = "none";
      return;
    }

    const match = ALL_PRODUCTS.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      String(p.id).toLowerCase().includes(q)
    ).slice(0, 10);

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
        <img src="${p.img}" alt="">
        <div class="meta-w">
          <div class="label">${highlight(p.title, q)}</div>
          <div class="meta">${p.category} · ${p.id}</div>
        </div>
      `;

      div.addEventListener("click", () => {
        window.location.href = "/product.html?id=" + p.id;
      });

      suggBox.appendChild(div);
    });

    suggBox.style.display = "block";
  }

  /* highlight matched text */
  function highlight(txt, q) {
    const reg = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return txt.replace(reg, "<mark>$1</mark>");
  }

  /* Input listener */
  input.addEventListener("input", () => {
    renderSuggestions(input.value);
  });

  /* Click outside closes */
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