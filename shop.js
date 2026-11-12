/* =====================================================================
   Květy Lu – sdílený skript
   karty produktů · detail produktu · poptávka (košík) · filtry · menu
   Data produktů jsou v products.js (PRODUKTY, PLACEHOLDERY).
   ===================================================================== */

const KL = {
  HOME: "index.html",
  EMAIL: 'kvetylu@centrum.cz',
  // Adresa serverové funkce, která odešle poptávku e-mailem (Vercel funkce).
  // Dokud je null, poptávka se otevře jako předvyplněný e-mail.
  ENDPOINT: null,
  // Zimní sněžení na pozadí: true = zapnuto, false = vypnuto (na jaro).
  SNEH: true,
  PHOTO_DIR: 'assets/produkty/',
  CART_KEY: 'kvetylu_poptavka_v2',
  CATS: [
  {
    "name": "Vesničky",
    "slug": "vesnicky",
    "g": "g1",
    "short": "Vesničky z ručně malovaných domečků, i velké až 50 cm, často se světýlky.",
    "intro": "Vesničky skládám z ručně malovaných domečků, z nichž je každý trochu jiný. Najdete tu menší kousky na poličku i velké vesničky o délce až 50 cm. Postavíte je na parapet, komodu nebo na stůl."
  },
  {
    "name": "Domečky",
    "slug": "domecky",
    "g": "g2",
    "short": "Samostatné domečky, chaloupky a domečky pod sklem.",
    "intro": "Samostatné domečky – chaloupky, domky v plecháčku i domečky pod skleněným poklopem. Každý je trochu jiný."
  },
  {
    "name": "Věnce",
    "slug": "vence",
    "g": "g3",
    "short": "Věnce s domečky a květinami na dveře i na stůl.",
    "intro": "Věnce, které potěší na dveřích i na stole. Ke každému ráda přidám domeček nebo květiny podle vašeho přání."
  },
  {
    "name": "Do zahrady",
    "slug": "do-zahrady",
    "g": "g4",
    "short": "Truhlíky a zápichy, které oživí zahradu, terasu i balkon.",
    "intro": "Truhlíky s domečky a zápichy do květináčů a záhonů. Oživí zahradu, terasu i balkon."
  },
  {
    "name": "Svícny a dekorace",
    "slug": "svicny-a-dekorace",
    "g": "g5",
    "short": "Svícny, ozdoby a dekorace na každé roční období.",
    "intro": "Svícny, ozdoby a dekorace, které přinesou do domova atmosféru právě probíhajícího období."
  },
  {
    "name": "Drobnosti pro radost",
    "slug": "drobnosti-pro-radost",
    "g": "g6",
    "short": "Dřevěná srdce, levandulové pytlíčky a malé dárky.",
    "intro": "Drobné dárky, které udělají radost: srdce ze dřeva, levandulové pytlíčky a další maličkosti."
  },
  {
    "name": "Vánoční nabídka",
    "slug": "vanoce",
    "g": "g7",
    "tag": "Vánoce",
    "short": "Vše, co přinese vánoční atmosféru.",
    "intro": "Vánoční vesničky, věnce, svícny i drobnosti. Všechno, co k letošním Vánocům mám."
  }
]
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const TAG_ORDER = ['Vánoce', 'Zima', 'Podzim', 'Jaro', 'Velikonoce', 'Celoroční', 'Provence', 'Limitovaná edice', 'Na přání', 'Vhodné jako dárek', 'S květinami', 'Do zahrady'];
const sortTags = arr => arr.slice().sort((a, b) => { const ia = TAG_ORDER.indexOf(a), ib = TAG_ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, 'cs'); });
const allTags = () => { const r = []; PRODUKTY.forEach(p => (p.tags || []).forEach(x => { if (r.indexOf(x) < 0) r.push(x); })); return sortTags(r); };
const catByName = n => KL.CATS.find(c => c.name === n);
const prodById  = id => (typeof PRODUKTY !== 'undefined' ? PRODUKTY : []).find(p => String(p.id) === String(id));
const photoUrl  = (p, i) => KL.PHOTO_DIR + p.id + '-' + i + '.jpg';
const priceText = p => (p.price ? (p.from ? 'od ' : '') + Number(p.price).toLocaleString('cs-CZ') + ' Kč' : null);
const plural    = (n, a, b, c) => n === 1 ? a : (n >= 2 && n <= 4 ? b : c);

