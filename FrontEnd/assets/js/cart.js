(function () {
  const itemsContainer = document.querySelector('[data-cart-items]');
  if (!itemsContainer) return;
  const { escapeHtml, formatPrice } = window.RecycleWear;
  const deliveryDateInput = document.querySelector('[data-delivery-date]');
  const deliveryLocationInput = document.querySelector('[data-delivery-location]');
  const paymentMethodInputs = document.querySelectorAll('[name="metodo-pagamento"]');
  const historyLink = document.querySelector('[data-purchase-history-link]');
  let cartItems = [];

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  deliveryDateInput.min = today.toISOString().slice(0, 10);

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
        <div class="cart-item-info"><h2>${escapeHtml(item.nome)}</h2><p>${escapeHtml(item.material || 'Plástico retirado do oceano')}</p><p>Tamanho: ${escapeHtml(item.tamanho || 'Único')}</p><strong>${formatPrice(item.preco)}</strong></div>
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
    historyLink.hidden = true;
    if (!user) {
      window.location.href = 'login.html?redirect=carrinho';
      return;
    }
    if (!cartItems.length) {
      message.textContent = 'Adicione ao menos uma peça antes de finalizar.';
      return;
    }
    const dataEntrega = deliveryDateInput.value;
    const localEntrega = deliveryLocationInput.value.trim();
    if (!dataEntrega || dataEntrega < deliveryDateInput.min) {
      message.textContent = 'Escolha uma data de entrega a partir de hoje.';
      deliveryDateInput.focus();
      return;
    }
    if (!localEntrega || localEntrega.length > 255) {
      message.textContent = 'Informe um endereço de entrega com até 255 caracteres.';
      deliveryLocationInput.focus();
      return;
    }
    const metodoPagamento = document.querySelector('[name="metodo-pagamento"]:checked')?.value;
    if (!metodoPagamento) {
      message.textContent = 'Escolha uma forma de pagamento para continuar.';
      paymentMethodInputs[0]?.focus();
      return;
    }
    button.disabled = true;
    try {
      const result = await window.RecycleWear.request('/compras/checkout', {
        method: 'POST',
        body: JSON.stringify({
          id_usuario: user.id,
          data_entrega: dataEntrega,
          local_entrega: localEntrega,
          metodo_pagamento: metodoPagamento
        })
      });
      message.textContent = `${result.mensagem} Pedido #${result.id_compra}. Pagamento pendente — ${result.metodo_pagamento}.`;
      historyLink.href = `historico.html?compra=${encodeURIComponent(result.id_compra)}`;
      historyLink.hidden = false;
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
