// ===== ECE EATS · Student flow =====
// 1. DATA & STATE (cart and orders are saved in localStorage)
const PRODUCTS = [
  {id:1, name:"Chicken & Mozzarella Panini", category:"Paninis", description:"Grilled chicken, mozzarella, tomatoes and pesto.", price:4.50, tags:["Halal"], available:true, image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700"},
  {id:2, name:"Ham & Cheese Panini", category:"Paninis", description:"Ham, Emmental cheese and butter.", price:4.50, tags:[], available:true, image:"https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=700"},
  {id:3, name:"Mediterranean Vegetarian Salad", category:"Salads", description:"Quinoa, chickpeas, cucumber, cherry tomatoes and feta.", price:6.50, tags:["Vegetarian"], available:true, image:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700"},
  {id:4, name:"Chicken Caesar Salad", category:"Salads", description:"Grilled chicken, lettuce, parmesan, croutons and Caesar dressing.", price:6.50, tags:["Halal"], available:true, image:"https://images.unsplash.com/photo-1546793665-c74683f339c1?w=700"},
  {id:5, name:"Salmon Poke Bowl", category:"Poke bowls", description:"Salmon, rice, avocado and fresh vegetables.", price:8.50, tags:[], available:true, image:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700"},
  {id:6, name:"Fresh Orange Juice", category:"Drinks", description:"Freshly squeezed orange juice.", price:2.50, tags:["Vegetarian"], available:false, image:"https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=700"}
];
const STORAGE_CART = "eceEatsStudentCart", STORAGE_ORDERS = "eceEatsStudentOrders", STORAGE_STUDENT = "eceEatsStudentProfile", PAYMENT_LABELS = {card:"Bank card (demo)", wallet:"Apple Pay / Google Pay (demo)", pickup:"Pay at pickup"};
const EMPTY_TRAY = '<p class="empty-state">Your tray is empty. Add something delicious!</p>';
const $ = id => document.getElementById(id), $$ = selector => document.querySelectorAll(selector);
const on = (id, type, fn) => $(id)?.addEventListener(type, fn), go = page => { location.href = page; }, read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
let cart = read(STORAGE_CART, []), orders = read(STORAGE_ORDERS, []), selectedCategory = "All", selectedTime = "ASAP", selectedPayment = "card", toastTimer;
// 2. HELPERS
const save = () => { localStorage.setItem(STORAGE_CART, JSON.stringify(cart)); localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders)); };
const money = value => "€" + Number(value).toFixed(2).replace(".", ",");
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
  if (!$("menuGroups")) return; // only on menu.html
  const search = $("searchInput").value.trim().toLowerCase();
  const filtered = PRODUCTS.filter(p => (selectedCategory === "All" || p.category === selectedCategory) && (p.name + p.description).toLowerCase().includes(search));
  const categories = selectedCategory === "All" ? ["Paninis", "Salads", "Poke bowls", "Drinks"] : [selectedCategory];
  $("menuGroups").innerHTML = categories.map(category => {
    const items = filtered.filter(p => p.category === category);
    return items.length ? `<section class="menu-group"><h2>${category}</h2><div class="food-grid">${items.map(productCard).join("")}</div></section>` : "";
  }).join("") || '<p class="empty-state">No food matches your search.</p>';
}
function productCard(p) {
  const tags = p.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const action = p.available ? `<button class="add-btn" data-id="${p.id}">＋ Add</button>` : '<span class="stock-label">Out of stock</span>';
  return `<article class="food-card ${p.available ? "" : "unavailable"}"><img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='images/dishes.png'">
    <div class="food-content"><div class="food-title-row"><h3>${escapeHtml(p.name)}</h3></div><p class="food-description">${escapeHtml(p.description)}</p>
    <div class="tags">${tags}</div><div class="food-bottom"><span class="price">${money(p.price)}</span>${action}</div></div></article>`;
}
// 4. TRAY (add, + / − steppers, remove, automatic total)
function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id), existing = cart.find(item => item.id === id);
  if (!product || !product.available) return;
  if (existing) existing.quantity++; else cart.push({...product, quantity:1});
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
}
// 5. ORDERS (current order with progress + previous orders)
function renderProgress(status) {
  const steps = ["Confirmed", "Cooking", "Ready", "Collected"], active = Math.max(0, steps.indexOf(status));
  return `<div class="progress-track">${steps.map((step, i) => `<div class="progress-step ${i <= active ? "done" : ""} ${i === active ? "active" : ""}"><div class="dot">${i < active ? "✓" : i + 1}</div>${step}</div>`).join("")}</div>`;
}
function renderOrders() {
  if (!$("currentOrder")) return; // only on myorders.html
  const current = orders.find(order => order.status !== "Collected"), previous = orders.filter(order => order.status === "Collected");
  $("currentOrder").innerHTML = current ? `<article class="order-card"><div class="order-card-top"><strong>Your current order　#${current.number} · ordered at ${current.orderedAt}</strong><strong>${money(current.total)}</strong></div>
    <p class="order-items-text">${escapeHtml(current.cafeteria)} · ${itemsText(current.items)}</p><p class="order-items-text">Pickup: ${escapeHtml(current.pickup)}</p>${renderProgress(current.status)}</article>` : '<p class="empty-state">You have no current orders.</p>';
  $("previousOrders").innerHTML = previous.length ? previous.map(order => `<article class="previous-order"><img src="${order.items[0]?.image || "images/dishes.png"}" alt="Order food">
    <div class="previous-order-info"><strong>Le CROUS Express　<span class="status-text">● Collected</span></strong><p>${itemsText(order.items)}</p><small>#ece-${order.number} · ${escapeHtml(order.dateLabel)}</small></div>
    <div class="previous-order-price">${money(order.total)}</div></article>`).join("") : '<p class="empty-state">Your previous orders will appear here.</p>';
}
function createOrder() {
  const order = {number:String(Date.now()).slice(-6), items:cart.map(item => ({...item})), total:total(), pickup:selectedTime, payment:selectedPayment, status:"Confirmed",
    orderedAt:new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}), dateLabel:new Date().toLocaleDateString(), cafeteria:"Le CROUS Express"};
  orders.unshift(order); cart = []; save(); renderTray();
  $("confirmationDetails").innerHTML = `<strong>Order #${order.number}</strong><br>Le CROUS Express<br>Pickup time: ${escapeHtml(order.pickup)}<br>Total: ${money(order.total)}<br>Payment: ${PAYMENT_LABELS[order.payment]}`;
  $("confirmationDialog").showModal();
}
// 6. EVENTS
function pick(selector, activeClass, onPick) { // one-choice-at-a-time buttons
  $$(selector).forEach(el => el.addEventListener("click", () => { onPick(el); $$(selector).forEach(b => b.classList.toggle(activeClass, b === el)); }));
}
function setupEvents() {
  on("trayShortcut", "click", () => $("trayPanel") ? $("trayPanel").scrollIntoView({behavior:"smooth", block:"center"}) : go("menu.html"));
  on("goCheckout", "click", () => go("checkout.html"));
  on("searchInput", "input", renderMenu);
  on("menuGroups", "click", event => { const button = event.target.closest(".add-btn"); if (button) addToCart(Number(button.dataset.id)); });
  on("trayItems", "click", trayAction); on("checkoutItems", "click", trayAction);
  pick(".category", "active", button => { selectedCategory = button.dataset.category; renderMenu(); });
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
  on("viewMyOrders", "click", () => go("myorders.html"));
  on("registerForm", "submit", event => { // register.html: keep the student profile in localStorage
    event.preventDefault(); localStorage.setItem(STORAGE_STUDENT, JSON.stringify(Object.fromEntries(new FormData(event.target)))); go("menu.html");
  });
  const student = read(STORAGE_STUDENT, null); // checkout.html: show the registered student
  if (student) { set("studentName", student.name); set("studentInfo", student.promo); set("studentPhone", "SMS: " + student.phone); set("studentEmail", "Email: " + student.email); }
}
setupEvents(); renderMenu(); renderTray(); renderOrders();
