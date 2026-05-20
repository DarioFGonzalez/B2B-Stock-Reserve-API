const createError = require("../utils/errorBuilder");

const adminOnly = (req, res, next) => {
    try {
        if(!req.client?.is_admin) {
            throw createError('Solo administradores', 403, 'UNAUTHORIZED');
        }

        next();
    } catch(error) {
        console.error("Error en el middleware de autenticación para administradores:", error.code||error);
        if(error.name==='JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        if(error.name==='TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }

        return res.status(error.status||401).json({ error: error.message||'No autorizado' });
    }
}

const activeClientOnly = (req, res, next) => {
    try {
        console.log(req.client);
        if(req.client?.status!=='active') {
            throw createError('Solo clientes activos.', 403, 'UNAUTHORIZED');
        }

        next();
    } catch(error) {
        console.error("Error en el middleware de autenticación de usuarios activos:", error.code||error);
        if(error.name==='JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        if(error.name==='TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }

        return res.status(error.status||401).json({ error: error.message||'No autorizado' });
    }
}

module.exports = {adminOnly, activeClientOnly};