/* ==========================================================
   ENTRY pages JS (owner: A)
   Login and Register logic. The demo accounts below will move to
   data.json and api.js later: only this file needs to change.
   ========================================================== */

const CAMPUS_DOMAIN = "@edu.ece.fr";

const DEMO_USERS = [
  { name: "Alex Costa", email: "alex.costa@edu.ece.fr", password: "student123", role: "student" },
  { name: "Guillaume",  email: "guillaume@eceeats.fr",  password: "staff123",   role: "staff" }
];

const page = document.body.dataset.page;
if (page === "login") initLoginPage();
if (page === "register") initRegisterPage();

/* ---------- Page setup ---------- */
function initLoginPage() {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("forgot-link").addEventListener("click", (e) => {
    e.preventDefault();
    alert("Password reset is not available in this demo.");
  });
}

function initRegisterPage() {
  document.getElementById("register-form").addEventListener("submit", handleRegister);
}

/* ---------- Helpers ---------- */
function getUsers() {
  const registered = JSON.parse(localStorage.getItem("ece_users") || "[]");
  return [...DEMO_USERS, ...registered];
}

function setError(inputId, message) {
  const field = document.getElementById(inputId).closest(".field");
  field.classList.add("has-error");
  document.getElementById(inputId + "-error").textContent = message;
}

function clearErrors(form) {
  form.querySelectorAll(".field").forEach((f) => f.classList.remove("has-error"));
  form.querySelectorAll(".field__error").forEach((p) => (p.textContent = ""));
}

function saveSession(user) {
  localStorage.setItem("ece_session", JSON.stringify({ name: user.name, email: user.email, role: user.role }));
}

/* ---------- Login ---------- */
function handleLogin(e) {
  e.preventDefault();
  clearErrors(e.target);

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  let valid = true;

  if (!email) { setError("login-email", "Enter your email."); valid = false; }
  else if (!/^\S+@\S+\.\S+$/.test(email)) { setError("login-email", "Enter a valid email."); valid = false; }
  if (!password) { setError("login-password", "Enter your password."); valid = false; }
  if (!valid) return;

  const user = getUsers().find((u) => u.email === email && u.password === password);
  if (!user) { setError("login-password", "Email or password is incorrect."); return; }

  if (user.role !== "student") {
    setError("login-email", "This is a staff account. Use the staff access page.");
    return;
  }

  saveSession(user);
  window.location.href = "main/home.html";
}

/* ---------- Register ---------- */
function handleRegister(e) {
  e.preventDefault();
  clearErrors(e.target);

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const phone = document.getElementById("reg-phone").value.trim();
  const password = document.getElementById("reg-password").value;
  let valid = true;

  if (name.length < 2) { setError("reg-name", "Enter your full name."); valid = false; }
  if (!email.endsWith(CAMPUS_DOMAIN)) { setError("reg-email", "Use your university email (" + CAMPUS_DOMAIN + ")."); valid = false; }
  else if (getUsers().some((u) => u.email === email)) { setError("reg-email", "An account already exists with this email."); valid = false; }
  if (!/^[0-9 +().-]{8,}$/.test(phone)) { setError("reg-phone", "Enter a valid phone number."); valid = false; }
  if (password.length < 6) { setError("reg-password", "Use at least 6 characters."); valid = false; }
  if (!valid) return;

  const user = { name, email, phone, password, role: "student" };
  const registered = JSON.parse(localStorage.getItem("ece_users") || "[]");
  registered.push(user);
  localStorage.setItem("ece_users", JSON.stringify(registered));

  saveSession(user);
  window.location.href = "main/home.html";
}

/* ---------- Home + shared card renderers ---------- */
if (page === "home") initHome();

function imgStyle(path) { return path ? `style="background-image:url('${BASE}${path}')"` : ""; }

function renderMealCard(d, cafes) {
  const cafe = cafes.find((c) => c.id === d.cafeteriaId);
  return `
    <article class="meal-card">
      <div class="meal-card__photo" ${imgStyle(d.image)}></div>
      <div class="meal-card__body">
        <h3 class="meal-card__name">${d.name} - ${cafe.name}</h3>
        ${d.tags.map((t) => `<span class="chip">${t}</span>`).join("")}
        <div class="meal-card__foot">
          <span class="price">${formatPrice(d.price)}</span>
          <a class="add-btn" href="${BASE}student/menu.html?cafe=${d.cafeteriaId}" aria-label="Add ${d.name}">+</a>
        </div>
      </div>
    </article>`;
}


