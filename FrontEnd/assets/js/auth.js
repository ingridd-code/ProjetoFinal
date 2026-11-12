(function () {
  const form = document.querySelector('[data-auth-form]');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.querySelector('[data-form-message]');
    const button = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const type = form.dataset.authForm;
    const payload = Object.fromEntries(formData.entries());
    message.textContent = '';
    button.disabled = true;

    try {
      if (type === 'register') {
        await window.RecycleWear.request('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        window.location.href = 'login.html?cadastro=sucesso';
        return;
      }

      const result = await window.RecycleWear.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await window.RecycleWear.syncGuestCart(result.usuario);
      localStorage.setItem('recyclewear_user', JSON.stringify(result.usuario));
      window.location.href = new URLSearchParams(window.location.search).get('redirect') === 'carrinho'
        ? 'carrinho.html'
        : '../index.html';
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  if (new URLSearchParams(window.location.search).get('cadastro') === 'sucesso') {
    document.querySelector('[data-form-message]').textContent = 'Conta criada! Entre com seu e-mail e senha.';
    document.querySelector('[data-form-message]').classList.add('success-message');
  }
})();