const ICON_PLUS  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg>';

/* ---------------------------------------------------------------- Košík */
let cart = [];
try { cart = JSON.parse(localStorage.getItem(KL.CART_KEY)) || []; } catch (e) { cart = []; }
cart = cart.filter(i => prodById(i.id));            // zahodí položky, které už neexistují

const saveCart = () => { try { localStorage.setItem(KL.CART_KEY, JSON.stringify(cart)); } catch (e) {} };
const inCart   = id => cart.some(i => String(i.id) === String(id));
const cartKey  = i => i.id + '|' + (i.variant || '');
const totalQty = () => cart.reduce((s, i) => s + i.qty, 0);

function addToCart(id, variant, qty) {
  const item = cart.find(i => String(i.id) === String(id) && (i.variant || '') === (variant || ''));
  if (item) item.qty = Math.min(99, item.qty + qty);
  else cart.push({ id: id, variant: variant || '', qty: qty });
  saveCart(); renderCart(); refreshCardButtons();
}

const cartPanel   = $('#cartPanel');
const cartOverlay = $('#cartOverlay');
let lastFocusCart = null;

function openCart() {
  lastFocusCart = document.activeElement;
  cartPanel.classList.add('open'); cartOverlay.classList.add('open');
  cartPanel.setAttribute('aria-hidden', 'false');
  const c = $('#cartClose'); if (c) c.focus();
}
function closeCart() {
  cartPanel.classList.remove('open'); cartOverlay.classList.remove('open');
  cartPanel.setAttribute('aria-hidden', 'true');
  if (lastFocusCart && lastFocusCart.focus) lastFocusCart.focus();
}

function thumbHTML(p) {
  const c = catByName(p.cat);
  const g = c ? c.g : 'g1';
  return '<div class="ci-thumb ' + g + '">' +
    (p.photos > 0 ? '<img src="' + photoUrl(p, 1) + '" alt="" onerror="this.remove()">' : '') + '</div>';
}

function renderCart() {
  const count = $('#cartCount');
  const q = totalQty();
  count.textContent = q;
  count.dataset.empty = q === 0;

  const itemsEl = $('#cartItems'), emptyEl = $('#cartEmptyMsg'), form = $('#inquiryForm');
  const sendBtn = $('#sendInquiry'), note = $('#cartFootNote');
  const mini = $('#miniCartList'), intro = $('#formIntro');

  if (cart.length === 0) {
    emptyEl.style.display = 'block'; itemsEl.innerHTML = '';
    form.classList.remove('open'); sendBtn.disabled = true;
    note.textContent = 'Vyberte, co se vám líbí, a pak odešlete poptávku. Nic se tím neplatí ani nezavazuje.';
    if (mini) mini.innerHTML = '';
    if (intro) intro.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';
  form.classList.add('open'); sendBtn.disabled = false;
  note.textContent = 'Vyplňte prosím jméno a e-mail, ať se vám mohu ozvat zpět. Cenu a termín potvrdím před objednávkou.';
  if (intro) intro.style.display = 'none';

  itemsEl.innerHTML = cart.map(item => {
    const p = prodById(item.id);
    return '<div class="cart-item">' + thumbHTML(p) +
      '<div class="ci-info"><div class="name">' + esc(p.name) + '</div>' +
      (item.variant ? '<div class="tag">Varianta: ' + esc(item.variant) + '</div>' : '') +
      '<div class="ci-qty" role="group" aria-label="Počet kusů">' +
        '<button type="button" data-act="dec" data-key="' + esc(cartKey(item)) + '" aria-label="Ubrat kus">−</button>' +
        '<span>' + item.qty + ' ks</span>' +
        '<button type="button" data-act="inc" data-key="' + esc(cartKey(item)) + '" aria-label="Přidat kus">+</button>' +
      '</div></div>' +
      '<button type="button" class="ci-remove" data-act="rm" data-key="' + esc(cartKey(item)) + '">Odebrat</button></div>';
  }).join('');

  if (mini) mini.innerHTML = '<div class="mini-list">' +
    cart.map(i => esc(prodById(i.id).name) + (i.qty > 1 ? ' (' + i.qty + '×)' : '')).join(', ') + '</div>';
}

$('#cartItems').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const idx = cart.findIndex(i => cartKey(i) === b.dataset.key); if (idx < 0) return;
  if (b.dataset.act === 'inc') cart[idx].qty = Math.min(99, cart[idx].qty + 1);
  if (b.dataset.act === 'dec') cart[idx].qty = Math.max(1, cart[idx].qty - 1);
  if (b.dataset.act === 'rm')  cart.splice(idx, 1);
  saveCart(); renderCart(); refreshCardButtons();
});