function renderCafeCard(c, withBadges) {
  const crowdLabel = { low: "Low", medium: "Medium", high: "High" }[c.crowd];
  const status = c.open ? `Open until ${c.openUntil}` : "Closed";
  return `
    <article class="cafe-card${c.open ? "" : " is-closed"}">
      <div class="cafe-card__photo" ${imgStyle(c.image)}>
        ${withBadges ? `<div class="cafe-card__badges">
            <span class="badge-pill">${status}</span><span class="badge-pill">${c.campus}</span></div>
          <span class="badge-pill cafe-card__wait">⏱ ${c.wait} minute wait</span>` : ""}
      </div>
      <div class="cafe-card__body">
        <div class="cafe-card__head"><h3>${c.name}</h3><span class="rating">★ ${c.rating} <small>(${c.reviews})</small></span></div>
        <p class="text-soft">${c.location}</p>
        <p class="cafe-card__desc">${c.description}</p>
        <div class="chips">${c.tags.map((t) => `<span class="chip">${t}</span>`).join("")}</div>
        <div class="cafe-card__foot">
          <div><small>Crowd level:</small><span class="crowd crowd--${c.crowd}">${crowdLabel} (${c.wait} min wait)</span></div>
          <a class="btn btn--primary" href="${BASE}student/menu.html?cafe=${c.id}"${c.open ? "" : ' aria-disabled="true" tabindex="-1"'}>Order here</a>
        </div>
      </div>
    </article>`;
}

async function initHome() {
  const data = await loadData();
  const session = getSession();
  if (session) document.getElementById("user-name").textContent = session.name.split(" ")[0];

  // Current order: latest active order saved by B, else the demo order
  const orders = getJSON("ece_orders", []);
  const active = [...orders].reverse().find((o) => o.status !== "collected");
  const demo = data.demoOrder;
  const order = active
    ? { id: active.id, cafeteriaId: active.cafeteriaId, time: active.time || "", items: active.itemsText || "", status: active.status }
    : demo;

  const cafe = data.cafeterias.find((c) => c.id === order.cafeteriaId);
  document.getElementById("order-meta").textContent = `#${order.id} · ordered at ${order.time}`;
  document.getElementById("order-cafe").textContent = cafe.name;
  document.getElementById("order-items").textContent = order.items;
  const steps = ["confirmed", "cooking", "ready", "collected"];
  const current = steps.indexOf(order.status);
  document.querySelectorAll("#tracker li").forEach((li, i) => {
    li.classList.toggle("is-done", i < current);
    li.classList.toggle("is-current", i === current);
  });
  document.getElementById("current-order").hidden = false;

  document.getElementById("popular").innerHTML =
    data.popularDishIds.map((id) => renderMealCard(data.dishes.find((d) => d.id === id), data.cafeterias)).join("");
  document.getElementById("nearby").innerHTML =
    data.cafeterias.slice(0, 3).map((c) => renderCafeCard(c, false)).join("");
}

/* ---------- Staff login ---------- */
if (page === "staff-login") initStaffLogin();

function initStaffLogin() {
  document.getElementById("staff-login-form").addEventListener("submit", handleStaffLogin);
  document.getElementById("staff-forgot").addEventListener("click", (e) => {
    e.preventDefault();
    alert("Password reset is not available in this demo.");
  });
}

function handleStaffLogin(e) {
  e.preventDefault();
  clearErrors(e.target);

  const email = document.getElementById("staff-email").value.trim().toLowerCase();
  const password = document.getElementById("staff-password").value;
  let valid = true;

  if (!email) { setError("staff-email", "Enter your staff ID or email."); valid = false; }
  if (!password) { setError("staff-password", "Enter your password."); valid = false; }
  if (!valid) return;

  const user = getUsers().find((u) => u.email === email && u.password === password);
  if (!user) { setError("staff-password", "ID or password is incorrect."); return; }
  if (user.role === "student") { setError("staff-email", "This is a student account. Use the student login."); return; }

  saveSession(user);
  window.location.href = user.role === "admin" ? "../staff/admin.html" : "../staff/dashboard.html";
}

/* ---------- Cafeterias page ---------- */
if (page === "cafeterias") initCafeterias();

async function initCafeterias() {
  const data = await loadData();
  const grid = document.getElementById("cafe-grid");
  const empty = document.getElementById("cafe-empty");
  const searchInput = document.getElementById("cafe-search");
  let campus = "all";

  // Search coming from the nav bar or from the Home category pills (?q=...)
  const q = new URLSearchParams(location.search).get("q");
  if (q) searchInput.value = q;

  function render() {
    const term = searchInput.value.trim().toLowerCase();
    const list = data.cafeterias.filter((c) => {
      const inCampus = campus === "all" || c.campus === campus;
      const text = [c.name, c.campus, c.location, c.description, ...c.tags].join(" ").toLowerCase();
      return inCampus && (!term || text.includes(term));
    });
    grid.innerHTML = list.map((c) => renderCafeCard(c, true)).join("");
    empty.classList.toggle("hidden", list.length > 0);
  }

  document.getElementById("campus-filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-pill");
    if (!btn) return;
    campus = btn.dataset.campus;
    document.querySelectorAll("#campus-filters .filter-pill").forEach((b) => b.classList.toggle("is-active", b === btn));
    render();
  });
  searchInput.addEventListener("input", render);
  render();
}