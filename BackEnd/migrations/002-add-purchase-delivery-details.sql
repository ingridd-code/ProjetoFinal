ALTER TABLE compra
    ADD COLUMN data_entrega DATE NULL AFTER data_compra,
    ADD COLUMN local_entrega VARCHAR(255) NULL AFTER data_entrega;