$('#cartBtn').addEventListener('click', openCart);
$('#cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);
const openFromForm = $('#openCartFromForm'); if (openFromForm) openFromForm.addEventListener('click', openCart);

/* ---------------------------------------------------------- Odeslání poptávky */
function buildMessage(jmeno, email, zprava) {
  const lines = cart.map(i => {
    const p = prodById(i.id);
    return '- ' + p.name + (i.variant ? ' (varianta: ' + i.variant + ')' : '') + ' – ' + i.qty + ' ks';
  });
  return 'Dobrý den,\n\nmám zájem o tyto produkty:\n' + lines.join('\n') +
    (zprava ? '\n\nPoznámka:\n' + zprava : '') +
    '\n\nJméno: ' + jmeno + '\nE-mail: ' + email + '\n\nDěkuji a těším se na odpověď.';
}

function showResult(html) {
  $('#inquiryForm').classList.remove('open');
  $('#cartItems').innerHTML = ''; $('#cartEmptyMsg').style.display = 'none';
  const r = $('#cartResult'); r.innerHTML = html; r.style.display = 'block';
  $('#sendInquiry').style.display = 'none';
  $('#cartFootNote').style.display = 'none';
}
function resetResult() {
  const r = $('#cartResult'); r.style.display = 'none'; r.innerHTML = '';
  $('#sendInquiry').style.display = ''; $('#cartFootNote').style.display = '';
}

$('#sendInquiry').addEventListener('click', () => {
  const form = $('#inquiryForm');
  if (!form.reportValidity()) return;                      // zobrazí „vyplňte toto pole“ u prázdných polí
  const jmeno = $('#cJmeno').value.trim(), email = $('#cEmail').value.trim(), zprava = $('#cZprava').value.trim();
  const text = buildMessage(jmeno, email, zprava);

  const done = () => { cart = []; saveCart(); form.reset(); renderCart(); refreshCardButtons(); };

  if (KL.ENDPOINT) {
    const btn = $('#sendInquiry'); btn.disabled = true; btn.firstChild.textContent = 'Odesílám… ';
    fetch(KL.ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jmeno: jmeno, email: email, zprava: zprava, text: text }) })
      .then(r => { if (!r.ok) throw new Error('chyba'); })
      .then(() => { done(); showResult('<h3>Děkuji za poptávku, ' + esc(jmeno) + '!</h3><p>Ozvu se vám co nejdřív na ' + esc(email) + '.</p><button type="button" class="btn btn-primary" id="resultClose">Zavřít</button>'); })
      .catch(() => { btn.disabled = false; btn.firstChild.textContent = 'Odeslat poptávku '; alert('Poptávku se nepodařilo odeslat. Zkuste to prosím znovu, nebo napište na ' + KL.EMAIL + '.'); });
  } else {
    const href = 'mailto:' + KL.EMAIL + '?subject=' + encodeURIComponent('Poptávka z webu Květy Lu') + '&body=' + encodeURIComponent(text);
    done();
    showResult('<h3>Poptávka je připravená</h3><p>Otevřel se vám e-mail s hotovou zprávou – stačí ho odeslat. ' +
      'Kdyby se neotevřel, napište mi prosím na <a href="mailto:' + KL.EMAIL + '">' + KL.EMAIL + '</a>.</p>' +
      '<button type="button" class="btn btn-primary" id="resultClose">Zavřít</button>');
    window.location.href = href;
  }
});
document.addEventListener('click', e => { if (e.target.id === 'resultClose') { resetResult(); closeCart(); } });

/* ---------------------------------------------------------------- Karty */
function photoHTML(p, big) {
  const c = catByName(p.cat);
  const g = c ? c.g : 'g1';
  let html = '<div class="pphoto ' + g + (big ? ' big' : '') + '"><span class="pph-label">FOTO</span>';
  if (p.photos > 0) html += '<img src="' + photoUrl(p, 1) + '" alt="' + esc(p.name) + '" loading="lazy" onerror="this.remove()">';
  return html + '</div>';
}

