/* ECE Eats Pro - logique staff (Orders + Dashboard)
   Les commandes sont dans localStorage sous la clé "ece_orders".
   Format d'une commande (à partager avec Megane pour le checkout) :
   { id:'ECE-2848', student:'Alex Costa', track:'ING4 cybersecurity',
     items:[{name:'Ham & Cheese Panini', qty:1, price:4.5}],
     orderedAt:'12h04', pickupTime:'13h00', status:'Confirmed', collectedAt:null } */
const KEY = "ece_orders";
const STATUSES = ["Confirmed", "Cooking", "Ready", "Collected"];
const ICON = { Confirmed: "✓", Cooking: "🍳", Ready: "🔔", Collected: "✔" };
const ACTION = {
  Confirmed: { dash: "Start cooking", full: "Start Cooking" },
  Cooking: { dash: "Mark as ready", full: "Mark as ready & Inform Student" },
  Ready: { dash: "Mark as Collected", full: "Confirm Pickup" },
  Collected: { dash: "See order", full: "See order" },
};

const SEED = [
  { id: "ECE-2835", student: "John Giggs", track: "ING4 cybersecurity", items: [{ name: "Chicken Caesar Salad", qty: 1, price: 6.5 }], orderedAt: "12h04", pickupTime: "12h32", status: "Ready" },
  { id: "ECE-2841", student: "Eva Smith", track: "ING4 cybersecurity", items: [{ name: "Chicken & Cheese Panini", qty: 1, price: 4.5 }], orderedAt: "12h04", pickupTime: "12h48", status: "Cooking" },
  { id: "ECE-2848", student: "Alex Costa", track: "ING4 cybersecurity", items: [{ name: "Ham & Cheese Panini", qty: 1, price: 4.5 }, { name: "Chicken Caesar Salad", qty: 1, price: 6.5 }], orderedAt: "12h04", pickupTime: "13h00", status: "Confirmed" },
  { id: "ECE-2836", student: "John Giggs", track: "ING4 cybersecurity", items: [{ name: "Ham & Cheese Panini", qty: 1, price: 4.5 }, { name: "Chicken Caesar Salad", qty: 1, price: 6.5 }], orderedAt: "12h04", pickupTime: "13h00", status: "Cooking" },
  { id: "ECE-2837", student: "Camille Dupont", track: "ING3 cybersecurity", items: [{ name: "Salmon Poke Bowl", qty: 1, price: 6.5 }], orderedAt: "12h04", pickupTime: "13h30", status: "Confirmed" },
  { id: "ECE-2838", student: "Sarah Benali", track: "ING2 DevOps", items: [{ name: "Ricotta & spinach bowl", qty: 1, price: 8.5 }], orderedAt: "12h04", pickupTime: "12h25", status: "Ready" },
  { id: "ECE-2839", student: "David Petit", track: "ING4 Cloud", items: [{ name: "Mild curry mayonnaise sandwich", qty: 1, price: 6.5 }, { name: "Cristaline water", qty: 1, price: 1.5 }], orderedAt: "12h04", pickupTime: "11h45", status: "Collected", collectedAt: "11h45" },
];

/* ---------- Données ---------- */
function getOrders() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* stockage indisponible : on retombe sur les données de démo */ }
  saveOrders(SEED);
  return SEED.map((o) => ({ ...o }));
}
function saveOrders(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* ignoré */ }
}
function advance(id) {
  const list = getOrders();
  const o = list.find((x) => x.id === id);
  if (!o) return null;
  const i = STATUSES.indexOf(o.status);
  if (i < STATUSES.length - 1) o.status = STATUSES[i + 1];
  if (o.status === "Collected") {
    const d = new Date();
    o.collectedAt = String(d.getHours()).padStart(2, "0") + "h" + String(d.getMinutes()).padStart(2, "0");
  }
  saveOrders(list);
  return o;
}

