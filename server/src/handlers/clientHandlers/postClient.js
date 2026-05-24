const bcrypt = require('bcrypt');
const crypto = require('crypto');
const validation = require('../../utils/validations');
const { postClientQueryBuilder } = require('../../utils/queryBuilder');
const createError = require('../../utils/errorBuilder');

const postClient = async (req, res) => {
    try {
        const { columnsQuery, placeholders, values } = await postClientQueryBuilder(req.body);

        const insertQuery = `INSERT INTO clients (${columnsQuery}) VALUES (${placeholders})`;

        await req.pool.query( insertQuery, values );

        const getQuery = `SELECT id, email, business_name, tax_id, status, is_admin, verification_token FROM clients WHERE email = ?`;

        const [rows] = await req.pool.query( getQuery, [req.body.email] );
        if(!rows || rows.length===0) {
            throw createError('Error al recuperar el cliente creado', 500, 'DATA_CONSISTENCY_ERROR');
        }

        return res.status(201).json( rows[0] );
    } catch(error) {
        console.error('Error creando cliente:', error.code||error);

        if(error.code==='ER_DUP_ENTRY') return res.status(409).json( { error: 'El cliente ya existe' } );

        return res.status(error.status || 500).json({ error: error.message });
    }
}

module.exports = postClient;