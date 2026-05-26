// ===================================================
// catalog.js — ЛР7: JSON Server + Fetch API
// ===================================================

const BASE_URL = 'http://localhost:3000';
const ITEMS_PER_PAGE = 6;

// DOM-элементы
const grid         = document.getElementById('catalog-grid');
const noResults    = document.getElementById('no-results');
const loadingEl    = document.getElementById('loading');
const searchInput  = document.getElementById('search-input');
const sortSelect   = document.getElementById('sort-select');
const catContainer = document.getElementById('category-filters');
const pagination   = document.getElementById('pagination');
const methodBtns   = document.querySelectorAll('.method-btn');
const resetBtn     = document.getElementById('reset-btn');
const applyAdvBtn  = document.getElementById('apply-advanced-btn');
const resetAdvBtn  = document.getElementById('reset-advanced-btn');

// Состояние фильтров
let state = {
  search: '', category: '', sort: '', order: '',
  priceMin: '', priceMax: '', ratingMin: '', ratingMax: '',
  page: 1,
  overrideData: null
};

// ===================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===================================================

function showLoading()  { loadingEl.classList.remove('hidden'); }
function hideLoading()  { loadingEl.classList.add('hidden'); }
function showNoResults(){ noResults.classList.remove('hidden'); }
function hideNoResults(){ noResults.classList.add('hidden'); }

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast toast--${type}`;
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

async function updateBadges() {
  try {
    const [favRes, cartRes] = await Promise.all([
      fetch(`${BASE_URL}/favorites`),
      fetch(`${BASE_URL}/cart`)
    ]);
    const favs  = await favRes.json();
    const carts = await cartRes.json();
    const fh = document.getElementById('fav-count-header');
    const ch = document.getElementById('cart-count-header');
    if (fh) { fh.textContent = favs.length; fh.classList.toggle('hidden', favs.length === 0); }
    if (ch) { ch.textContent = carts.length; ch.classList.toggle('hidden', carts.length === 0); }
  } catch (_) {}
}

// ===================================================
// СБОРКА URL ЗАПРОСА К JSON SERVER
// ===================================================
function buildURL() {
  const params = new URLSearchParams();
  if (state.search.trim())   params.set('q', state.search.trim());
  if (state.category)        params.set('category', state.category);
  if (state.sort)            { params.set('_sort', state.sort); params.set('_order', state.order || 'asc'); }
  if (state.priceMin !== '') params.set('price_gte', state.priceMin);
  if (state.priceMax !== '') params.set('price_lte', state.priceMax);
  if (state.ratingMin !== '') params.set('rating_gte', state.ratingMin);
  if (state.ratingMax !== '') params.set('rating_lte', state.ratingMax);
  params.set('_page', state.page);
  params.set('_limit', ITEMS_PER_PAGE);
  return `${BASE_URL}/services?${params.toString()}`;
}

// ===================================================
// ГЛАВНАЯ ФУНКЦИЯ ЗАГРУЗКИ
// ===================================================
async function loadAndRender() {
  if (state.overrideData) {
    renderCards(state.overrideData);
    pagination.innerHTML = '';
    return;
  }
  showLoading();
  hideNoResults();
  grid.innerHTML = '';
  pagination.innerHTML = '';
  try {
    const response = await fetch(buildURL());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const total = parseInt(response.headers.get('X-Total-Count') || '0', 10);
    const data  = await response.json();
    hideLoading();
    renderCards(data);
    renderPagination(total);
  } catch (err) {
    hideLoading();
    grid.innerHTML = `<p class="catalog__error">
      ❌ Не удалось подключиться к JSON Server.<br>
      Запустите: <code>npx json-server --watch db.json --port 3000</code>
    </p>`;
  }
}

// ===================================================
// РЕНДЕР КАРТОЧЕК
// ===================================================
async function renderCards(data) {
  if (!data || data.length === 0) { showNoResults(); return; }
  hideNoResults();
  let favIds = [], cartIds = [];
  try {
    const [fR, cR] = await Promise.all([
      fetch(`${BASE_URL}/favorites`),
      fetch(`${BASE_URL}/cart`)
    ]);
    favIds  = (await fR.json()).map(f => f.serviceId);
    cartIds = (await cR.json()).map(c => c.serviceId);
  } catch (_) {}

  grid.innerHTML = data.map(item => {
    const inFav  = favIds.includes(item.id);
    const inCart = cartIds.includes(item.id);
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
          <button class="card-btn card-btn--fav ${inFav ? 'active' : ''}" data-id="${item.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${inFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            ${inFav ? 'В избранном' : 'Избранное'}
          </button>
          <button class="card-btn card-btn--cart ${inCart ? 'active' : ''}" data-id="${item.id}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            ${inCart ? 'В корзине' : 'В корзину'}
          </button>
        </div>
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('.card-btn--fav').forEach(btn =>
    btn.addEventListener('click', () => toggleFavorite(parseInt(btn.dataset.id))));
  grid.querySelectorAll('.card-btn--cart').forEach(btn =>
    btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id))));
}

// ===================================================
// ПАГИНАЦИЯ
// ===================================================
function renderPagination(total) {
  const pages = Math.ceil(total / ITEMS_PER_PAGE);
  if (pages <= 1) { pagination.innerHTML = ''; return; }
  pagination.innerHTML = Array.from({ length: pages }, (_, i) =>
    `<button class="page-btn ${i + 1 === state.page ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`
  ).join('');
  pagination.querySelectorAll('.page-btn').forEach(btn =>
    btn.addEventListener('click', () => { state.page = parseInt(btn.dataset.page); loadAndRender(); }));
}