/* ---------- Utilitaires ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const minutes = (t) => { const [h, m] = t.split("h").map(Number); return h * 60 + (m || 0); };
const money = (n) => n.toFixed(2).replace(".", ",") + "€";
const total = (o) => o.items.reduce((s, i) => s + i.qty * i.price, 0);
const byPickup = (a, b) => (a.status === "Collected") - (b.status === "Collected") || minutes(a.pickupTime) - minutes(b.pickupTime);
const statusPill = (s) => `<span class="status ${s}"><span aria-hidden="true">${ICON[s]}</span>${s}</span>`;

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}
function afterAdvance(o) {
  if (!o) return;
  toast(o.status === "Ready" ? `Order #${o.id} is ready. Student notified.` : `Order #${o.id} is now ${o.status}.`);
}

/* ---------- Shell (menu mobile, déconnexion) ---------- */
$("#menuBtn").addEventListener("click", () => {
  const open = document.body.classList.toggle("menu-open");
  $("#menuBtn").setAttribute("aria-expanded", open);
});
$("#logout").addEventListener("click", () => { window.location.href = "../main/staff_login.html"; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.body.classList.remove("menu-open"); });

/* ---------- Page Orders ---------- */
function renderOrders() {
  const all = getOrders();
  const filter = document.body.dataset.filter || "All";
  const q = $("#search").value.trim().toLowerCase().replace("#", "");
  const matches = (o) => !q || [o.id, o.student, o.track, o.status, o.pickupTime, ...o.items.map((i) => i.name)]
    .join(" ").toLowerCase().includes(q);
  const list = all.filter((o) => (filter === "All" || o.status === filter) && matches(o)).sort(byPickup);
  

  $("#cQueue").textContent = all.filter((o) => o.status === "Confirmed").length;
  $("#cKitchen").textContent = all.filter((o) => o.status === "Cooking").length;
  $("#cReady").textContent = all.filter((o) => o.status === "Ready").length;

  $("#orderList").innerHTML = list.length
    ? list.map((o) => `
    <article class="card" id="card-${esc(o.id)}">
      <div class="card-body">
        <div class="who"><strong>#${esc(o.id)}</strong><span class="tag">${esc(o.student)}</span><span class="tag">${esc(o.track)}</span></div>
        <div>${o.items.map((i) => `<div class="line"><span>${i.qty}× ${esc(i.name)}</span><span>${money(i.price)}</span></div>`).join("")}</div>
        <div class="when">Ordered at ${esc(o.orderedAt)}
          <div class="big">${o.status === "Collected" ? "Collected at " + esc(o.collectedAt || o.pickupTime) : "Pickup time " + esc(o.pickupTime)}</div></div>
      </div>
      <div class="card-status"><span>Status :</span>${statusPill(o.status)}</div>
      <div class="card-foot"><button class="btn-dark ${o.status === "Collected" ? "see" : ""}" data-id="${esc(o.id)}" data-status="${o.status}">${ACTION[o.status].full}</button></div>
      <div class="details">Total: <strong>${money(total(o))}</strong></div>
    </article>`).join("")
    : `<p class="empty">No order matches. Try another status or number.</p>`;
}
function initOrders() {
  document.body.dataset.filter = "All";
  $("#filters").innerHTML = ["All", ...STATUSES].map((s) => `<button class="chip" data-f="${s}" aria-pressed="${s === "All"}">${s}</button>`).join("");
  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    document.body.dataset.filter = b.dataset.f;
    document.querySelectorAll("#filters .chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
    renderOrders();
  });
  $("#search").addEventListener("input", renderOrders);
  $("#orderList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    if (b.dataset.status === "Collected") { b.closest(".card").classList.toggle("open"); return; }
    afterAdvance(advance(b.dataset.id));
    renderOrders();
  });
  renderOrders();
}

/* ---------- Page Dashboard ---------- */
const DAILY_BASE = 241, DAILY_TARGET = 310;
function renderDashboard() {
  const all = getOrders();
  const active = all.filter((o) => o.status !== "Collected").sort(byPickup);
  const kitchen = all.filter((o) => o.status === "Cooking").length;
  const waiting = all.filter((o) => o.status === "Confirmed").length;
  const ready = all.filter((o) => o.status === "Ready").length;
  const today = DAILY_BASE + all.length;

  $("#dToday").textContent = today;
  $("#dBar").style.width = Math.min(100, Math.round((today / DAILY_TARGET) * 100)) + "%";
  $("#dBarWrap").setAttribute("aria-valuenow", today);
  $("#dKitchen").textContent = kitchen;
  $("#dWaiting").textContent = `${waiting} currently waiting to be prepared`;
  $("#dReady").textContent = String(ready).padStart(2, "0");
  $("#dActiveCount").textContent = active.length;
  $("#dPrio").textContent = `${Math.min(3, active.length)} priorities`;

  $("#queueBody").innerHTML = active.length
    ? active.slice(0, 5).map((o) => `
    <tr>
      <td data-label="Ticket & Student"><strong>#${esc(o.id)}</strong><small>${esc(o.student)}, ${esc(o.track)}</small></td>
      <td data-label="Chosen menu">${o.items.map((i) => esc(i.name)).join(" + ")}</td>
      <td data-label="Pickup time">${esc(o.pickupTime)}</td>
      <td data-label="Status">${statusPill(o.status)}</td>
      <td data-label="Action"><button class="act ${o.status}" data-id="${esc(o.id)}">${ACTION[o.status].dash}</button></td>
    </tr>`).join("")
    : `<tr><td colspan="5" class="empty">No active order. New orders appear here.</td></tr>`;
}
function initDashboard() {
  $("#queueBody").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    afterAdvance(advance(b.dataset.id));
    renderDashboard();
  });
  renderDashboard();
}

