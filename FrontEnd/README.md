# RecycleWear — FrontEnd

Interface da loja RecycleWear, com páginas de catálogo, cadastro, login, sacola e gerenciamento de produtos. O catálogo, a autenticação, o carrinho de usuários autenticados, a finalização de compra e as operações de produtos usam as rotas do BackEnd.

## Executar

Na raiz do projeto, instale as dependências uma vez e inicie o site e a API juntos:

```powershell
npm install
npm start
```

Abra `http://localhost:3000`. O servidor usa o arquivo `BackEnd/.env` para conectar ao MySQL. Para criar um banco novo, execute `BackEnd/config/db.sql` no MySQL; para bancos existentes, aplique as migrações em `BackEnd/migrations`. Não abra `index.html` diretamente com `file://`, pois a API é servida pelo mesmo endereço local.

As páginas de catálogo completo (`pages/colecao.html`), cadastro, login, sacola, histórico e gerenciamento de produtos ficam em `pages/`.

## Fluxos

- Cadastro e login enviam os dados para `/auth/register` e `/auth/login`, com submissão interceptada por `event.preventDefault()`.
- A sessão do usuário é guardada temporariamente no `localStorage`; não há token nem senha persistidos pelo FrontEnd.
- A sacola de visitante é guardada no `localStorage` e sincronizada com `/carrinho/item` após o login.
- Usuários autenticados consultam e alteram a sacola por `/carrinho`. O checkout envia `id_usuario` para `/compras/checkout`, que finaliza o carrinho ativo da API.
- A página `pages/produtos.html` lista, cadastra, atualiza e exclui produtos pela API. Ela também permite cadastrar categorias, necessárias para criar um produto quando ainda não houver nenhuma.

> A API atual não exige autenticação para rotas de gerenciamento de produtos. Use esse painel apenas em ambiente de desenvolvimento/local; não o exponha publicamente sem proteger essas rotas no BackEnd.
