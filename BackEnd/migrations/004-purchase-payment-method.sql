USE recyclewear_db;

ALTER TABLE compra
    ADD COLUMN metodo_pagamento ENUM('credito', 'debito', 'pix') NOT NULL DEFAULT 'pix'
    AFTER local_entrega;
