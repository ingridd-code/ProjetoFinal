(function () {
  const historyList = document.querySelector('[data-purchase-history]');
  if (!historyList) return;

  const { escapeHtml, formatPrice } = window.RecycleWear;
  const user = window.RecycleWear.getUser();
  if (!user) {
    window.location.replace('login.html?redirect=historico');
    return;
  }

  function formatDate(value) {
    if (!value) return 'Não informada';
    const datePart = String(value).slice(0, 10);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : 'Não informada';
  }

  function formatPaymentMethod(value) {
    return ({
      credito: 'Cartão de crédito',
      debito: 'Cartão de débito',
      pix: 'Pix'
    })[value] || 'Não informada';
  }

  function renderPurchases(purchases) {
    if (!purchases.length) {
      historyList.innerHTML = '<div class="empty-cart"><span>↗</span><h2>Você ainda não fez compras.</h2><p>Quando finalizar um pedido, ele aparecerá aqui com sua nota fiscal.</p><a class="button button-dark" href="../index.html#colecao">Explorar coleção</a></div>';
      return;
    }

    const highlightedId = new URLSearchParams(window.location.search).get('compra');
    historyList.innerHTML = purchases.map((purchase) => {
      const items = Array.isArray(purchase.itens) ? purchase.itens : [];
      const invoiceTotal = purchase.nota_fiscal_total || purchase.valor_total;
      const isHighlighted = String(purchase.id_compra) === highlightedId;
      return `
        <article class="purchase-history-card${isHighlighted ? ' is-highlighted' : ''}" id="purchase-${Number(purchase.id_compra)}">
          <header class="purchase-history-heading">
            <div>
              <p class="eyebrow">Pedido #${Number(purchase.id_compra)}</p>
              <h2>Compra de ${formatDate(purchase.data_compra)}</h2>
            </div>
            <span class="purchase-status">${escapeHtml(purchase.status)}</span>
          </header>
          <div class="purchase-delivery-details">
            <p><strong>Entrega prevista</strong><span>${formatDate(purchase.data_entrega)}</span></p>
            <p><strong>Endereço</strong><span>${escapeHtml(purchase.local_entrega || 'Não informado')}</span></p>
            <p><strong>Forma de pagamento</strong><span>${formatPaymentMethod(purchase.metodo_pagamento)}</span></p>
          </div>
          <section class="purchase-invoice" aria-label="Nota fiscal">
            <div class="purchase-invoice-heading">
              <div>
                <p class="eyebrow">Nota fiscal</p>
                <h3>${escapeHtml(purchase.nota_fiscal || 'Não emitida')}</h3>
              </div>
              <p>Emitida em ${formatDate(purchase.data_emissao)}</p>
            </div>
            <div class="invoice-items">
              ${items.length ? items.map((item) => `
                <div class="invoice-item">
                  <span>${escapeHtml(item.produto_nome)} · tam. ${escapeHtml(item.tamanho || 'Único')} × ${Number(item.quantidade)}</span>
                  <span>${formatPrice(Number(item.preco_unitario) * Number(item.quantidade))}</span>
                </div>`).join('') : '<p class="invoice-empty">Itens indisponíveis.</p>'}
            </div>
            <div class="invoice-total"><span>Total</span><strong>${formatPrice(invoiceTotal)}</strong></div>
            ${purchase.nota_fiscal ? '<button class="button button-outline-dark invoice-print-button" type="button" data-print-purchase>Imprimir nota fiscal</button>' : ''}
          </section>
        </article>`;
    }).join('');

    if (highlightedId && /^\d+$/.test(highlightedId)) {
      const highlightedPurchase = document.querySelector(`#purchase-${highlightedId}`);
      if (highlightedPurchase) highlightedPurchase.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  historyList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-print-purchase]');
    if (!button) return;
    historyList.querySelectorAll('.is-printing').forEach((card) => card.classList.remove('is-printing'));
    button.closest('.purchase-history-card').classList.add('is-printing');
    window.print();
  });

  window.addEventListener('afterprint', () => {
    historyList.querySelectorAll('.is-printing').forEach((card) => card.classList.remove('is-printing'));
  });

  window.RecycleWear.request(`/compras/usuario/${encodeURIComponent(user.id)}`)
    .then((purchases) => renderPurchases(Array.isArray(purchases) ? purchases : []))
    .catch((error) => {
      historyList.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    });
})();
