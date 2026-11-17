// ===== ECE EATS · Student flow =====
// 1. DATA & STATE (cart and orders are saved in localStorage)
let products = [];      // dishes of the current cafeteria (from data.json)
let cafeteria = null;   // the current cafeteria
const STORAGE_CART = "ece_tray", STORAGE_ORDERS = "eceEatsStudentOrders", STORAGE_STUDENT = "eceEatsStudentProfile", PAYMENT_LABELS = {card:"Bank card (demo)", wallet:"Apple Pay / Google Pay (demo)", pickup:"Pay at pickup"};
const EMPTY_TRAY = '<p class="empty-state">Your tray is empty. Add something delicious!</p>';
const $ = id => document.getElementById(id), $$ = selector => document.querySelectorAll(selector);
const on = (id, type, fn) => $(id)?.addEventListener(type, fn), go = page => { location.href = page; }, read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
let cart = read(STORAGE_CART, []), orders = read(STORAGE_ORDERS, []), selectedCategory = "All", selectedTime = "ASAP", selectedPayment = "card", toastTimer;
// 2. HELPERS
const money = value => formatPrice(Number(value));
const save = () => { localStorage.setItem(STORAGE_CART, JSON.stringify(cart)); if (typeof updateCartBadge === "function") updateCartBadge(); };
const total = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), count = () => cart.reduce((sum, item) => sum + item.quantity, 0);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const itemsText = items => items.map(item => `${item.quantity}x ${escapeHtml(item.name)}`).join(" + ");
function showToast(message) {
  $("toast").textContent = message; $("toast").classList.add("show"); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2300);
}
const set = (id, text) => { if ($(id)) $(id).textContent = text; }, setHtml = (id, html) => { if ($(id)) $(id).innerHTML = html; };
// 3. MENU (category filter + search)
function renderMenu() {
  if (!$("menuGroups") || !products.length) return; // only on menu.html, once the data is loaded
  const categories = selectedCategory === "All" ? [...new Set(products.map(p => p.category))] : [selectedCategory];
  $("menuGroups").innerHTML = categories.map(category => {
    const items = products.filter(p => p.category === category);
    return items.length ? `<section class="menu-group"><h2>${escapeHtml(category)}</h2><div class="food-grid">${items.map(productCard).join("")}</div></section>` : "";
  }).join("") || '<p class="empty-state">No dishes available.</p>';
}
function productCard(p) {
  const tags = p.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const inCart = cart.find(item => item.id === p.id);
  const action = p.available === false ? '<span class="stock-label">Out of stock</span>'
    : inCart ? `<div class="stepper"><button type="button" data-action="minus" data-id="${p.id}" aria-label="Decrease quantity">−</button><span>${inCart.quantity}</span><button type="button" data-action="plus" data-id="${p.id}" aria-label="Increase quantity">+</button></div>`
    : `<button class="add-btn" data-id="${p.id}">＋ Add</button>`;
  return `<article class="food-card ${p.available === false ? "unavailable" : ""}"><img src="${BASE}${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.visibility='hidden'">
    <div class="food-content"><div class="food-title-row"><h3>${escapeHtml(p.name)}</h3></div><p class="food-description">${escapeHtml(p.description || "")}</p>
    <div class="tags">${tags}</div><div class="food-bottom"><span class="price">${money(p.price)}</span>${action}</div></div></article>`;
}
// 4. TRAY (add, + / − steppers, remove, automatic total)
function addToCart(id) {
  const product = products.find(p => p.id === id), existing = cart.find(item => item.id === id);
  if (!product || product.available === false) return;
  if (cart.length && cart[0].cafeteriaId !== product.cafeteriaId) {
    if (!confirm("Your tray contains dishes from another cafeteria. Start a new tray?")) return;
    cart = [];
  }
  const current = cart.find(item => item.id === id);
  if (current) current.quantity++; else cart.push({...product, quantity:1});
  save(); renderTray(); showToast(product.name + " added to your tray");
}
function trayAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id), action = button.dataset.action, item = cart.find(row => row.id === id);
  if (item && action !== "remove") item.quantity += action === "plus" ? 1 : -1;
  cart = cart.filter(row => row.id !== id || (action !== "remove" && row.quantity > 0)); save(); renderTray();
}
function renderTray() { // fills the tray on menu.html and checkout.html, and the header count everywhere
  const markup = cart.length ? cart.map(item => `<div class="tray-row"><div><strong>${escapeHtml(item.name)}</strong><small>Quantity: ${item.quantity}</small>
    <div class="qty-controls"><button data-action="minus" data-id="${item.id}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-action="plus" data-id="${item.id}" aria-label="Increase quantity">+</button><button class="remove-btn" data-action="remove" data-id="${item.id}">Remove</button></div>
    </div><span class="tray-row-price">${money(item.price * item.quantity)}</span></div>`).join("") : EMPTY_TRAY;
  ["trayItems", "checkoutItems"].forEach(id => setHtml(id, markup));
  ["trayTotal", "checkoutTrayTotal", "checkoutTotal"].forEach(id => set(id, money(total())));
  ["trayItemCount", "checkoutCount"].forEach(id => set(id, `${count()} item${count() === 1 ? "" : "s"}`));
  set("headerCartCount", count()); if ($("goCheckout")) $("goCheckout").disabled = !cart.length;
  renderMenu();
}

