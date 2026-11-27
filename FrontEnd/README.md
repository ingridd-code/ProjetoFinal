# RecycleWear — FrontEnd

Interface da loja RecycleWear, com páginas de catálogo, cadastro, login, sacola e gerenciamento de produtos. O catálogo, a autenticação, o carrinho de usuários autenticados, a finalização de compra e as operações de produtos usam as rotas do BackEnd.

## Executar

Na raiz do projeto, instale as dependências uma vez e inicie o site e a API juntos:

```powershell
npm install
npm start
```

Abra `http://localhost:3000`. O servidor usa o arquivo `BackEnd/.env` para conectar ao MySQL. Para criar um banco novo, execute `BackEnd/config/db.sql` no MySQL; para bancos existentes, aplique as migrações em `BackEnd/migrations`. Não abra `index.html` diretamente com `file://`, pois a API é servida pelo mesmo endereço local.

Para atualizar um banco já existente com a compra por tamanho e as inscrições da newsletter, execute `BackEnd/migrations/003-product-sizes-and-newsletter.sql` uma única vez antes de iniciar a versão atualizada.

Para registrar cartão de crédito, cartão de débito ou Pix nos pedidos de um banco já existente, execute também `BackEnd/migrations/004-purchase-payment-method.sql` uma única vez.

Para criar ou sincronizar o catálogo demonstrativo de 32 produtos no MySQL, execute `npm run seed:catalog` na raiz. O comando mantém o estoque de produtos já existentes, cria os demais itens e desativa do catálogo produtos fora da lista sem apagar referências históricas.

As páginas de catálogo completo (`pages/colecao.html`), cadastro, login, sacola, histórico e gerenciamento de produtos ficam em `pages/`.

## Fluxos

- Cadastro e login enviam os dados para `/auth/register` e `/auth/login`, com submissão interceptada por `event.preventDefault()`.
- A sessão do usuário é guardada temporariamente no `localStorage`; não há token nem senha persistidos pelo FrontEnd.
- A sacola de visitante é guardada no `localStorage` e sincronizada com `/carrinho/item` após o login.
- Usuários autenticados consultam e alteram a sacola por `/carrinho`. O checkout envia `id_usuario` para `/compras/checkout`, que finaliza o carrinho ativo da API.
- A compra rápida salva o tamanho escolhido junto ao item da sacola e do pedido. A newsletter registra o e-mail somente após o consentimento explícito.
- O checkout registra a forma selecionada (cartão de crédito, cartão de débito ou Pix) e mantém o pedido pendente; não há cobrança real até integrar um provedor de pagamentos.
- A página `pages/produtos.html` lista, cadastra, atualiza e exclui produtos pela API. Ela também permite cadastrar categorias, necessárias para criar um produto quando ainda não houver nenhuma.

> A API atual não exige autenticação para rotas de gerenciamento de produtos. Use esse painel apenas em ambiente de desenvolvimento/local; não o exponha publicamente sem proteger essas rotas no BackEnd.
>
> Os números de impacto, avaliações, equivalências de garrafas, certificações e depoimentos na página inicial são exemplos demonstrativos. Valide-os com dados e autorizações reais antes da publicação. O formulário da newsletter registra inscrições, mas não envia e-mails ou resgata automaticamente a oferta de 10% OFF; configure esses fluxos antes de anunciá-la.
>
> As formas de pagamento no checkout são demonstrativas e apenas ficam registradas no pedido. Integre um provedor compatível antes de aceitar ou confirmar pagamentos reais.
>
> Avaliações, quantidade de avaliações e equivalências de material dos 32 produtos também são dados de demonstração e precisam ser substituídos por informações reais antes da publicação comercial.