function cardHTML(p) {
  const price = priceText(p);
  return '<article class="pcard" data-id="' + p.id + '">' +
    '<button type="button" class="pcard-open" data-open="' + p.id + '" aria-label="Zobrazit detail: ' + esc(p.name) + '">' +
      photoHTML(p, false) +
      '<div class="pbody"><div class="pcat">' + esc(p.cat) + '</div><div class="pname">' + esc(p.name) + '</div>' +
      (p.short ? '<p class="pshort">' + esc(p.short) + '</p>' : '') + '</div>' +
    '</button>' +
    '<div class="pfoot"><div class="pprice">' + (price ? price : '<span class="pprice-na">Cena dle domluvy</span>') + '</div>' +
    '<button type="button" class="card-btn" data-add="' + p.id + '"></button></div></article>';
}

function refreshCardButtons() {
  $$('[data-add]').forEach(b => {
    const p = prodById(b.dataset.add); if (!p) return;
    const has = inCart(p.id);
    b.classList.toggle('on', has);
    b.innerHTML = has ? ICON_CHECK + 'V poptávce' : (p.variants && p.variants.length ? 'Vybrat' : ICON_PLUS + 'Do poptávky');
  });
}

document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o) { openModal(o.dataset.open); return; }
  const a = e.target.closest('[data-add]');
  if (a) {
    const p = prodById(a.dataset.add);
    if (inCart(p.id)) openCart();
    else if (p.variants && p.variants.length) openModal(p.id);
    else addToCart(p.id, '', 1);
  }
});

/* --------------------------------------------------------------- Detail */
let modalEl = null, lastFocusModal = null;

function ensureModal() {
  if (modalEl) return modalEl;
  modalEl = document.createElement('div');
  modalEl.className = 'pm-ov';
  modalEl.addEventListener('click', e => { if (e.target === modalEl) closeModal(); });
  document.body.appendChild(modalEl);
  return modalEl;
}

