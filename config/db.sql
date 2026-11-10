CREATE DATABASE IF NOT EXISTS recyclewear_db;
USE recyclewear_db;

-- 1. USUARIOS
CREATE TABLE usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    verificado BOOLEAN NOT NULL DEFAULT FALSE,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATEGORIAS
CREATE TABLE categoria (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(80) NOT NULL UNIQUE,
    descricao VARCHAR(255)
);

-- 3. PRODUTOS
CREATE TABLE produto (
    id_produto INT PRIMARY KEY AUTO_INCREMENT,
    id_categoria INT NOT NULL,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    material VARCHAR(150) NOT NULL
        DEFAULT 'Plástico reciclado retirado do oceano',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_produto_preco CHECK (preco >= 0),
    CONSTRAINT chk_produto_estoque CHECK (estoque >= 0),

    CONSTRAINT fk_produto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria(id_categoria)
);

-- 4. CARRINHOS
CREATE TABLE carrinho (
    id_carrinho INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    status ENUM('ativo', 'finalizado', 'abandonado')
        NOT NULL DEFAULT 'ativo',
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_carrinho_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);

-- 5. ITENS DO CARRINHO
CREATE TABLE item_carrinho (
    id_item INT PRIMARY KEY AUTO_INCREMENT,
    id_carrinho INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,

    CONSTRAINT uq_item_carrinho
        UNIQUE (id_carrinho, id_produto),

    CONSTRAINT chk_item_quantidade CHECK (quantidade > 0),

    CONSTRAINT fk_item_carrinho
        FOREIGN KEY (id_carrinho)
        REFERENCES carrinho(id_carrinho)
        ON DELETE CASCADE,

    CONSTRAINT fk_item_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto(id_produto)
);

-- 6. COMPRAS
CREATE TABLE compra (
    id_compra INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    data_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pendente', 'paga', 'enviada',
                'entregue', 'cancelada')
        NOT NULL DEFAULT 'pendente',
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT chk_compra_total CHECK (valor_total >= 0),

    CONSTRAINT fk_compra_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);

-- 7. ITENS DA COMPRA
CREATE TABLE item_compra (
    id_item_compra INT PRIMARY KEY AUTO_INCREMENT,
    id_compra INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,

    CONSTRAINT uq_item_compra
        UNIQUE (id_compra, id_produto),

    CONSTRAINT chk_compra_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_compra_preco CHECK (preco_unitario >= 0),

    CONSTRAINT fk_item_compra_compra
        FOREIGN KEY (id_compra)
        REFERENCES compra(id_compra),

    CONSTRAINT fk_item_compra_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto(id_produto)
);

-- 8. NOTAS FISCAIS
CREATE TABLE nota_fiscal (
    id_nota INT PRIMARY KEY AUTO_INCREMENT,
    id_compra INT NOT NULL UNIQUE,
    numero VARCHAR(50) NOT NULL UNIQUE,
    data_emissao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10,2) NOT NULL,

    CONSTRAINT chk_nota_total CHECK (valor_total >= 0),

    CONSTRAINT fk_nota_compra
        FOREIGN KEY (id_compra)
        REFERENCES compra(id_compra)
);

SHOW TABLES;

DESC carrinho;

DESC categoria;

DESC compra;

DESC item_carrinho;

DESC item_compra;

DESC nota_fiscal;

DESC produto;

DESC usuario;