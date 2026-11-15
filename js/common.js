/* ==========================================================
   COMMON JS (owner: A): shared helpers, student nav bar, footer
   Pages need: <body data-nav="home|cafeterias|orders" data-auth="student">
               <header id="site-header"></header> ... <footer id="site-footer"></footer>
   Shared storage keys (agree with B and C):
     ece_session : { name, email, role }
     ece_tray    : [ { id, qty } ]   (B)
     ece_orders  : [ { id, cafeteriaId, items, total, pickup, status, createdAt } ]  (B writes, C updates status)
   ========================================================== */

const IN_SUBFOLDER = ["/main/", "/student/", "/staff/"].some((p) => location.pathname.includes(p));
const BASE = IN_SUBFOLDER ? "../" : "./";

/* ---------- Data and formatting ---------- */
let _dataPromise = null;
function loadData() {
  if (!_dataPromise) _dataPromise = fetch(BASE + "data/data.json").then((r) => r.json());
  return _dataPromise;
}
function formatPrice(n) { return n.toFixed(2).replace(".", ",") + " €"; }
function getJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

/* ---------- Session ---------- */
function getSession() { return getJSON("ece_session", null); }
function logout() { localStorage.removeItem("ece_session"); window.location.href = BASE + "index.html"; }
function requireLogin() {
  if (document.body.dataset.auth === "student" && !getSession()) window.location.href = BASE + "index.html";
}

/* ---------- Icons ---------- */
const ICONS = {
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  cart: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM3 2v2h2l3.6 7.6-1.4 2.4A2 2 0 009 17h11v-2H9.4l1-1.8h7.2a2 2 0 001.7-1l3.6-6.5A1 1 0 0022 5H6.2l-.9-3H3z"/></svg>',
  user: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm0 14a8 8 0 01-6-2.7c.1-2 4-3.1 6-3.1s5.9 1.1 6 3.1A8 8 0 0112 20z"/></svg>',
  menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};

/* ---------- Nav bar ---------- */
function renderNav() {
  const el = document.getElementById("site-header");
  if (!el) return;
  const active = document.body.dataset.nav;
  const link = (key, label, href) =>
    `<a class="nav-pill${active === key ? " is-active" : ""}" href="${BASE}${href}">${label}</a>`;
  const trayCount = getJSON("ece_tray", []).reduce((n, i) => n + i.qty, 0);

  el.className = "navbar";
  el.innerHTML = `
    <a class="navbar__logo" href="${BASE}main/home.html">ECE EATS</a>
    <nav class="navbar__links" id="nav-links">
      ${link("home", "Home", "main/home.html")}
      ${link("cafeterias", "Cafeterias", "main/cafeterias.html")}
      ${link("orders", "My Orders", "student/my-orders.html")}
    </nav>
    <div class="navbar__actions">
      <form class="search-pill" id="nav-search" role="search">
        ${ICONS.search}<input type="search" placeholder="Search" aria-label="Search cafeterias">
      </form>
      <a class="icon-btn" href="${BASE}student/checkout.html" aria-label="Cart">
        ${ICONS.cart}${trayCount ? `<span class="badge">${trayCount}</span>` : ""}
      </a>
      <div class="user-wrap">
        <button class="icon-btn" id="user-btn" aria-label="Account" aria-expanded="false">${ICONS.user}</button>
        <div class="user-menu" id="user-menu">
          <p class="user-menu__name">${getSession()?.name ?? "Guest"}</p>
          <button type="button" id="logout-btn">Log out</button>
        </div>
      </div>
      <button class="navbar__toggle" id="nav-toggle" aria-label="Menu">${ICONS.menu}</button>
    </div>`;

  document.getElementById("nav-toggle").addEventListener("click", () =>
    document.getElementById("nav-links").classList.toggle("is-open"));
  const menu = document.getElementById("user-menu");
  document.getElementById("user-btn").addEventListener("click", (e) => { e.stopPropagation(); menu.classList.toggle("is-open"); });
  document.addEventListener("click", () => menu.classList.remove("is-open"));
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.getElementById("nav-search").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = e.target.querySelector("input").value.trim();
    window.location.href = BASE + "main/cafeterias.html" + (q ? "?q=" + encodeURIComponent(q) : "");
  });
}

/* ---------- Footer ---------- */
function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  el.className = "footer";
  el.innerHTML = `
    <div class="container">
      <div class="footer__grid">
        <div><h4>ECE EATS</h4>
          <p>Official ECE Paris Campus Dining Platform. Quick student meal ordering and nutritional information tracking.</p></div>
        <div><h4>Site Campus</h4>
          <ul><li>Campus Eiffel 1 — 10 Rue Sextius Michel, 75015</li>
              <li>Campus Eiffel 2 — 37 Quai de Grenelle, 75015</li>
              <li>Campus Cœur Défense — Tour A, 92400 Courbevoie</li></ul></div>
        <div><h4>Support &amp; Maintenance</h4>
          <p>Catering &amp; Facilities Office: Building E1, Office 104<br>Office Hours: 8:30 AM – 5:00 PM</p></div>
      </div>
      <p class="footer__legal">© 2026 École Centrale d’Électronique (ECE Paris). ECE Eats Connected Dining System</p>
    </div>`;
}

document.addEventListener("DOMContentLoaded", () => { requireLogin(); renderNav(); renderFooter(); });