function openModal(id) {
  const p = prodById(id); if (!p) return;
  const el = ensureModal();
  lastFocusModal = document.activeElement;
  const price = priceText(p);
  const c = catByName(p.cat);
  const g = c ? c.g : 'g1';
  const n = p.photos > 0 ? p.photos : 0;

  let gal = '<div class="pphoto big ' + g + '" id="pmMain"><span class="pph-label">FOTO</span>' +
    (n > 0 ? '<img id="pmImg" src="' + photoUrl(p, 1) + '" alt="' + esc(p.name) + '" onerror="this.remove()">' : '') + '</div>';
  if (n > 1) {
    gal += '<div class="pm-thumbs">';
    for (let i = 1; i <= n; i++) gal += '<button type="button" class="' + (i === 1 ? 'on' : '') + '" data-photo="' + i + '" aria-label="Fotka ' + i + ' z ' + n + '"><img src="' + photoUrl(p, i) + '" alt=""></button>';
    gal += '</div>';
  }

  const specs = [];
  if (p.dim) specs.push('<div><dt>Rozměry</dt><dd>' + esc(p.dim) + '</dd></div>');
  if (p.mat) specs.push('<div><dt>Materiál</dt><dd>' + esc(p.mat) + '</dd></div>');
  const hasVar = p.variants && p.variants.length;

  el.innerHTML = '<div class="pm" role="dialog" aria-modal="true" aria-labelledby="pmTitle">' +
    '<button type="button" class="pm-close" id="pmClose" aria-label="Zavřít detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '<div class="pm-gal">' + gal + '</div>' +
    '<div class="pm-info">' +
      '<div class="pcat">' + esc(p.cat) + '</div>' +
      '<h2 id="pmTitle">' + esc(p.name) + '</h2>' +
      '<div class="pm-price">' + (price ? price : 'Cena dle domluvy') + '</div>' +
      (p.tags && p.tags.length ? '<div class="ptags">' + p.tags.map(t => '<a href="kategorie.html?k=vse&stitek=' + encodeURIComponent(t) + '">' + esc(t) + '</a>').join('') + '</div>' : '') +
      '<p class="pm-note">Fotografie jsou vzorové. Většina výrobků je originál, proto rozmístění drobných detailů i domečků nemusí přesně odpovídat.</p>' +
      (p.long ? '<p class="plong">' + esc(p.long) + '</p>' : '') +
      (specs.length ? '<dl class="specs">' + specs.join('') + '</dl>' : '') +
      (hasVar ? '<label class="pm-label" for="pmVar">Varianta</label><select id="pmVar">' + p.variants.map(v => '<option>' + esc(v) + '</option>').join('') + '</select>' : '') +
      '<label class="pm-label" for="pmQty">Počet kusů</label>' +
      '<div class="qty-step"><button type="button" id="pmMinus" aria-label="Ubrat kus">−</button><input id="pmQty" type="number" min="1" max="99" value="1" inputmode="numeric"><button type="button" id="pmPlus" aria-label="Přidat kus">+</button></div>' +
      '<button type="button" class="btn btn-primary pm-add" id="pmAdd">Přidat do poptávky</button>' +
      '<p class="pm-hint script">Každý kousek vyrábím ručně, úpravy a přání jsou na domluvě.</p>' +
    '</div></div>';

  el.classList.add('open'); document.body.classList.add('no-scroll');
  $('#pmClose').focus();

  $('#pmClose').onclick = closeModal;
  $('#pmMinus').onclick = () => { const q = $('#pmQty'); q.value = Math.max(1, (parseInt(q.value) || 1) - 1); };
  $('#pmPlus').onclick  = () => { const q = $('#pmQty'); q.value = Math.min(99, (parseInt(q.value) || 1) + 1); };
  $$('.pm-thumbs button', el).forEach(b => b.onclick = () => {
    $$('.pm-thumbs button', el).forEach(x => x.classList.remove('on')); b.classList.add('on');
    const main = $('#pmMain'); let img = $('#pmImg');
    if (!img) { img = document.createElement('img'); img.id = 'pmImg'; main.appendChild(img); }
    img.src = photoUrl(p, b.dataset.photo);
  });
  $('#pmAdd').onclick = () => {
    const qty = Math.max(1, Math.min(99, parseInt($('#pmQty').value) || 1));
    const variant = hasVar ? $('#pmVar').value : '';
    addToCart(p.id, variant, qty);
    const b = $('#pmAdd'); b.innerHTML = ICON_CHECK + 'Přidáno do poptávky';
    b.classList.add('done');
    setTimeout(() => { closeModal(); openCart(); }, 700);
  };
}

function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove('open'); document.body.classList.remove('no-scroll');
  if (lastFocusModal && lastFocusModal.focus) lastFocusModal.focus();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (modalEl && modalEl.classList.contains('open')) closeModal();
    else if (cartPanel.classList.contains('open')) closeCart();
  }
  if (e.key === 'Tab' && modalEl && modalEl.classList.contains('open')) {      // držet focus v okně
    const f = $$('button, select, input, a[href]', modalEl).filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ----------------------------------------------------------- Mobilní menu */
const menuBtn = $('#menuToggle'), navLinks = $('#navLinks');
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  navLinks.addEventListener('click', e => { if (e.target.closest('a')) { navLinks.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
}

/* ----------------------------------------------------------- Vyhledávání */
const sBtn = $('#searchBtn'), sBar = $('#searchBar');
function setSearch(open) {
  if (!sBar) return;
  sBar.hidden = !open; sBtn.setAttribute('aria-expanded', open);
  if (open) $('#q').focus();
}
if (sBtn && sBar) {
  sBtn.addEventListener('click', () => setSearch(sBar.hidden));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !sBar.hidden && !(modalEl && modalEl.classList.contains('open')) && !cartPanel.classList.contains('open')) { setSearch(false); sBtn.focus(); }
  });
}

// bez háčků a velkých písmen; věnec/věnce/věnců se sjednotí
const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\bven(ec|ce|ci|cu|cich|cum)\b/g, 'venc');

