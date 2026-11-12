(function () {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;

  const productImages = [
    'photo-1521572163474-6864f9cf17ab',
    'photo-1551488831-00ddcb6c6bd3',
    'photo-1551028719-00167b16eac5',
    'photo-1529139574466-a303027c1d8b',
    'photo-1542291026-7eec264c27ff',
    'photo-1544441893-675973e31985'
  ];
  let products = [];

  function formatPrice(price) {
    return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function renderProducts(list) {
    const count = document.querySelector('[data-product-count]');
    count.textContent = `${list.length} ${list.length === 1 ? 'peça' : 'peças'} disponíveis`;
    if (!list.length) {
      grid.innerHTML = '<p class="empty-state">Nenhuma peça encontrada nesta categoria.</p>';
      return;
    }
    grid.innerHTML = list.map((product, index) => {
      const image = `https://images.unsplash.com/${productImages[index % productImages.length]}?auto=format&fit=crop&w=850&q=85`;
      const unavailable = Number(product.estoque) <= 0;
      return `<article class="product-card">
        <div class="product-image" style="--product-image: url('${image}')">
          <span class="product-tag">${product.categoria || 'RecycleWear'}</span>
          <button class="quick-add" type="button" data-add-product="${product.id_produto}" ${unavailable ? 'disabled' : ''} aria-label="Adicionar ${escapeHtml(product.nome)} à sacola">${unavailable ? 'Esgotado' : '+'}</button>
        </div>
        <div class="product-info"><div><h3>${escapeHtml(product.nome)}</h3><p>${escapeHtml(product.material || 'Plástico retirado do oceano')}</p></div><strong>${formatPrice(product.preco)}</strong></div>
      </article>`;
    }).join('');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
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

  document.querySelector('#category-filter').addEventListener('change', (event) => {
    const category = event.target.value;
    renderProducts(category ? products.filter((product) => product.categoria === category) : products);
  });

  window.RecycleWear.request('/produtos').then((data) => {
    products = Array.isArray(data) ? data : [];
    const categories = [...new Set(products.map((product) => product.categoria).filter(Boolean))];
    const filter = document.querySelector('#category-filter');
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      filter.append(option);
    });
    renderProducts(products);
  }).catch((error) => {
    document.querySelector('[data-product-count]').textContent = 'Coleção indisponível';
    grid.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}<br><span>Inicie o servidor do BackEnd e atualize a página.</span></p>`;
  });
})();
