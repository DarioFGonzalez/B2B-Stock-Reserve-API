const jwt = require('jsonwebtoken');
const createError = require('../utils/errorBuilder');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader) {
            throw createError('No se recibió token via header', 401, 'MISSING_AUTH_HEADER');
        }

        const token = authHeader.split(' ')[1];
        if(!token) {
            throw createError('No se recibió token via header', 401, 'MISSING_AUTH_HEADER');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [status] = await req.pool.query('SELECT status, is_admin FROM clients WHERE id = ?', [decoded.id]);

        decoded.status = status[0].status;
        decoded.is_admin = status[0].is_admin;

        req.client = decoded;

        next();
    } catch(error) {
        console.error("Error en el middleware de autenticación:", error.code||error);
        if(error.name==='JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        if(error.name==='TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }

        return res.status(error.status||500).json({ error: error.message || 'No autorizado' });
    }
}

module.exports = authMiddleware;