function searchProducts(q) {
  const words = norm(q).split(/[^a-z0-9]+/).filter(Boolean);
  if (!words.length) return [];
  const out = [];
  PRODUKTY.forEach(p => {
    const name = norm(p.name), cat = norm(p.cat), tags = norm((p.tags || []).join(' '));
    const hay = norm([p.name, p.cat, (p.tags || []).join(' '), p.short, p.long, p.mat, (p.variants || []).join(' ')].join(' '));
    let score = 0;
    const ok = words.every(w => {
      const forms = [w]; if (w.length >= 5) forms.push(w.slice(0, -1)); if (w.length >= 6) forms.push(w.slice(0, -2));   // různé pády
      const hit = f => hay.indexOf(f) >= 0;
      if (!forms.some(hit)) return false;
      if (name.indexOf(w) >= 0) score += 4; else if (forms.some(f => name.indexOf(f) >= 0)) score += 3;
      if (forms.some(f => cat.indexOf(f) >= 0)) score += 2;
      if (forms.some(f => tags.indexOf(f) >= 0)) score += 1;
      return true;
    });
    if (ok) out.push({ p: p, score: score });
  });
  out.sort((a, b) => b.score - a.score || a.p.id - b.p.id);
  return out.map(x => x.p);
}

function initSearch() {
  const head = $('#catHead'); if (!head || document.body.dataset.page !== 'search') return;
  const q = (new URLSearchParams(location.search).get('q') || '').trim();
  const grid = $('#pGrid'), count = $('#pCount');
  setSearch(true); $('#q').value = q;
  document.title = (q ? 'Hledání: ' + q : 'Hledání') + ' — Květy Lu';
  head.innerHTML = '<nav class="crumbs" aria-label="Drobečková navigace"><a href="' + KL.HOME + '">Domů</a><span aria-hidden="true">›</span><span>Hledání</span></nav>' +
    '<h1>' + (q ? 'Výsledky pro „' + esc(q) + '“' : 'Hledání') + '</h1>';
  if (!q) {
    head.innerHTML += '<p class="search-note">Napište do políčka nahoře, co hledáte, třeba „věnec“, „zápich“ nebo „vánoční“.</p>';
    count.style.display = 'none'; return;
  }
  const list = searchProducts(q);
  count.textContent = list.length + ' ' + plural(list.length, 'produkt', 'produkty', 'produktů');
  if (!list.length) {
    grid.innerHTML = '<div class="empty-note"><h3>Nic jsem nenašla</h3><p>Zkuste prosím jiné slovo, nebo si vyberte kategorii níže. Většinu kousků vyrobím i na přání, stačí napsat, co máte na mysli.</p><a class="btn btn-primary" href="mailto:' + KL.EMAIL + '">Napsat e-mail</a></div>';
    return;
  }
  grid.innerHTML = list.map(cardHTML).join('');
  refreshCardButtons();
}

/* ------------------------------------------------------ Hlavní stránka */
function initReviews() {
  var t = document.getElementById('revTrack'); if (!t) return;
  var slides = t.querySelectorAll('.rev-slide'), dots = document.getElementById('revDots'), cur = 0;
  slides.forEach(function (_, i) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'rev-dot';
    b.setAttribute('aria-label', 'Recenze ' + (i + 1)); b.addEventListener('click', function () { go(i); });
    dots.appendChild(b);
  });
  function mark(i) { cur = i; dots.querySelectorAll('.rev-dot').forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); }); }
  function go(i) { i = (i + slides.length) % slides.length; t.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' }); mark(i); }
  var raf = 0;
  t.addEventListener('scroll', function () {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () { var i = Math.round(t.scrollLeft / (slides[0].offsetWidth + 24)); if (i !== cur) mark(Math.max(0, Math.min(slides.length - 1, i))); });
  });
  document.getElementById('revPrev').addEventListener('click', function () { go(cur - 1); });
  document.getElementById('revNext').addEventListener('click', function () { go(cur + 1); });
  t.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } });
  mark(0);
}

