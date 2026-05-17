const createError = require('./errorBuilder');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailRegex = /^[^\s@]{3,}@([^\s@]+\.)+[^\s@]{2,}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const tokenRegex = /^[0-9a-f]{64}$/i;

const selectedFields = 'id, business_name, tax_id, email, phone, address, contact_name, contact_phone, last_login, status, is_admin';
const productFields = 'id, sku, name, description, category, unit_price, stock, reserved_stock, is_active';
const invoiceFields = 'id, client_id, status, total, created_at, issue_date, due_date, delivered_at, paid_at';

const isValidUUID = (uuid) => {
    if(!uuid || typeof uuid !== 'string') return false;
    return uuidRegex.test(uuid);
}

const isValidEmail = (email) => {
    if(!email || typeof email !== 'string') return false;
    return emailRegex.test(email);
}

const isValidToken = (token) => {
    if(!token || typeof token !== 'string') return false;
    return tokenRegex.test(token);
}

//toReplace with validatePassword
const isValidPassword = (password) => {
    if(!password || typeof password !== 'string') return false;
    return passwordRegex.test(password);
}

const validatePassword = (password) => {
    if(!password) {
        throw createError('Contraseña no recibida', 400, 'PASSWORD_REQUIRED');
    }
    if(!passwordRegex.test(password)) {
        throw createError('Formato de la contraseña inválido', 400, 'INVALID_PASSWORD_FORMAT');
    }

    return true
}

const validateId = (id) => {
    if(!id) {
        throw createError('ID no recibido', 400, 'ID_REQUIRED');
    }
    if(!isValidUUID(id)) {
        throw createError('Formato del ID inválido', 400, 'INVALID_ID_FORMAT');
    }

    return true;
}

const validateToken = (token) => {
    if(!token) {
        throw createError('Token no recibido', 400, 'TOKEN_REQUIRED');
    }
    if(!tokenRegex.test(token)) {
        throw createError('Formato del token inválido', 400, 'INVALID_TOKEN_FORMAT');
    }
    
    return true;
}

const validatePaymentTerms = (payment_terms) => {
    if(!payment_terms) {
        throw createError('Términos de pago no recibidos', 400, 'PAYMENT_TERMS_REQUIRED');
    }

    const allowedPaymentTerms = [ '30', '60', '90', '120' ];
    
    if(!allowedPaymentTerms.includes(payment_terms)) {
        throw createError('Término de pago no válido', 400, 'INVALID_PAYMENT_TERM');
    }

    return true;
}

const validateEmail = (email) => {
    if(!email) {
        throw createError('Email no recibido', 400, 'EMAIL_REQUIRED');
    }
    if(!emailRegex.test(email)) {
        throw createError('Formato del email inválido', 400, 'INVALID_EMAIL_FORMAT');
    };

    return true;
}

module.exports = {
    selectedFields, productFields, invoiceFields,
    isValidUUID, isValidEmail, isValidPassword, isValidToken,
    validateId, validateEmail, validatePassword, validatePassword, validateToken,
    validatePaymentTerms,
 };