// ЭТАП 1: Массив из 15 объектов (≥6 полей, включая image)
const products = [
  { id: 1, name: "Logo Design Pro", category: "Branding", price: 4500, rating: 4.8, description: "Разработка уникального логотипа с 3 концептами.", image: "./assets/img/logodesignpro.png" },
  { id: 2, name: "Brand Identity Pack", category: "Branding", price: 12000, rating: 4.9, description: "Полный фирменный стиль: цвета, шрифты, гайдлайн.", image: "./assets/img/brandidentitypack.png" },
  { id: 3, name: "SEO Audit", category: "Marketing", price: 3500, rating: 4.5, description: "Глубокий аудит сайта и рекомендации по продвижению.", image: "./assets/img/SEOaudit.png" },
  { id: 4, name: "SMM Strategy", category: "Marketing", price: 6000, rating: 4.7, description: "Стратегия ведения социальных сетей на 3 месяца.", image: "./assets/img/SMMstrategy.png" },
  { id: 5, name: "Landing Page Dev", category: "Development", price: 15000, rating: 4.9, description: "Адаптивная посадочная страница с анимациями.", image: "./assets/img/LandingPageDev.png" },
  { id: 6, name: "E-commerce Setup", category: "Development", price: 25000, rating: 4.8, description: "Настройка интернет-магазина под ключ.", image: "./assets/img/Ecommerce.png" },
  { id: 7, name: "UI/UX Audit", category: "Design", price: 5500, rating: 4.6, description: "Анализ удобства интерфейса и карта улучшений.", image: "./assets/img/UI_UX.png" },
  { id: 8, name: "Mobile App UI", category: "Design", price: 18000, rating: 4.9, description: "Дизайн интерфейса мобильного приложения (iOS/Android).", image: "./assets/img/MobileAppUI.png" },
  { id: 9, name: "Content Marketing", category: "Marketing", price: 7000, rating: 4.4, description: "Создание контент-плана и написание статей.", image: "./assets/img/ContentMarketing.png" },
  { id: 10, name: "Video Promo", category: "Media", price: 9000, rating: 4.7, description: "Создание рекламного ролика до 30 секунд.", image: "./assets/img/VideoPromo.png" },
  { id: 11, name: "Email Campaign", category: "Marketing", price: 4000, rating: 4.3, description: "Настройка email-рассылки и шаблонов писем.", image: "./assets/img/EmailCampaign.png" },
  { id: 12, name: "Web App MVP", category: "Development", price: 35000, rating: 5.0, description: "Разработка минимально жизнеспособного веб-продукта.", image: "./assets/img/WebAppMVP.png" },
  { id: 13, name: "Illustration Set", category: "Design", price: 6500, rating: 4.8, description: "Пакет из 10 уникальных иллюстраций для сайта.", image: "./assets/img/IllustrationSet.png" },
  { id: 14, name: "PPC Management", category: "Marketing", price: 8000, rating: 4.5, description: "Настройка и ведение контекстной рекламы.", image: "./assets/img/PPCManagement.png" },
  { id: 15, name: "Technical Support", category: "Development", price: 5000, rating: 4.6, description: "Ежемесячная техподдержка и обновление сайта.", image: "./assets/img/TechnicalSupport.png" }
];

// DOM-элементы
const grid = document.getElementById('catalog-grid');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const categoryContainer = document.getElementById('category-filters');
const methodButtons = document.querySelectorAll('.method-btn');
const resetBtn = document.getElementById('reset-btn');

