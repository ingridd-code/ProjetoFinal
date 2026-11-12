(function () {
  const itemsContainer = document.querySelector('[data-cart-items]');
  if (!itemsContainer) return;
  let cartItems = [];

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function formatPrice(price) {
    return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function renderCart() {
    document.querySelector('[data-cart-total]').textContent = formatPrice(
      cartItems.reduce((total, item) => total + Number(item.subtotal || Number(item.preco) * Number(item.quantidade)), 0)
    );
    if (!cartItems.length) {
      itemsContainer.innerHTML = '<div class="empty-cart"><span>↗</span><h2>Sua sacola está esperando.</h2><p>Explore a coleção e encontre peças com propósito.</p><a class="button button-dark" href="../index.html#colecao">Descobrir coleção</a></div>';
      return;
    }
    itemsContainer.innerHTML = cartItems.map((item, index) => `
      <article class="cart-item">
        <div class="cart-item-art"><span>rw</span></div>
        <div class="cart-item-info"><h2>${escapeHtml(item.nome)}</h2><p>${escapeHtml(item.material || 'Plástico retirado do oceano')}</p><strong>${formatPrice(item.preco)}</strong></div>
        <div class="cart-item-actions">
          <label class="sr-only" for="quantity-${index}">Quantidade de ${escapeHtml(item.nome)}</label>
          <input id="quantity-${index}" type="number" min="1" max="${Number(item.estoque) || 99}" value="${Number(item.quantidade)}" data-quantity="${index}">
          <strong>${formatPrice(item.subtotal || Number(item.preco) * Number(item.quantidade))}</strong>
          <button class="remove-item" type="button" data-remove="${index}">Remover</button>
        </div>
      </article>`).join('');
  }

  async function loadCart() {
    try {
      const cart = await window.RecycleWear.getCart();
      cartItems = cart.itens || [];
      renderCart();
    } catch (error) {
      itemsContainer.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    }
  }

  itemsContainer.addEventListener('change', async (event) => {
    const input = event.target.closest('[data-quantity]');
    if (!input) return;
    const index = Number(input.dataset.quantity);
    const item = cartItems[index];
    const quantity = Number(input.value);
    if (!Number.isInteger(quantity) || quantity < 1 || (item.estoque && quantity > Number(item.estoque))) {
      input.value = String(item.quantidade);
      window.RecycleWear.showToast('Informe uma quantidade disponível em estoque.');
      return;
    }
    try {
      await window.RecycleWear.updateCartItem(item, quantity);
      await loadCart();
      window.RecycleWear.updateCartCount();
    } catch (error) {
      window.RecycleWear.showToast(error.message);
    }
  });

  itemsContainer.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    try {
      await window.RecycleWear.removeCartItem(cartItems[Number(button.dataset.remove)]);
      await loadCart();
      window.RecycleWear.updateCartCount();
    } catch (error) {
      window.RecycleWear.showToast(error.message);
    }
  });

  document.querySelector('[data-checkout]').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const message = document.querySelector('[data-checkout-message]');
    const user = window.RecycleWear.getUser();
    message.textContent = '';
    if (!user) {
      window.location.href = 'login.html?redirect=carrinho';
      return;
    }
    if (!cartItems.length) {
      message.textContent = 'Adicione ao menos uma peça antes de finalizar.';
      return;
    }
    button.disabled = true;
    try {
      const result = await window.RecycleWear.request('/compras/checkout', {
        method: 'POST',
        body: JSON.stringify({ id_usuario: user.id })
      });
      message.textContent = `${result.mensagem} Pedido #${result.id_compra} · Nota fiscal ${result.nota_fiscal}.`;
      await loadCart();
      window.RecycleWear.updateCartCount();
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  loadCart();
})();
