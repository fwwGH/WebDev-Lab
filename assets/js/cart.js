// ===================================================
// cart.js — ЛР7: Страница «Корзина»
// ===================================================

const BASE_URL = 'http://localhost:3000';

const cartContent  = document.getElementById('cart-content');
const cartList     = document.getElementById('cart-list');
const noRes        = document.getElementById('no-results');
const loadEl       = document.getElementById('loading');
const totalEl      = document.getElementById('cart-total');
const countEl      = document.getElementById('cart-item-count');
const checkoutBtn  = document.getElementById('checkout-btn');

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast toast--${type}`;
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

async function updateBadges() {
  try {
    const [fR, cR] = await Promise.all([fetch(`${BASE_URL}/favorites`), fetch(`${BASE_URL}/cart`)]);
    const favs  = await fR.json();
    const carts = await cR.json();
    const fh = document.getElementById('fav-count-header');
    const ch = document.getElementById('cart-count-header');
    if (fh) { fh.textContent = favs.length; fh.classList.toggle('hidden', favs.length === 0); }
    if (ch) { ch.textContent = carts.length; ch.classList.toggle('hidden', carts.length === 0); }
  } catch (_) {}
}

async function loadCart() {
  loadEl.classList.remove('hidden');
  cartContent.classList.add('hidden');
  noRes.classList.add('hidden');
  cartList.innerHTML = '';

  try {
    const res  = await fetch(`${BASE_URL}/cart`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    loadEl.classList.add('hidden');

    if (data.length === 0) { noRes.classList.remove('hidden'); return; }

    cartContent.classList.remove('hidden');

    cartList.innerHTML = data.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item__img">
        <div class="cart-item__info">
          <span class="catalog-card__category">${item.category}</span>
          <h3 class="cart-item__name">${item.name}</h3>
          <p class="cart-item__desc">${item.description}</p>
        </div>
        <div class="cart-item__controls">
          <div class="qty-control">
            <button class="qty-btn qty-btn--minus" data-id="${item.id}">−</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn qty-btn--plus" data-id="${item.id}">+</button>
          </div>
          <span class="cart-item__price">${(item.price * item.quantity).toLocaleString()} ₽</span>
          <button class="card-btn card-btn--remove" data-id="${item.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
            Удалить
          </button>
        </div>
      </div>
    `).join('');

    // Подсчёт итога
    const totalQty   = data.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = data.reduce((s, i) => s + i.price * i.quantity, 0);
    countEl.textContent = totalQty;
    totalEl.textContent = `${totalPrice.toLocaleString()} ₽`;

    // Обработчики
    cartList.querySelectorAll('.qty-btn--minus').forEach(btn =>
      btn.addEventListener('click', () => changeQty(btn.dataset.id, -1)));
    cartList.querySelectorAll('.qty-btn--plus').forEach(btn =>
      btn.addEventListener('click', () => changeQty(btn.dataset.id, +1)));
    cartList.querySelectorAll('.card-btn--remove').forEach(btn =>
      btn.addEventListener('click', () => removeItem(btn.dataset.id)));

  } catch (_) {
    loadEl.classList.add('hidden');
    cartList.innerHTML = `<p class="catalog__error">❌ Не удалось подключиться к JSON Server.<br>
      Запустите: <code>npx json-server --watch db.json --port 3000</code></p>`;
    cartContent.classList.remove('hidden');
  }
}

async function changeQty(cartId, delta) {
  const res  = await fetch(`${BASE_URL}/cart/${cartId}`);
  const item = await res.json();
  const newQty = Math.max(1, item.quantity + delta);
  await fetch(`${BASE_URL}/cart/${cartId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: newQty })
  });
  updateBadges();
  loadCart();
}

async function removeItem(cartId) {
  await fetch(`${BASE_URL}/cart/${cartId}`, { method: 'DELETE' });
  showToast('Удалено из корзины', 'info');
  updateBadges();
  loadCart();
}

checkoutBtn && checkoutBtn.addEventListener('click', async () => {
  try {
    const res  = await fetch(`${BASE_URL}/cart`);
    const data = await res.json();
    // Удаляем все позиции
    await Promise.all(data.map(item =>
      fetch(`${BASE_URL}/cart/${item.id}`, { method: 'DELETE' })
    ));
    showToast('✅ Заказ успешно оформлен! Спасибо за покупку.');
    updateBadges();
    loadCart();
  } catch (_) {
    showToast('Ошибка при оформлении заказа', 'error');
  }
});

loadCart();
updateBadges();
