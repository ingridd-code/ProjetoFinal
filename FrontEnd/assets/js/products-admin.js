(function () {
  const form = document.querySelector('[data-product-form]');
  if (!form) return;

  const list = document.querySelector('[data-admin-product-list]');
  const listMessage = document.querySelector('[data-list-message]');
  const formMessage = document.querySelector('[data-admin-message]');
  const categorySelect = document.querySelector('#product-category');
  const categoryHelp = document.querySelector('[data-category-help]');
  const submitButton = document.querySelector('[data-submit-product]');
  const cancelEditButton = document.querySelector('[data-cancel-edit]');
  const categoryForm = document.querySelector('[data-category-form]');
  const categoryMessage = document.querySelector('[data-category-message]');
  let editingProductId = null;
  let products = [];

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function formatPrice(price) {
    return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  async function loadCategories(selectedId) {
    const categories = await window.RecycleWear.request('/produtos/categorias');
    categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.id_categoria;
      option.textContent = category.nome;
      categorySelect.append(option);
    });
    if (selectedId) categorySelect.value = String(selectedId);
    categorySelect.disabled = categories.length === 0;
    categoryHelp.hidden = categories.length > 0;
    if (!categories.length) {
      categorySelect.innerHTML = '<option value="">Nenhuma categoria cadastrada — use o formulário abaixo</option>';
    }
  }

  function renderProducts() {
    if (!products.length) {
      list.innerHTML = '<p class="admin-empty">Nenhum produto ativo encontrado.</p>';
      return;
    }
    list.innerHTML = products.map((product) => `
      <article class="admin-product">
        <div class="admin-product-info">
          <span class="admin-product-category">${escapeHtml(product.categoria || 'Sem categoria')}</span>
          <h3>${escapeHtml(product.nome)}</h3>
          <p>${escapeHtml(product.material || 'Material não informado')}</p>
        </div>
        <div class="admin-product-meta">
          <strong>${formatPrice(product.preco)}</strong>
          <span>Estoque: ${Number(product.estoque)}</span>
        </div>
        <div class="admin-product-actions">
          <button class="text-button" type="button" data-edit-product="${Number(product.id_produto)}">Editar</button>
          <button class="text-button delete-button" type="button" data-delete-product="${Number(product.id_produto)}">Excluir</button>
        </div>
      </article>`).join('');
  }

  async function loadProducts() {
    listMessage.textContent = 'Carregando produtos...';
    list.innerHTML = '';
    try {
      const data = await window.RecycleWear.request('/produtos');
      products = Array.isArray(data) ? data : [];
      listMessage.textContent = `${products.length} ${products.length === 1 ? 'produto ativo' : 'produtos ativos'}`;
      renderProducts();
    } catch (error) {
      listMessage.textContent = error.message;
    }
  }

  function resetForm() {
    editingProductId = null;
    form.reset();
    form.elements.material.value = 'Plástico reciclado retirado do oceano';
    document.querySelector('[data-form-title]').textContent = 'Novo produto';
    submitButton.innerHTML = 'Adicionar produto <span aria-hidden="true">↗</span>';
    cancelEditButton.hidden = true;
    formMessage.textContent = '';
    loadCategories().catch((error) => {
      formMessage.textContent = error.message;
    });
  }

  function startEditing(productId) {
    const product = products.find((entry) => Number(entry.id_produto) === productId);
    if (!product) {
      listMessage.textContent = 'Este produto não está mais disponível na lista. Atualize os produtos e tente novamente.';
      return;
    }
    editingProductId = productId;
    form.elements.nome.value = product.nome || '';
    form.elements.descricao.value = product.descricao || '';
    form.elements.material.value = product.material || '';
    form.elements.preco.value = Number(product.preco);
    form.elements.estoque.value = Number(product.estoque);
    document.querySelector('[data-form-title]').textContent = `Editar: ${product.nome}`;
    submitButton.innerHTML = 'Salvar alterações <span aria-hidden="true">↗</span>';
    cancelEditButton.hidden = false;
    formMessage.textContent = '';
    loadCategories(product.id_categoria).then(() => {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch((error) => {
      formMessage.textContent = error.message;
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!categorySelect.value) {
      formMessage.textContent = 'Selecione ou cadastre uma categoria antes de salvar o produto.';
      return;
    }
    const values = Object.fromEntries(new FormData(form).entries());
    const payload = {
      ...values,
      id_categoria: Number(values.id_categoria),
      preco: Number(values.preco),
      estoque: Number(values.estoque)
    };
    formMessage.textContent = '';
    submitButton.disabled = true;
    try {
      if (editingProductId === null) {
        await window.RecycleWear.request('/produtos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        formMessage.textContent = 'Produto cadastrado com sucesso.';
      } else {
        await window.RecycleWear.request(`/produtos/${encodeURIComponent(editingProductId)}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        formMessage.textContent = 'Produto atualizado com sucesso.';
      }
      await loadProducts();
      if (editingProductId === null) {
        form.reset();
        form.elements.material.value = 'Plástico reciclado retirado do oceano';
        await loadCategories();
      } else {
        editingProductId = null;
        document.querySelector('[data-form-title]').textContent = 'Novo produto';
        submitButton.innerHTML = 'Adicionar produto <span aria-hidden="true">↗</span>';
        cancelEditButton.hidden = true;
        form.reset();
        form.elements.material.value = 'Plástico reciclado retirado do oceano';
        await loadCategories();
      }
    } catch (error) {
      formMessage.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });

  cancelEditButton.addEventListener('click', resetForm);
  document.querySelector('[data-refresh-products]').addEventListener('click', loadProducts);

  list.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-product]');
    if (editButton) {
      startEditing(Number(editButton.dataset.editProduct));
      return;
    }
    const deleteButton = event.target.closest('[data-delete-product]');
    if (!deleteButton) return;
    const product = products.find((entry) => Number(entry.id_produto) === Number(deleteButton.dataset.deleteProduct));
    if (!product || !window.confirm(`Excluir o produto "${product.nome}"? Esta ação não pode ser desfeita.`)) return;
    deleteButton.disabled = true;
    listMessage.textContent = '';
    try {
      await window.RecycleWear.request(`/produtos/${encodeURIComponent(product.id_produto)}`, { method: 'DELETE' });
      if (editingProductId === Number(product.id_produto)) resetForm();
      await loadProducts();
    } catch (error) {
      listMessage.textContent = error.message;
      deleteButton.disabled = false;
    }
  });

  categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = categoryForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    categoryMessage.textContent = '';
    const payload = Object.fromEntries(new FormData(categoryForm).entries());
    try {
      const result = await window.RecycleWear.request('/produtos/categorias', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      categoryMessage.textContent = 'Categoria cadastrada e selecionada no formulário do produto.';
      categoryForm.reset();
      await loadCategories(result.id);
    } catch (error) {
      categoryMessage.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });

  loadCategories().catch((error) => {
    formMessage.textContent = error.message;
    categorySelect.innerHTML = '<option value="">Não foi possível carregar as categorias</option>';
  });
  loadProducts();
})();
