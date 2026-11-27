USE recyclewear_db;

ALTER TABLE item_carrinho
    DROP INDEX uq_item_carrinho,
    ADD COLUMN tamanho VARCHAR(20) NOT NULL DEFAULT 'Único' AFTER id_produto,
    ADD CONSTRAINT uq_item_carrinho UNIQUE (id_carrinho, id_produto, tamanho);

ALTER TABLE item_compra
    DROP INDEX uq_item_compra,
    ADD COLUMN tamanho VARCHAR(20) NOT NULL DEFAULT 'Único' AFTER id_produto,
    ADD CONSTRAINT uq_item_compra UNIQUE (id_compra, id_produto, tamanho);

CREATE TABLE newsletter_inscricao (
    id_inscricao INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(150) NOT NULL UNIQUE,
    consentimento_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
