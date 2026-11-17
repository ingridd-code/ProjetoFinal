# RecycleWear — FrontEnd

Interface da loja RecycleWear, com páginas de catálogo, cadastro, login, sacola e gerenciamento de produtos. O catálogo, a autenticação, o carrinho de usuários autenticados, a finalização de compra e as operações de produtos usam as rotas do BackEnd.

## Executar

1. Configure e inicie o BackEnd na porta `3000` (consulte `../BackEnd/README.md`).
2. Sirva esta pasta com uma extensão de servidor estático, como Live Server no VS Code. Abra `index.html` pelo servidor local — não abra o arquivo diretamente pelo protocolo `file://`.
3. Acesse as páginas pelo catálogo; cadastro, login, sacola e gerenciamento de produtos ficam em `pages/`.

O endereço da API está definido no início de `assets/js/api.js` como `http://localhost:3000/api`. Se a API usar outro endereço, ajuste essa constante.

## Fluxos

- Cadastro e login enviam os dados para `/auth/register` e `/auth/login`, com submissão interceptada por `event.preventDefault()`.
- A sessão do usuário é guardada temporariamente no `localStorage`; não há token nem senha persistidos pelo FrontEnd.
- A sacola de visitante é guardada no `localStorage` e sincronizada com `/carrinho/item` após o login.
- Usuários autenticados consultam e alteram a sacola por `/carrinho`. O checkout envia `id_usuario` para `/compras/checkout`, que finaliza o carrinho ativo da API.
- A página `pages/produtos.html` lista, cadastra, atualiza e exclui produtos pela API. Ela também permite cadastrar categorias, necessárias para criar um produto quando ainda não houver nenhuma.

> A API atual não exige autenticação para rotas de gerenciamento de produtos. Use esse painel apenas em ambiente de desenvolvimento/local; não o exponha publicamente sem proteger essas rotas no BackEnd.