// ===================================================
// КАТЕГОРИИ (Set)
// ===================================================
async function initCategories() {
  try {
    const res = await fetch(`${BASE_URL}/services`);
    const all = await res.json();
    const cats = new Set(all.map(s => s.category));
    catContainer.innerHTML =
      `<button class="category-btn active" data-cat="">Все</button>` +
      [...cats].map(c => `<button class="category-btn" data-cat="${c}">${c}</button>`).join('');
    catContainer.addEventListener('click', e => {
      if (!e.target.classList.contains('category-btn')) return;
      catContainer.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.category = e.target.dataset.cat;
      state.page = 1; state.overrideData = null;
      loadAndRender();
    });
  } catch (_) {}
}

// ===================================================
// ИЗБРАННОЕ
// ===================================================
async function toggleFavorite(serviceId) {
  try {
    const res = await fetch(`${BASE_URL}/favorites?serviceId=${serviceId}`);
    const existing = await res.json();
    if (existing.length > 0) {
      await fetch(`${BASE_URL}/favorites/${existing[0].id}`, { method: 'DELETE' });
      showToast('Удалено из избранного', 'info');
    } else {
      const svc = await (await fetch(`${BASE_URL}/services/${serviceId}`)).json();
      await fetch(`${BASE_URL}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, ...svc })
      });
      showToast('Добавлено в избранное ♥');
    }
    updateBadges();
    loadAndRender();
  } catch (_) { showToast('Ошибка соединения с сервером', 'error'); }
}

// ===================================================
// КОРЗИНА
// ===================================================
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
    loadAndRender();
  } catch (_) { showToast('Ошибка соединения с сервером', 'error'); }
}

// ===================================================
// КНОПКИ МЕТОДОВ МАССИВА (ЛР6)
// ===================================================
const LOCAL_PRODUCTS = [
  { id:1,  name:"Logo Design Pro",    category:"Branding",    price:4500,  rating:4.8, description:"Разработка уникального логотипа с 3 концептами.",               image:"./assets/img/logodesignpro.png",    duration:"3-5 дней",    reviews:142 },
  { id:2,  name:"Brand Identity Pack",category:"Branding",    price:12000, rating:4.9, description:"Полный фирменный стиль: цвета, шрифты, гайдлайн.",               image:"./assets/img/brandidentitypack.png",duration:"10-14 дней",  reviews:87  },
  { id:3,  name:"SEO Audit",          category:"Marketing",   price:3500,  rating:4.5, description:"Глубокий аудит сайта и рекомендации по продвижению.",             image:"./assets/img/SEOaudit.png",         duration:"3-5 дней",    reviews:203 },
  { id:4,  name:"SMM Strategy",       category:"Marketing",   price:6000,  rating:4.7, description:"Стратегия ведения социальных сетей на 3 месяца.",                 image:"./assets/img/SMMstrategy.png",      duration:"5-7 дней",    reviews:95  },
  { id:5,  name:"Landing Page Dev",   category:"Development", price:15000, rating:4.9, description:"Адаптивная посадочная страница с анимациями.",                    image:"./assets/img/LandingPageDev.png",   duration:"7-10 дней",   reviews:118 },
  { id:6,  name:"E-commerce Setup",   category:"Development", price:25000, rating:4.8, description:"Настройка интернет-магазина под ключ.",                           image:"./assets/img/Ecommerce.png",        duration:"21-30 дней",  reviews:62  },
  { id:7,  name:"UI/UX Audit",        category:"Design",      price:5500,  rating:4.6, description:"Анализ удобства интерфейса и карта улучшений.",                   image:"./assets/img/UI_UX.png",            duration:"4-6 дней",    reviews:74  },
  { id:8,  name:"Mobile App UI",      category:"Design",      price:18000, rating:4.9, description:"Дизайн интерфейса мобильного приложения (iOS/Android).",          image:"./assets/img/MobileAppUI.png",      duration:"10-14 дней",  reviews:39  },
  { id:9,  name:"Content Marketing",  category:"Marketing",   price:7000,  rating:4.4, description:"Создание контент-плана и написание статей.",                      image:"./assets/img/ContentMarketing.png", duration:"Ежемесячно",  reviews:81  },
  { id:10, name:"Video Promo",        category:"Media",       price:9000,  rating:4.7, description:"Создание рекламного ролика до 30 секунд.",                        image:"./assets/img/VideoPromo.png",       duration:"7-10 дней",   reviews:55  },
  { id:11, name:"Email Campaign",     category:"Marketing",   price:4000,  rating:4.3, description:"Настройка email-рассылки и шаблонов писем.",                     image:"./assets/img/EmailCampaign.png",    duration:"3-5 дней",    reviews:109 },
  { id:12, name:"Web App MVP",        category:"Development", price:35000, rating:5.0, description:"Разработка минимально жизнеспособного веб-продукта.",             image:"./assets/img/WebAppMVP.png",        duration:"21-30 дней",  reviews:44  },
  { id:13, name:"Illustration Set",   category:"Design",      price:6500,  rating:4.8, description:"Пакет из 10 уникальных иллюстраций для сайта.",                  image:"./assets/img/IllustrationSet.png",  duration:"5-8 дней",    reviews:31  },
  { id:14, name:"PPC Management",     category:"Marketing",   price:8000,  rating:4.5, description:"Настройка и ведение контекстной рекламы.",                       image:"./assets/img/PPCManagement.png",    duration:"Ежемесячно",  reviews:67  },
  { id:15, name:"Technical Support",  category:"Development", price:5000,  rating:4.6, description:"Ежемесячная техподдержка и обновление сайта.",                   image:"./assets/img/TechnicalSupport.png", duration:"Ежемесячно",  reviews:158 }
];

methodBtns.forEach(btn => {
  if (btn === resetBtn) return;
  btn.addEventListener('click', () => {
    const base = [...LOCAL_PRODUCTS];
    let result = [];
    switch (btn.dataset.method) {
      case 'filter':  result = base.filter(p => p.price > 5000); break;
      case 'map':     result = base.map(p => ({ ...p, name: `${p.name} [SALE]`, price: Math.round(p.price * 0.85) })); break;
      case 'sort':    result = [...base].sort((a, b) => b.rating - a.rating); break;
      case 'reverse': result = [...base].reverse(); break;
      case 'slice':   result = base.slice(0, 5); break;
      case 'concat':  result = base.concat([
        { id:99,  name:"Demo Service 1", category:"Test", price:1000, rating:5.0, description:"Добавлен через concat.", image:"./assets/img/image.png", duration:"—", reviews:0 },
        { id:100, name:"Demo Service 2", category:"Test", price:2000, rating:4.0, description:"Добавлен через concat.", image:"./assets/img/image.png", duration:"—", reviews:0 }
      ]); break;
      case 'reduce':  result = base.reduce((acc, p) => p.rating >= 4.8 ? [...acc, p] : acc, []); break;
      case 'splice':  { const s = [...base]; s.splice(0, 3); result = s; } break;
      case 'find':    { const f = base.find(p => p.name === "SEO Audit"); result = f ? [f] : []; } break;
      case 'flatMap': result = base.flatMap(p => p.price > 10000
        ? [p, { ...p, id: p.id + 1000, name: `${p.name} (Premium)`, price: Math.round(p.price * 1.2) }]
        : [p]); break;
    }
    state.overrideData = result;
    renderCards(result);
    pagination.innerHTML = '';
  });
});

// ===================================================
// СЛУШАТЕЛИ СОБЫТИЙ
// ===================================================
let searchTimer;
searchInput.addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = e.target.value; state.page = 1; state.overrideData = null;
    loadAndRender();
  }, 350);
});

sortSelect.addEventListener('change', e => {
  const val = e.target.value;
  if (!val) { state.sort = ''; state.order = ''; }
  else if (val === 'price_asc')  { state.sort = 'price';  state.order = 'asc'; }
  else if (val === 'price_desc') { state.sort = 'price';  state.order = 'desc'; }
  else if (val === 'rating_desc'){ state.sort = 'rating'; state.order = 'desc'; }
  else if (val === 'name_asc')   { state.sort = 'name';   state.order = 'asc'; }
  state.page = 1; state.overrideData = null;
  loadAndRender();
});

applyAdvBtn && applyAdvBtn.addEventListener('click', () => {
  state.priceMin  = document.getElementById('price-min').value;
  state.priceMax  = document.getElementById('price-max').value;
  state.ratingMin = document.getElementById('rating-min').value;
  state.ratingMax = document.getElementById('rating-max').value;
  state.page = 1; state.overrideData = null;
  loadAndRender();
});

resetAdvBtn && resetAdvBtn.addEventListener('click', () => {
  ['price-min','price-max','rating-min','rating-max'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  state.priceMin = state.priceMax = state.ratingMin = state.ratingMax = '';
  state.overrideData = null;
  loadAndRender();
});

resetBtn && resetBtn.addEventListener('click', () => {
  state = { search:'', category:'', sort:'', order:'', priceMin:'', priceMax:'', ratingMin:'', ratingMax:'', page:1, overrideData:null };
  searchInput.value = ''; sortSelect.value = '';
  ['price-min','price-max','rating-min','rating-max'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  catContainer.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  const allBtn = catContainer.querySelector('[data-cat=""]');
  if (allBtn) allBtn.classList.add('active');
  loadAndRender();
});

// ===================================================
// ИНИЦИАЛИЗАЦИЯ
// ===================================================
initCategories();
loadAndRender();
updateBadges();