// Состояние фильтров
let state = {
  search: '',
  category: 'all',
  sort: 'default',
  overrideData: null // Для временного отображения результатов методов массива
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// Генерация HTML-карточки
function createCardHTML(item) {
  return `
    <article class="catalog-card">
      <img src="${item.image}" alt="${item.name}" class="catalog-card__img">
      <div class="catalog-card__body">
        <span class="catalog-card__category">${item.category}</span>
        <h3 class="catalog-card__name">${item.name}</h3>
        <p class="catalog-card__desc">${item.description}</p>
        <div class="catalog-card__footer">
          <span class="catalog-card__price">${item.price.toLocaleString()} ₽</span>
          <span class="catalog-card__rating">★ ${item.rating}</span>
        </div>
      </div>
    </article>
  `;
}

// Рендер каталога
function renderCatalog(data) {
  grid.innerHTML = '';
  if (data.length === 0) {
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');
  grid.innerHTML = data.map(createCardHTML).join('');
}

// Применение основных фильтров (Поиск + Категория + Сортировка)
function applyMainFilters() {
  let data = [...products];

  // 1. Фильтр по категории
  if (state.category !== 'all') {
    data = data.filter(p => p.category === state.category);
  }

  // 2. Поиск по названию или описанию
  if (state.search.trim() !== '') {
    const query = state.search.toLowerCase();
    data = data.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    );
  }

  // 3. Сортировка
  switch (state.sort) {
    case 'price-asc': data.sort((a, b) => a.price - b.price); break;
    case 'price-desc': data.sort((a, b) => b.price - a.price); break;
    case 'rating-desc': data.sort((a, b) => b.rating - a.rating); break;
    case 'name-asc': data.sort((a, b) => a.name.localeCompare(b.name)); break;
  }

  renderCatalog(data);
}

// === ЭТАП 3: Инициализация фильтров ===

// Генерация кнопок категорий
function initCategories() {
  const categories = ['all', ...new Set(products.map(p => p.category))];
  categoryContainer.innerHTML = categories.map(cat => `
    <button class="category-btn ${cat === 'all' ? 'active' : ''}" data-cat="${cat}">
      ${cat === 'all' ? 'Все' : cat}
    </button>
  `).join('');

  categoryContainer.addEventListener('click', e => {
    if (e.target.classList.contains('category-btn')) {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.category = e.target.dataset.cat;
      state.overrideData = null; // Сброс переопределения методов
      applyMainFilters();
    }
  });
}

// Обработчик поиска (динамическое обновление)
searchInput.addEventListener('input', e => {
  state.search = e.target.value;
  state.overrideData = null;
  applyMainFilters();
});

// Обработчик сортировки
sortSelect.addEventListener('change', e => {
  state.sort = e.target.value;
  state.overrideData = null;
  applyMainFilters();
});

// === ЭТАП 2: 10 Кнопок методов массива ===
methodButtons.forEach(btn => {
  if (btn === resetBtn) return;
  btn.addEventListener('click', () => {
    const method = btn.dataset.method;
    let result = [];
    const base = [...products]; // Работаем с копией, чтобы не мутировать оригинал

    switch (method) {
      case 'filter':
        // Оставляет элементы, удовлетворяющие условию
        result = base.filter(p => p.price > 5000);
        break;
      case 'map':
        // Преобразует каждый элемент (скидка 15%)
        result = base.map(p => ({ ...p, name: `${p.name} [SALE]`, price: Math.round(p.price * 0.85) }));
        break;
      case 'sort':
        // Сортирует массив (по рейтингу убывание)
        result = base.sort((a, b) => b.rating - a.rating);
        break;
      case 'reverse':
        // Переворачивает массив
        result = base.reverse();
        break;
      case 'slice':
        // Возвращает копию части массива (первые 5)
        result = base.slice(0, 5);
        break;
      case 'concat':
        // Объединяет массивы
        const extra = [
          { id: 99, name: "Demo Service 1", category: "Test", price: 1000, rating: 5.0, description: "Добавлен через concat.", image: "./assets/img/image-1.png" },
          { id: 100, name: "Demo Service 2", category: "Test", price: 2000, rating: 4.0, description: "Добавлен через concat.", image: "./assets/img/image-2.png" }
        ];
        result = base.concat(extra);
        break;
      case 'reduce':
        // Аккумуляция в новый массив (фильтрация рейтинга ≥ 4.8)
        result = base.reduce((acc, item) => item.rating >= 4.8 ? [...acc, item] : acc, []);
        break;
      case 'splice':
        // Изменяет массив (удаляет первые 3 элемента)
        const spliced = [...base];
        spliced.splice(0, 3);
        result = spliced;
        break;
      case 'find':
        // Возвращает первый подходящий элемент (оборачиваем в массив для рендера)
        const found = base.find(p => p.name === "SEO Audit");
        result = found ? [found] : [];
        break;
      case 'flatMap':
        // Преобразует и выравнивает на 1 уровень (дублируем дорогие услуги как Premium)
        result = base.flatMap(p => p.price > 10000 ? [p, { ...p, name: `${p.name} (Premium)`, price: p.price * 1.2 }] : [p]);
        break;
    }

    renderCatalog(result);
  });
});

// Кнопка сброса
resetBtn.addEventListener('click', () => {
  state = { search: '', category: 'all', sort: 'default', overrideData: null };
  searchInput.value = '';
  sortSelect.value = 'default';
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.category-btn[data-cat="all"]').classList.add('active');
  applyMainFilters();
});

// === ИНИЦИАЛИЗАЦИЯ ===
initCategories();
applyMainFilters(); // Рендер полного каталога при загрузке