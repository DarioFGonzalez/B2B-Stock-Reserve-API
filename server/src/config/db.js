require('dotenv').config({ quiet: true });
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
const isProduction = process.env.NODE_ENV === 'production';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in .env');
}

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    //basic connection
    host: DB_HOST || 'localhost',
    user: DB_USER || 'root',
    password: DB_PASSWORD || '',
    database: DB_NAME || 'test_db',
    //traffic
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    charset: 'utf8mb4',
    //CA
    ssl: isProduction
    ? { rejectUnauthorized: true }
    : {rejectUnauthorized: false },
});

module.exports = pool;