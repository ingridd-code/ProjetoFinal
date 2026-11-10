import mysql from 'mysql2/promise';

const conexao = mysql.createPool({
    host: 'localhost',
    user: 'root',
    port: '3306',
    password: 'senai',
    database: 'recyclewear_db',
});

export default conexao;