/* ---------- Démarrage + mise à jour live (autre onglet : ex. nouvelle commande étudiante) ---------- */
const page = document.body.dataset.page;
if (page === "orders") initOrders();
if (page === "dashboard") initDashboard();
window.addEventListener("storage", (e) => {
  if (e.key !== KEY) return;
  if (page === "orders") renderOrders();
  if (page === "dashboard") renderDashboard();
});

/* ---------- Page Menu Management ---------- */
const MKEY = "ece_menu";
const MENU_SEED = [
  { id: 1, name: "Chicken Caesar Salad", desc: "Grilled chicken, lettuce, Parmesan, croutons and Caesar dressing.", price: 6.5, stock: 14, tag: "Halal", cat: "Salad" },
  { id: 2, name: "Ham & Cheese Panini", desc: "Ham, Emmental cheese and butter.", price: 4.5, stock: 10, tag: "", cat: "Panini" },
  { id: 3, name: "Chicken & Mozzarella Panini", desc: "Grilled chicken, mozzarella, tomatoes and pesto.", price: 4.5, stock: 2, tag: "Halal", cat: "Panini" },
  { id: 4, name: "Salmon Poke Bowl", desc: "Salmon, fresh avocado, toasted sesame sauce.", price: 6.5, stock: 7, tag: "Fish", cat: "PokeBowls" },
  { id: 5, name: "Mediterranean Vegetarian Salad", desc: "Quinoa, chickpeas, cucumber, cherry tomatoes and feta.", price: 6.5, stock: 0, tag: "Vegetarian", cat: "Salad" },
];
const CRITICAL = 3;
let mFilter = "All", editId = null;
function getMenu() {
  try { const r = localStorage.getItem(MKEY); if (r) return JSON.parse(r); } catch (e) { /* ignoré */ }
  saveMenu(MENU_SEED);
  return MENU_SEED.map((d) => ({ ...d }));
}
function saveMenu(m) { try { localStorage.setItem(MKEY, JSON.stringify(m)); } catch (e) { /* ignoré */ } }

const DISH_IMG = {
  "Chicken Caesar Salad": "chicken-caesar-salad.jpg",
  "Ham & Cheese Panini": "ham-cheese-panini.jpg",
  "Chicken & Mozzarella Panini": "chicken-mozzarella-panini.jpg",
  "Salmon Poke Bowl": "salmon-poke.jpg",
  "Mediterranean Vegetarian Salad": "mediterranean-salad.jpg"
};
const dishImg = (name) => DISH_IMG[name]
  ? `<img class="thumb" src="../images/dishes/${DISH_IMG[name]}" alt="" loading="lazy">`
  : `<span class="thumb thumb--empty" aria-hidden="true"></span>`;

