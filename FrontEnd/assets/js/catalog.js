(function () {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;

  const { escapeHtml, formatPrice } = window.RecycleWear;
  const productImages = [
    'photo-1521572163474-6864f9cf17ab',
    'photo-1551488831-00ddcb6c6bd3',
    'photo-1551028719-00167b16eac5',
    'photo-1529139574466-a303027c1d8b',
    'photo-1542291026-7eec264c27ff',
    'photo-1544441893-675973e31985'
  ];
  let products = [];
  const carouselControls = document.querySelector('[data-collection-controls]');
  const previousButton = document.querySelector('[data-collection-prev]');
  const nextButton = document.querySelector('[data-collection-next]');
  const categoryGrid = document.querySelector('[data-category-grid]');
  const categoryFilter = document.querySelector('#category-filter');
  const searchInput = document.querySelector('#product-search');
  const isGridLayout = grid.dataset.catalogLayout === 'grid';

  function updateCarouselControls() {
    if (!carouselControls || !previousButton || !nextButton) return;
    const maxScroll = grid.scrollWidth - grid.clientWidth;
    carouselControls.hidden = maxScroll <= 1;
    previousButton.disabled = grid.scrollLeft <= 1;
    nextButton.disabled = grid.scrollLeft >= maxScroll - 1;
  }

  function scrollCollection(direction) {
    const card = grid.querySelector('.product-card');
    if (!card) return;
    const gap = Number.parseFloat(window.getComputedStyle(grid).columnGap) || 0;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    grid.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior });
  }

  function renderProducts(list) {
    const count = document.querySelector('[data-product-count]');
    count.textContent = `${list.length} ${list.length === 1 ? 'peça' : 'peças'} disponíveis`;
    grid.scrollLeft = 0;
    grid.classList.toggle('is-carousel', list.length > 0 && !isGridLayout);
    if (!list.length) {
      grid.innerHTML = '<p class="empty-state">Nenhuma peça encontrada para esses filtros.</p>';
      updateCarouselControls();
      return;
    }
    grid.innerHTML = list.map((product, index) => {
      const image = product.imagem_url || `https://images.unsplash.com/${productImages[index % productImages.length]}?auto=format&fit=crop&w=850&q=85`;
      const unavailable = Number(product.estoque) <= 0;
      return `<article class="product-card" data-product-reveal style="--product-reveal-delay: ${Math.min(index, 5) * 80}ms">
        <div class="product-image">
          <img src="${escapeHtml(image)}" alt="Foto de ${escapeHtml(product.nome)}" loading="lazy">
          <span class="product-tag">${product.categoria || 'RecycleWear'}</span>
          <button class="quick-add" type="button" data-add-product="${product.id_produto}" ${unavailable ? 'disabled' : ''} aria-label="Adicionar ${escapeHtml(product.nome)} à sacola">${unavailable ? 'Esgotado' : '+'}</button>
        </div>
        <div class="product-info"><div><h3>${escapeHtml(product.nome)}</h3><p>${escapeHtml(product.material || 'Plástico retirado do oceano')}</p></div><strong>${formatPrice(product.preco)}</strong></div>
      </article>`;
    }).join('');
    updateCarouselControls();
  }

  function renderCategoryCards() {
    if (!categoryGrid) return;
    const categoryCounts = new Map();
    products.forEach((product) => {
      if (product.categoria) {
        categoryCounts.set(product.categoria, (categoryCounts.get(product.categoria) || 0) + 1);
      }
    });
    const categories = [...categoryCounts.entries()];
    if (!categories.length) {
      categoryGrid.innerHTML = '<p class="empty-state">Ainda não há categorias com peças cadastradas.</p>';
      return;
    }
    categoryGrid.innerHTML = categories.map(([category, count]) => `
      <a class="eco-category" href="#colecao" data-category="${escapeHtml(category)}" data-scroll-reveal>
        <span>${escapeHtml(category)}</span>
        <span class="eco-category-count">${count} ${count === 1 ? 'peça' : 'peças'}</span>
        <b aria-hidden="true">↗</b>
      </a>
    `).join('');
  }

  grid.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-add-product]');
    if (!button) return;
    button.disabled = true;
    try {
      await window.RecycleWear.addToCart(Number(button.dataset.addProduct), 1);
      window.RecycleWear.showToast('Peça adicionada à sua sacola.');
    } catch (error) {
      window.RecycleWear.showToast(error.message);
    } finally {
      button.disabled = false;
    }
  });

  if (previousButton && nextButton) {
    previousButton.addEventListener('click', () => scrollCollection(-1));
    nextButton.addEventListener('click', () => scrollCollection(1));
    grid.addEventListener('scroll', updateCarouselControls, { passive: true });
    window.addEventListener('resize', updateCarouselControls);
  }

  function applyFilters() {
    const category = categoryFilter.value;
    const query = searchInput.value.trim().toLocaleLowerCase('pt-BR');
    const filteredProducts = products.filter((product) => {
      const matchesCategory = !category || product.categoria === category;
      const searchableText = [product.nome, product.categoria, product.material, product.descricao]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR');
      return matchesCategory && searchableText.includes(query);
    });
    renderProducts(filteredProducts);
  }

  categoryFilter.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);
  if (categoryGrid) {
    categoryGrid.addEventListener('click', (event) => {
      const link = event.target.closest('[data-category]');
      if (!link) return;
      categoryFilter.value = link.dataset.category;
      applyFilters();
    });
  }

  window.RecycleWear.request('/produtos').then((data) => {
    products = Array.isArray(data) ? data : [];
    const categories = [...new Set(products.map((product) => product.categoria).filter(Boolean))];
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.append(option);
    });
    renderCategoryCards();
    renderProducts(products);
  }).catch((error) => {
    document.querySelector('[data-product-count]').textContent = 'Coleção indisponível';
    grid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}<br><span>Inicie o servidor do BackEnd e atualize a página.</span></p>`;
    if (categoryGrid) categoryGrid.innerHTML = '<p class="empty-state">Não foi possível carregar as categorias.</p>';
  });
})();