// 5. ORDERS (same format as the staff pages: localStorage key "ece_orders")
const ORDERS_KEY = "ece_orders";
let allCafes = [];
const hm = d => String(d.getHours()).padStart(2, "0") + "h" + String(d.getMinutes()).padStart(2, "0");

async function renderOrders() {
  if (!$("currentOrder")) return; // only on my_orders.html
  const data = await loadData();
  const cafes = data ? data.cafeterias : [];
  const email = (read("ece_session", null) || {}).email;
  const isDemo = email === "alex.costa@edu.ece.fr";
  const mine = read(ORDERS_KEY, []).filter(o => o.userEmail === email);

  const current = [...mine].reverse().find(o => String(o.status).toLowerCase() !== "collected") || (isDemo && data ? data.demoOrder : null);
  const past = mine.filter(o => String(o.status).toLowerCase() === "collected").reverse().concat(isDemo && data ? (data.demoPastOrders || []) : []);

  if (current) {
    const v = orderView(current, cafes);
    $("currentOrder").innerHTML = `<article class="order-card">
      <div class="order-card__head"><h2>Your current order</h2><span>#${escapeHtml(v.id)} · ordered at ${escapeHtml(v.time)}</span><span class="order-card__total">${formatPrice(v.total)}</span></div>
      <p class="order-card__cafe">${escapeHtml(v.cafeteria)}${v.place ? " - " + escapeHtml(v.place) : ""}</p>
      <p class="order-card__items">${escapeHtml(v.items)}</p>
      ${v.pickup ? `<p class="order-card__items">Pickup: ${escapeHtml(v.pickup)}</p>` : ""}
      ${trackerHTML(v.status)}</article>`;
  } else {
    $("currentOrder").innerHTML = '<p class="empty-state">You have no current orders.</p>';
  }

  $("previousOrders").innerHTML = past.length ? past.map(o => {
    const v = orderView(o, cafes), img = o.image || (o.items && o.items[0] && o.items[0].image);
    return `<article class="previous-order">
      ${img ? `<img src="${BASE}${img}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : '<div class="previous-order-photo"></div>'}
      <div class="previous-order-info"><h3>${escapeHtml(v.cafeteria)} <span class="status-text">✓ Collected</span></h3>
        <p>${escapeHtml(v.items)}</p><small>${escapeHtml(v.place)}</small>
        <small>#${escapeHtml(v.id)} · ordered at ${escapeHtml(v.time)}${o.date ? ", " + escapeHtml(o.date) : ""}${o.collectedAt ? ", Collected at " + escapeHtml(o.collectedAt) : ""}</small></div>
      <div class="previous-order-price">${formatPrice(v.total)}</div></article>`;
  }).join("") : '<p class="empty-state">Your previous orders will appear here.</p>';
}

function createOrder() {
  const session = read("ece_session", null) || {};
  const first = cart[0], cafe = allCafes.find(c => c.id === first.cafeteriaId), now = new Date();
  const list = read(ORDERS_KEY, []);
  const next = Math.max(2849, ...list.map(o => parseInt(String(o.id).replace(/\D/g, ""), 10) || 0)) + 1;
  const pickup = selectedTime === "ASAP" ? hm(new Date(now.getTime() + ((cafe && cafe.wait) || 10) * 60000)) : selectedTime.replace(":", "h");
  const order = {
    id: "ECE-" + next, userEmail: session.email || "", student: session.name || "Student",
    track: session.email === "alex.costa@edu.ece.fr" ? "ING4 cybersecurity" : "ECE Paris",
    cafeteriaId: first.cafeteriaId, cafeteria: cafe ? cafe.name : "Le CROUS Express", place: cafe ? cafe.location : "",
    items: cart.map(i => ({ name: i.name, qty: i.quantity, price: i.price, image: i.image })),
    total: total(), orderedAt: hm(now), date: now.toLocaleDateString("en-GB"),
    pickupTime: pickup, payment: selectedPayment, status: "Confirmed", collectedAt: null
  };
  list.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  cart = []; save(); renderTray();
  $("confirmationDetails").innerHTML = `<strong>Order #${order.id}</strong><br>${escapeHtml(order.cafeteria)}<br>Pickup time: ${escapeHtml(order.pickupTime)}<br>Total: ${money(order.total)}<br>Payment: ${PAYMENT_LABELS[order.payment]}`;
  $("confirmationDialog").showModal();
}
window.addEventListener("storage", e => { if (e.key === ORDERS_KEY) renderOrders(); });  // staff changes a status in another tab
// 6. EVENTS
function pick(selector, activeClass, onPick) { // one-choice-at-a-time buttons
  $$(selector).forEach(el => el.addEventListener("click", () => { onPick(el); $$(selector).forEach(b => b.classList.toggle(activeClass, b === el)); }));
}
function setupEvents() {
  
  on("goCheckout", "click", () => go("checkout.html"));
 
  on("menuGroups", "click", event => {
  const add = event.target.closest(".add-btn");
  if (add) return addToCart(Number(add.dataset.id));
  if (event.target.closest("[data-action]")) trayAction(event);   // − / + on the cards
  });
  on("trayItems", "click", trayAction); on("checkoutItems", "click", trayAction);
 
  pick(".time-slot", "selected", button => { selectedTime = button.dataset.time; });
  pick(".payment-option", "selected", label => { selectedPayment = label.querySelector("input").value; });
  on("confirmOrder", "click", () => {
    $("checkoutError").textContent = cart.length ? "" : "Your tray is empty. Please add food before checkout.";
    if (cart.length) selectedPayment === "card" ? $("cardDialog").showModal() : createOrder();
  });
  on("cardForm", "submit", event => {
    event.preventDefault();
    if ($("cardNumber").value.replace(/\s/g, "").length < 12) return showToast("Please enter a valid demo card number.");
    $("cardDialog").close(); createOrder();
  });
  on("cardNumber", "input", event => { event.target.value = event.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "); });
  on("viewMyOrders", "click", () => go("my_orders.html"));
  const session = read("ece_session", null);   // checkout: show the logged-in student
    if (session) {
      const saved = read("ece_users", []).find(u => u.email === session.email);
      const isAlex = session.email === "alex.costa@edu.ece.fr";
      set("studentName", session.name);
      set("studentInfo", isAlex ? "Promo 2026 · ING4 Cybersecurity" : "Promo 2026");
      const phone = (saved && saved.phone) || (isAlex ? "+33 6 89 52 02 69" : "");
      set("studentPhone", phone ? "SMS: " + phone : "SMS: not provided");
      set("studentEmail", "Email: " + session.email);
    }
  }
setupEvents(); renderTray(); renderOrders();
if ($("menuGroups")) initMenuPage();

async function initMenuPage() {
  const data = await loadData();
  if (!data) { setHtml("menuGroups", '<p class="empty-state">Could not load the menu.</p>'); return; }
  const id = Number(new URLSearchParams(location.search).get("cafe")) || 1;
  cafeteria = data.cafeterias.find(c => c.id === id) || data.cafeterias[0];
  products = data.dishes.filter(d => d.cafeteriaId === cafeteria.id);

  document.title = "ECE Eats | " + cafeteria.name;
  set("cafeName", cafeteria.name); set("crumbName", cafeteria.name);
  set("cafeLocation", cafeteria.location); set("cafeDesc", cafeteria.description);
  set("badgeOpen", cafeteria.open ? "Open now" : "Closed");
  set("badgeCampus", "Campus " + cafeteria.campus);
  set("badgeWait", `${cafeteria.wait} minute wait · ${{low:"Low", medium:"Medium", high:"High"}[cafeteria.crowd]} crowd`);

  const categories = [...new Set(products.map(p => p.category))];
  setHtml("categoryBar", [["All", "All meals"], ...categories.map(c => [c, c])]
    .map(([value, label], i) => `<button type="button" class="category${i === 0 ? " active" : ""}" data-category="${escapeHtml(value)}">${escapeHtml(label)}</button>`).join(""));
  $("categoryBar").addEventListener("click", event => {
    const button = event.target.closest(".category");
    if (!button) return;
    selectedCategory = button.dataset.category;
    $$(".category").forEach(b => b.classList.toggle("active", b === button));
    renderMenu();
  });
  renderMenu();
}

if ($("confirmOrder")) initCheckoutPage();

async function initCheckoutPage() {
  const data = await loadData();
  allCafes = data ? data.cafeterias : [];
  const first = cart[0];
  if (data && first) {
    const cafe = data.cafeterias.find(c => c.id === first.cafeteriaId);
    if (cafe) { set("pickupName", cafe.name); set("pickupPlace", cafe.location); set("crumbCafe", cafe.name); }
  }
  set("payTotal", money(total()));
}
