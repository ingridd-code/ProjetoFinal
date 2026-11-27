(function () {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;

  const { escapeHtml, formatPrice } = window.RecycleWear;
  let products = [];
  const carouselControls = document.querySelector('[data-collection-controls]');
  const previousButton = document.querySelector('[data-collection-prev]');
  const nextButton = document.querySelector('[data-collection-next]');
  const categoryGrid = document.querySelector('[data-category-grid]');
  const categoryFilter = document.querySelector('#category-filter');
  const searchInput = document.querySelector('#product-search');
  const isGridLayout = grid.dataset.catalogLayout === 'grid';
  const quickBuyDialog = document.querySelector('[data-quick-buy]');
  const sizeOptionsContainer = document.querySelector('[data-size-options]');
  const quickBuyProduct = document.querySelector('[data-quick-buy-product]');
  const quickBuyConfirm = document.querySelector('[data-confirm-quick-buy]');
  const quickBuyError = document.querySelector('[data-size-error]');
  let quickBuySelection = { product: null, size: '' };
  const categoryCards = [
    { name: 'Tênis' },
    { name: 'Camisetas' },
    { name: 'Jaquetas' },
    { name: 'Acessórios' }
  ];
  const filterButtons = document.querySelectorAll('[data-category-filter]');

  function getProductSizes(product) {
    return product.sizes || ['Único'];
  }

  function findCategory(categoryCard) {
    return products.some((product) => product.category === categoryCard.name) ? categoryCard.name : null;
  }

  function renderQuickBuy(product) {
    quickBuySelection = { product, size: '' };
    quickBuyProduct.textContent = `${product.name} · ${formatPrice(product.price)}`;
    quickBuyError.textContent = '';
    sizeOptionsContainer.innerHTML = getProductSizes(product).map((size) => `
      <button type="button" class="eco-size-option" data-size-option="${escapeHtml(size)}" aria-pressed="false">${escapeHtml(size)}</button>
    `).join('');
    sizeOptionsContainer.querySelectorAll('[data-size-option]').forEach((button) => {
      button.addEventListener('click', () => {
        quickBuySelection.size = button.dataset.sizeOption;
        sizeOptionsContainer.querySelectorAll('[data-size-option]').forEach((option) => {
          option.setAttribute('aria-pressed', String(option === button));
        });
        quickBuyError.textContent = '';
      });
    });
    quickBuyDialog.showModal();
  }

  if (quickBuyConfirm) {
    quickBuyConfirm.addEventListener('click', async () => {
      const { product, size } = quickBuySelection;
      if (!product || !size) {
        quickBuyError.textContent = 'Escolha uma numeração ou tamanho para continuar.';
        return;
      }
      quickBuyConfirm.disabled = true;
      try {
        await window.RecycleWear.addToCart(Number(product.id), 1, size);
        quickBuyDialog.close();
        window.RecycleWear.showToast('Peça adicionada à sua sacola.');
      } catch (error) {
        quickBuyError.textContent = error.message;
      } finally {
        quickBuyConfirm.disabled = false;
      }
    });
  }

  const newsletterForm = document.querySelector('[data-newsletter-form]');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = newsletterForm.querySelector('[data-newsletter-message]');
      const submit = newsletterForm.querySelector('[type="submit"]');
      const formData = new FormData(newsletterForm);
      message.textContent = '';
      submit.disabled = true;
      try {
        const result = await window.RecycleWear.request('/newsletter', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.get('email'),
            consentimento: formData.get('consentimento') === 'on'
          })
        });
        message.textContent = result.mensagem;
        newsletterForm.reset();
      } catch (error) {
        message.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    });
  }

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
      const unavailable = Number(product.estoque) <= 0;
      return `<article class="product-card" data-product-reveal style="--product-reveal-delay: ${Math.min(index, 5) * 80}ms">
        <div class="product-image">
          <img src="${escapeHtml(product.image)}" alt="Foto de ${escapeHtml(product.name)}" loading="lazy">
          <span class="product-tag">${escapeHtml(product.category)}</span>
          <button class="quick-add" type="button" data-add-product="${product.id}" ${unavailable ? 'disabled' : ''} aria-label="Escolher tamanho e adicionar ${escapeHtml(product.name)} à sacola">${unavailable ? 'Esgotado' : '+'}</button>
        </div>
        <div class="product-info">
          <div class="eco-product-copy">
            <h3>${escapeHtml(product.name)}</h3>
            <p class="eco-product-bottles">${escapeHtml(product.impactText)}</p>
            <p class="eco-product-rating" aria-label="Avaliação demonstrativa: ${product.rating} de 5, ${product.reviewsCount} avaliações"><span aria-hidden="true">★</span> ${product.rating.toFixed(1).replace('.', ',')} <span>(${product.reviewsCount})</span></p>
          </div>
          <div class="eco-product-price"><strong>${formatPrice(product.price)}</strong><span>${escapeHtml(product.installments)}</span></div>
        </div>
      </article>`;
    }).join('');
    updateCarouselControls();
  }

  function renderCategoryCards() {
    if (!categoryGrid) return;
    const categoryCounts = new Map();
    products.forEach((product) => {
      if (product.category) {
        categoryCounts.set(product.category, (categoryCounts.get(product.category) || 0) + 1);
      }
    });
    categoryCards.forEach((card) => {
      if (!findCategory(card)) categoryCounts.set(card.name, 0);
    });
    categoryGrid.innerHTML = categoryCards.map((card) => {
      const actualCategory = card.name;
      const count = categoryCounts.get(actualCategory) || 0;
      const image = products.find((product) => product.category === actualCategory)?.image;
      return `
      <a class="eco-category" href="#colecao" data-category="${escapeHtml(actualCategory)}" data-scroll-reveal style="--category-image: url('${escapeHtml(image || '')}')">
        <span>${escapeHtml(card.name)}</span>
        <span class="eco-category-count">${count ? `${count} ${count === 1 ? 'peça' : 'peças'}` : 'Em breve'}</span>
        <b aria-hidden="true">↗</b>
      </a>
    `;
    }).join('');
  }

  function renderCategoryOptions() {
    categoryFilter.innerHTML = '<option value="">Todas as peças</option>';
    categoryCards.forEach((card) => {
      if (!findCategory(card)) return;
      const option = document.createElement('option');
      option.value = card.name;
      option.textContent = card.name;
      categoryFilter.append(option);
    });
  }

  grid.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-add-product]');
    if (!button) return;
    const product = products.find((entry) => Number(entry.id) === Number(button.dataset.addProduct));
    if (quickBuyDialog) {
      if (product) renderQuickBuy(product);
      return;
    }
    button.disabled = true;
    try {
      await window.RecycleWear.addToCart(Number(button.dataset.addProduct), 1, product?.sizes?.[0] || 'Único');
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
      const matchesCategory = !category || product.category === category;
      const searchableText = [product.name, product.category, product.impactText]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR');
      return matchesCategory && searchableText.includes(query);
    });
    filterButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category));
    });
    renderProducts(filteredProducts);
  }

  categoryFilter.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      categoryFilter.value = button.dataset.categoryFilter;
      applyFilters();
    });
  });
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
    renderCategoryOptions();
    renderCategoryCards();
    renderProducts(products);
  }).catch((error) => {
    document.querySelector('[data-product-count]').textContent = 'Coleção indisponível';
    grid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}<br><span>Inicie o servidor do BackEnd e atualize a página.</span></p>`;
    if (categoryGrid) categoryGrid.innerHTML = '<p class="empty-state">Não foi possível carregar as categorias.</p>';
  });
})();