function initHome() {
  const tl = $('#tagLinks');
  if (tl) {
    const ts = allTags().filter(x => ['Vánoce', 'Zima', 'Podzim', 'Jaro', 'Velikonoce', 'Celoroční', 'Provence', 'Limitovaná edice', 'Na přání', 'Vhodné jako dárek'].indexOf(x) >= 0);
    if (ts.length) {
      tl.innerHTML = '<h3>Nebo si vyberte podle období a stylu</h3><div class="chips">' + ts.map(x => '<a class="filter-btn" href="kategorie.html?k=vse&stitek=' + encodeURIComponent(x) + '">' + esc(x) + '</a>').join('') + '</div>';
      tl.hidden = false;
    }
  }
  const grid = $('#featuredGrid'); if (!grid) return;
  // Vybrané kousky: první produkt z každé z prvních šesti kategorií
  // Vybrané kousky (čísla produktů z tabulky); co v tabulce chybí, se přeskočí a doplní se dalšími
  const ZIMA = KL.SNEH;   // zimní sezóna: na úvodní straně zimní kousky
  const FEATURED = ZIMA ? [2, 16, 22, 4, 3, 17, 10, 29] : [1, 6, 9, 11, 2, 21, 16, 20];
  if (ZIMA) {
    const set = (id, txt) => { const e = $('#' + id); if (e) e.textContent = txt; };
    set('fEyebrow', 'ZIMNÍ NABÍDKA');
    set('fTitle', 'Zima v mé dílně');
    set('fText', 'Vánoční vesničky, svícny a dekorace, které zahřejí domov. Kliknutím na kartu uvidíte víc fotek a podrobnosti.');
    const m = $('#fMore'); if (m) { m.setAttribute('href', 'kategorie.html?k=vanoce'); m.firstChild.nodeValue = 'Zobrazit vánoční nabídku '; }
  }
  let picks = FEATURED.map(id => PRODUKTY.find(x => x.id === id)).filter(Boolean);
  for (let i = 0; picks.length < 8 && i < PRODUKTY.length; i++) { if (picks.indexOf(PRODUKTY[i]) < 0) picks.push(PRODUKTY[i]); }
  grid.innerHTML = picks.map(cardHTML).join('');
}

/* ---------------------------------------------------- Stránka kategorie */
function initCategory() {
  const head = $('#catHead'); if (!head || document.body.dataset.page !== 'category') return;
  const slug = new URLSearchParams(location.search).get('k');
  const cat = slug === 'vse' ? { name: 'Kompletní nabídka', slug: 'vse', intro: 'Všechno z mé dílny na jednom místě. Vyberte si podle období nebo stylu – třeba Vánoce, Provence nebo Vhodné jako dárek.' } : KL.CATS.find(c => c.slug === slug);
  const grid = $('#pGrid'), filt = $('#pFilters'), count = $('#pCount');

  if (!cat) {
    head.innerHTML = '<h1>Tuhle kategorii jsem nenašla</h1><p class="page-intro">Vyberte si prosím z nabídky níže.</p>';
    filt.style.display = 'none'; count.style.display = 'none'; return;
  }
  document.title = cat.name + ' — Květy Lu';
  const md = document.querySelector('meta[name="description"]'); if (md) md.content = cat.intro;
  $$('.cat-switch a').forEach(a => { if (a.dataset.slug === cat.slug) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); } });

  head.innerHTML = '<nav class="crumbs" aria-label="Drobečková navigace"><a href="' + KL.HOME + '">Domů</a><span aria-hidden="true">›</span><a href="' + KL.HOME + '#kategorie">Kolekce</a><span aria-hidden="true">›</span><span>' + esc(cat.name) + '</span></nav>' +
    '<h1>' + esc(cat.name) + '</h1><p class="page-intro">' + esc(cat.intro) + '</p>';

  const items = slug === 'vse' ? PRODUKTY.slice() : PRODUKTY.filter(p => cat.tag ? (p.tags || []).indexOf(cat.tag) >= 0 : p.cat === cat.name);
  const tags = []; items.forEach(p => (p.tags || []).forEach(t => { if (tags.indexOf(t) < 0) tags.push(t); }));
  if (slug === 'vse') { const s = sortTags(tags); tags.length = 0; s.forEach(x => tags.push(x)); }
  const startTag = new URLSearchParams(location.search).get('stitek');

  function draw(tag) {
    const list = tag ? items.filter(p => (p.tags || []).indexOf(tag) >= 0) : items;
    grid.innerHTML = list.map(cardHTML).join('');
    count.textContent = list.length + ' ' + plural(list.length, 'produkt', 'produkty', 'produktů');
    if (slug === 'vse') { try { history.replaceState(null, '', location.pathname + '?k=vse' + (tag ? '&stitek=' + encodeURIComponent(tag) : '')); } catch (e) {} }
    refreshCardButtons();
  }

  if (items.length === 0) {
    grid.innerHTML = '<div class="empty-note"><h3>Tady zatím nic nemám</h3><p>Nové kousky brzy přibudou. Napište mi, co byste chtěli – ráda to pro vás vyrobím.</p><a class="btn btn-primary" href="mailto:' + KL.EMAIL + '">Napsat e-mail</a></div>';
    filt.style.display = 'none'; count.style.display = 'none'; return;
  }
  if (tags.length >= 2) {
    filt.innerHTML = '<span class="filters-label">Zobrazit:</span><button type="button" class="filter-btn active" data-tag="" aria-pressed="true">Vše</button>' +
      tags.map(t => '<button type="button" class="filter-btn" data-tag="' + esc(t) + '" aria-pressed="false">' + esc(t) + '</button>').join('');
    filt.addEventListener('click', e => {
      const b = e.target.closest('.filter-btn'); if (!b) return;
      $$('.filter-btn', filt).forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('active'); b.setAttribute('aria-pressed', 'true');
      draw(b.dataset.tag);
    });
  } else { filt.style.display = 'none'; }
  const first = (slug === 'vse' && startTag && tags.indexOf(startTag) >= 0) ? startTag : '';
  if (first) { $$('.filter-btn', filt).forEach(x => { const on = x.dataset.tag === first; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); }
  draw(first);
}

