// ===================================================
// favorites.js — ЛР7: Страница «Избранное»
// ===================================================

const BASE_URL = 'http://localhost:3000';

const grid     = document.getElementById('favorites-grid');
const noRes    = document.getElementById('no-results');
const loadEl   = document.getElementById('loading');

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

async function loadFavorites() {
  loadEl.classList.remove('hidden');
  grid.innerHTML = '';
  try {
    const res  = await fetch(`${BASE_URL}/favorites`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    loadEl.classList.add('hidden');

    if (data.length === 0) { noRes.classList.remove('hidden'); return; }
    noRes.classList.add('hidden');

    // Получаем ID уже в корзине
    let cartIds = [];
    try {
      const cR = await fetch(`${BASE_URL}/cart`);
      cartIds = (await cR.json()).map(c => c.serviceId);
    } catch (_) {}

    grid.innerHTML = data.map(item => {
      const inCart = cartIds.includes(item.serviceId);
      return `
      <article class="catalog-card">
        <img src="${item.image}" alt="${item.name}" class="catalog-card__img" loading="lazy">
        <div class="catalog-card__body">
          <span class="catalog-card__category">${item.category}</span>
          <h3 class="catalog-card__name">${item.name}</h3>
          <p class="catalog-card__desc">${item.description}</p>
          <div class="catalog-card__meta">
            <span>⏱ ${item.duration || '—'}</span>
            <span>💬 ${item.reviews || 0} отзывов</span>
          </div>
          <div class="catalog-card__footer">
            <span class="catalog-card__price">${item.price.toLocaleString()} ₽</span>
            <span class="catalog-card__rating">★ ${item.rating}</span>
          </div>
          <div class="catalog-card__actions">
            <button class="card-btn card-btn--cart ${inCart ? 'active' : ''}" data-sid="${item.serviceId}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              ${inCart ? 'В корзине' : 'В корзину'}
            </button>
            <button class="card-btn card-btn--remove" data-fid="${item.id}">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Удалить
            </button>
          </div>
        </div>
      </article>`;
    }).join('');

    // Обработчики
    grid.querySelectorAll('.card-btn--remove').forEach(btn =>
      btn.addEventListener('click', () => removeFavorite(btn.dataset.fid)));
    grid.querySelectorAll('.card-btn--cart').forEach(btn =>
      btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.sid))));

  } catch (_) {
    loadEl.classList.add('hidden');
    grid.innerHTML = `<p class="catalog__error">❌ Не удалось подключиться к JSON Server.<br>
      Запустите: <code>npx json-server --watch db.json --port 3000</code></p>`;
  }
}

async function removeFavorite(favId) {
  await fetch(`${BASE_URL}/favorites/${favId}`, { method: 'DELETE' });
  showToast('Удалено из избранного', 'info');
  updateBadges();
  loadFavorites();
}

async function addToCart(serviceId) {
  try {
    const res = await fetch(`${BASE_URL}/cart?serviceId=${serviceId}`);
    const existing = await res.json();
    if (existing.length > 0) { showToast('Уже в корзине', 'info'); return; }
    const svc = await (await fetch(`${BASE_URL}/services/${serviceId}`)).json();
    await fetch(`${BASE_URL}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, quantity: 1, ...svc })
    });
    showToast('Добавлено в корзину 🛒');
    updateBadges();
    loadFavorites();
  } catch (_) {}
}

loadFavorites();
updateBadges();
