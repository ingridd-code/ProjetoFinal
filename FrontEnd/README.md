# RecycleWear — FrontEnd

Interface da loja RecycleWear, com páginas de catálogo, cadastro, login e sacola. O catálogo, a autenticação, o carrinho de usuários autenticados e a finalização de compra usam as rotas do BackEnd.

## Executar

1. Configure e inicie o BackEnd na porta `3000` (consulte `../BackEnd/README.md`).
2. Sirva esta pasta com uma extensão de servidor estático, como Live Server no VS Code. Abra `index.html` pelo servidor local — não abra o arquivo diretamente pelo protocolo `file://`.
3. Acesse as páginas pelo catálogo; cadastro, login e sacola ficam em `pages/`.

O endereço da API está definido no início de `assets/js/api.js` como `http://localhost:3000/api`. Se a API usar outro endereço, ajuste essa constante.

## Fluxos

- Cadastro e login enviam os dados para `/auth/register` e `/auth/login`, com submissão interceptada por `event.preventDefault()`.
- A sessão do usuário é guardada temporariamente no `localStorage`; não há token nem senha persistidos pelo FrontEnd.
- A sacola de visitante é guardada no `localStorage` e sincronizada com `/carrinho/item` após o login.
- Usuários autenticados consultam e alteram a sacola por `/carrinho`. O checkout envia `id_usuario` para `/compras/checkout`, que finaliza o carrinho ativo da API.