/* ------------------------------------------------------------- Start */
initHome();
initCategory();
initSearch();
initReviews();
renderCart();
refreshCardButtons();


/* ---------- Jemné sněžení (zimní sezóna) ---------- */
(function snezeni(){
  if (!KL.SNEH) return;
  try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch(e){}
  const c = document.createElement('canvas');
  c.setAttribute('aria-hidden','true');
  c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:40';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  let W, H, flakes = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize(){
    W = innerWidth; H = innerHeight;
    c.width = W*dpr; c.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    const n = Math.round(Math.min(70, Math.max(26, W/22)));
    while (flakes.length < n) flakes.push(nova(true));
    flakes.length = n;
  }
  function nova(rand){
    const r = 1.4 + Math.random()*3;
    return { x: Math.random()*W, y: rand ? Math.random()*H : -10, r,
             v: .35 + r*.16, a: Math.random()*6.28, s: .004 + Math.random()*.012,
             d: 10 + Math.random()*22, o: .5 + Math.random()*.4 };
  }
  let last = 0;
  function tick(t){
    if (document.hidden){ requestAnimationFrame(tick); return; }
    const dt = Math.min(2.2, (t-last)/16.7 || 1); last = t;
    ctx.clearRect(0,0,W,H);
    for (const f of flakes){
      f.y += f.v*dt; f.a += f.s*dt;
      const x = f.x + Math.sin(f.a)*f.d;
      if (f.y > H+10){ Object.assign(f, nova(false), {x: Math.random()*W}); }
      ctx.beginPath(); ctx.arc(x, f.y, f.r, 0, 6.283);
      ctx.fillStyle = 'rgba(255,255,255,'+f.o+')';
      ctx.shadowColor = 'rgba(95,120,150,.55)'; ctx.shadowBlur = 3;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  addEventListener('resize', resize);
  resize(); requestAnimationFrame(tick);
})();


/* ---------- Typografie: nezalamovat jednopísmenné předložky a čísla s jednotkou ---------- */
(function nbspFix(){
  const NB = '\u00a0';
  const re1 = /(?<![^\s(„"“>])([KkSsVvZzOoUuAaIi]) /g;
  const re2 = /(\d) (Kč|cm|mm|kg|dní|dnů|dne|ks|min|%)(?![\wáčďéěíňóřšťúůýž])/g;
  function fix(root){
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n){
        const p = n.parentNode && n.parentNode.nodeName;
        return /^(SCRIPT|STYLE|TEXTAREA|OPTION)$/.test(p) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(n => {
      const v = n.nodeValue; if (!v || v.length < 3) return;
      const r = v.replace(re1, '$1' + NB).replace(re1, '$1' + NB).replace(re2, '$1' + NB + '$2');
      if (r !== v) n.nodeValue = r;
    });
  }
  let busy = false;
  function run(){ if (busy) return; busy = true; requestAnimationFrame(() => { fix(document.body); busy = false; }); }
  document.addEventListener('DOMContentLoaded', () => {
    fix(document.body);
    new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
  });
})();