function renderMenu() {
  const all = getMenu();
  const q = $("#mSearch").value.trim().toLowerCase();
  const list = all.filter((d) => (mFilter === "All" || d.cat === mFilter) && d.name.toLowerCase().includes(q));
  $("#mActive").textContent = all.filter((d) => d.stock > 0).length;
  $("#mOut").textContent = all.filter((d) => d.stock === 0).length;
  $("#menuBody").innerHTML = list.length ? list.map((d) => `
    <tr>
      <td data-label="Item"><div class="item">${dishImg(d.name)}<div><strong>${esc(d.name)}</strong><small>${esc(d.desc)}</small>${d.tag ? `<span class="tag">${esc(d.tag)}</span>` : ""}</div></div></td>
      <td data-label="Price">${money(d.price)}</td>
      <td data-label="Stock"><div class="stepper"><button type="button" data-a="dec" data-id="${d.id}" aria-label="Decrease stock of ${esc(d.name)}">−</button><output>${d.stock}</output><button type="button" data-a="inc" data-id="${d.id}" aria-label="Increase stock of ${esc(d.name)}">+</button></div>
        ${d.stock === 0 ? '<span class="warn">⚠ Out of stock</span>' : d.stock <= CRITICAL ? '<span class="warn">⚠ Critical stock</span>' : ""}</td>
      <td data-label="Action"><button class="icon-btn" type="button" data-a="edit" data-id="${d.id}" aria-label="Edit ${esc(d.name)}">✏️</button><button class="icon-btn" type="button" data-a="del" data-id="${d.id}" aria-label="Delete ${esc(d.name)}">🗑️</button></td>
    </tr>`).join("") : `<tr><td colspan="4" class="empty">No dish found. Use "Add a dish" to create one.</td></tr>`;
}
function openDish(d) {
  const f = $("#dishForm");
  editId = d ? d.id : null;
  $("#dlgTitle").textContent = d ? "Edit dish" : "Add a dish";
  f.reset();
  if (d) ["name", "desc", "price", "stock", "cat", "tag"].forEach((k) => (f.elements[k].value = d[k]));
  $("#dishDialog").showModal();
}
function initMenu() {
  const cats = ["All", "Panini", "Salad", "PokeBowls", "Pasta"];
  $("#mFilters").innerHTML = cats.map((c) => `<button class="chip" type="button" data-f="${c}" aria-pressed="${c === "All"}">${c}</button>`).join("");
  $("#mFilters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]"); if (!b) return;
    mFilter = b.dataset.f;
    document.querySelectorAll("#mFilters .chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
    renderMenu();
  });
  $("#mSearch").addEventListener("input", renderMenu);
  $("#addDish").addEventListener("click", () => openDish(null));
  $("#dlgCancel").addEventListener("click", () => $("#dishDialog").close());
  $("#menuBody").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const m = getMenu(), d = m.find((x) => x.id === Number(b.dataset.id)); if (!d) return;
    if (b.dataset.a === "inc") d.stock += 1;
    if (b.dataset.a === "dec") d.stock = Math.max(0, d.stock - 1);
    if (b.dataset.a === "edit") return openDish(d);
    if (b.dataset.a === "del") {
      if (!confirm(`Delete "${d.name}"?`)) return;
      saveMenu(m.filter((x) => x !== d)); toast("Dish deleted."); return renderMenu();
    }
    saveMenu(m);
    if (d.stock === 0) toast(`${d.name} is now out of stock.`);
    renderMenu();
  });
  $("#dishForm").addEventListener("submit", () => {
    const f = $("#dishForm").elements, m = getMenu();
    const data = { name: f.name.value.trim(), desc: f.desc.value.trim(), price: Number(f.price.value), stock: Math.max(0, parseInt(f.stock.value, 10) || 0), cat: f.cat.value, tag: f.tag.value };
    if (editId) Object.assign(m.find((x) => x.id === editId), data);
    else m.push({ id: Date.now(), ...data });
    saveMenu(m); toast(editId ? "Dish updated." : "Dish added."); renderMenu();
  });
  renderMenu();
}
if (page === "menu") initMenu();

/* ---------- Top bar icons (same inline-SVG method as common.js) ---------- */
const TOP_ICONS = {
  bell: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2.2 2.2 0 002.1-1.6H9.9A2.2 2.2 0 0012 22zm6-6.5V11a6 6 0 00-4.6-5.8V4.5a1.4 1.4 0 10-2.8 0v.7A6 6 0 006 11v4.5l-2 2V19h16v-1.5l-2-2z"/><circle cx="18.5" cy="5.5" r="3"/></svg>',
  user: '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm0 14a8 8 0 01-6-2.7c.1-2 4-3.1 6-3.1s5.9 1.1 6 3.1A8 8 0 0112 20z"/></svg>'
};

(function renderTopIcons() {
  const box = document.querySelector(".top-icons");
  if (!box) return;
  const withBell = document.body.dataset.page !== "admin";   // the admin bar only has the profile
  box.innerHTML =
    (withBell ? `<button type="button" class="top-icon" aria-label="Notifications">${TOP_ICONS.bell}</button>` : "") +
    `<button type="button" class="top-icon" aria-label="Profile">${TOP_ICONS.user}</button>`;
})();