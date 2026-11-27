(function () {
  const API_BASE = window.location.port === '3000'
    ? `${window.location.origin}/api`
    : 'http://localhost:3000/api';
  const CART_KEY = 'recyclewear_cart';
  const USER_KEY = 'recyclewear_user';

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function formatPrice(price) {
    return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (error) {
      console.error('Não foi possível ler a sessão salva.', error);
      return null;
    }
  }

  function getGuestCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(cart) ? cart : [];
    } catch (error) {
      console.error('Não foi possível ler o carrinho salvo.', error);
      return [];
    }
  }

  function saveGuestCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  async function request(path, options) {
    let response;
    const headers = { ...(options && options.headers) };
    if (!(options && options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
      });
    } catch (error) {
      throw new Error('Não foi possível conectar à API. Verifique se o servidor foi iniciado com npm start.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.erro || data.mensagem || 'Não foi possível concluir a solicitação.');
    return data;
  }

  async function syncGuestCart(user) {
    const cart = getGuestCart();
    for (const item of cart) {
      await request('/carrinho/item', {
        method: 'POST',
        body: JSON.stringify({
          id_usuario: user.id,
          id_produto: item.id_produto,
          quantidade: item.quantidade,
          tamanho: item.tamanho || 'Único'
        })
      });
    }
    saveGuestCart([]);
  }

  async function getCart() {
    const user = getUser();
    if (!user) {
      const products = await request('/produtos');
      return {
        itens: getGuestCart().map((item) => {
          const product = products.find((entry) => Number(entry.id_produto) === Number(item.id_produto));
          return product ? {
            ...product,
            id_produto: product.id_produto,
            quantidade: item.quantidade,
            tamanho: item.tamanho || 'Único',
            subtotal: Number(product.preco) * item.quantidade
          } : null;
        }).filter(Boolean)
      };
    }
    return request(`/carrinho/${encodeURIComponent(user.id)}`);
  }

  async function addToCart(productId, quantity, size) {
    const selectedSize = size || 'Único';
    const user = getUser();
    if (user) {
      await request('/carrinho/item', {
        method: 'POST',
        body: JSON.stringify({ id_usuario: user.id, id_produto: productId, quantidade: quantity, tamanho: selectedSize })
      });
      updateCartCount();
      return;
    }
    const cart = getGuestCart();
    const existing = cart.find((item) =>
      Number(item.id_produto) === Number(productId) && (item.tamanho || 'Único') === selectedSize
    );
    if (existing) existing.quantidade += quantity;
    else cart.push({ id_produto: productId, quantidade: quantity, tamanho: selectedSize });
    saveGuestCart(cart);
  }

  async function removeCartItem(item) {
    const user = getUser();
    if (user && item.id_item) {
      await request(`/carrinho/item/${encodeURIComponent(item.id_item)}`, { method: 'DELETE' });
    } else {
      saveGuestCart(getGuestCart().filter((entry) => Number(entry.id_produto) !== Number(item.id_produto)));
    }
  }

  async function updateCartItem(item, quantity) {
    const user = getUser();
    if (user && item.id_item) {
      await request(`/carrinho/item/${encodeURIComponent(item.id_item)}`, {
        method: 'PUT',
        body: JSON.stringify({ quantidade: quantity })
      });
    } else {
      const cart = getGuestCart();
      const existing = cart.find((entry) => Number(entry.id_produto) === Number(item.id_produto));
      if (existing) existing.quantidade = quantity;
      saveGuestCart(cart);
    }
  }

  async function updateCartCount() {
    const countElements = document.querySelectorAll('[data-cart-count]');
    if (!countElements.length) return;
    const user = getUser();
    let count = getGuestCart().reduce((total, item) => total + Number(item.quantidade || 0), 0);
    if (user) {
      try {
        const cart = await request(`/carrinho/${encodeURIComponent(user.id)}`);
        count = (cart.itens || []).reduce((total, item) => total + Number(item.quantidade || 0), 0);
      } catch (error) {
        console.error('Não foi possível atualizar o contador da sacola.', error);
      }
    }
    countElements.forEach((element) => { element.textContent = String(count); });
  }

  function updateHeader() {
    const user = getUser();
    document.querySelectorAll('[data-account-link]').forEach((link) => {
      if (user) {
        link.textContent = `Olá, ${user.nome}`;
        link.href = '#';
        link.addEventListener('click', (event) => {
          event.preventDefault();
          localStorage.removeItem(USER_KEY);
          window.location.reload();
        });
        link.title = 'Clique para sair';
      }
    });
    updateCartCount();
  }

  function showToast(message) {
    const toast = document.querySelector('[data-toast]');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    window.setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  window.RecycleWear = {
    escapeHtml, formatPrice, request, getUser, getGuestCart, saveGuestCart, syncGuestCart, getCart,
    addToCart, removeCartItem, updateCartItem, updateCartCount, updateHeader, showToast
  };
  document.addEventListener('DOMContentLoaded', updateHeader);
})();
