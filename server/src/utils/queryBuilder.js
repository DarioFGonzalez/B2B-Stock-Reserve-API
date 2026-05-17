const { isValidUUID } = require("./validations");
const validation = require('./validations');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const createError = require("./errorBuilder");

/*REFACTOR*/
//Post query builders
const postQueryBuilder = (allowedParams) => (queries) => {
    const columns = [];
    const placeholders = [];
    const values = [];

    for(const [key, value] of Object.entries(queries) ) {
        if( allowedParams.includes(key) ) {
            columns.push(key);
            placeholders.push('?');
            values.push(value);
        }
    }

    let columnsQuery = columns.join(', ');

    return { columnsQuery, placeholders, values };
}

const postClientQueryBuilder = async (queries) => {
    const mandatoryColumns = [ 'business_name', 'tax_id', 'email', 'password' ];
    const optionalColumns = [ 'phone', 'address', 'contact_name', 'contact_phone', 'verification_token' ];

    checkMandatoryColumns(mandatoryColumns, queries);

    validation.validateEmail(queries.email);
    validation.validatePassword(queries.password);
    
    const hashedPassword = await bcrypt.hash( queries.password, 10 );

    queries.password = hashedPassword;

    const verificationToken = crypto.randomBytes(32).toString('hex');

    queries.verification_token = verificationToken;

    const builder = postQueryBuilder( [...mandatoryColumns, ...optionalColumns] );

    return builder(queries);
}

const postProductQueryBuilder = (queries) => {
    const mandatoryColumns = [ 'sku', 'name', 'category', 'unit_price' ];
    const optionalColumns = [ 'description', 'stock', 'is_active' ];

    checkMandatoryColumns(mandatoryColumns, queries);

    const builder = postQueryBuilder([...mandatoryColumns, ...optionalColumns]);
    return builder(queries);
}

//GET by Query Builders
const getByQueryBuilder = (allowedFilters) => (queries) => {
    if(Object.keys(queries).length===0) {
        throw createError('No se recibió nada por body', 400, 'RECEIVED_AN_EMPTY_BODY');
    }

    const filters = [];
    const values = [];

    for(const [key, value] of Object.entries(queries)) {
        if(allowedFilters.includes(key)) {
            filters.push(`${key} = ?`);
            values.push(value);
        }
    }

    if(filters.length===0) {
        throw createError('Sin filtros válidos', 400, 'NO_VALID_FILTERS_TO_SEARCH');
    }

    const queryFilters = filters.join(' AND ');

    return { queryFilters, values };
}

const searchClientsQuery = getByQueryBuilder(['phone', 'address', 'contact_name', 'contact_phone', 'business_name', "email", "status", "tax_id", "is_admin"]);
const searchProductQuery = getByQueryBuilder(['sku', 'name', 'category', 'unit_price', 'stock', 'reserved_stock', 'is_active']);

//UPDATE Builders
const updateQueryBuilder = (allowedParams) => (queries) => {
    if(Object.keys(queries).length===0) {
        throw createError('No se recibió nada por body', 400, 'RECEIVED_AN_EMPTY_BODY');
    }

    const conditions = [];
    const values = [];

    for(const [key, value] of Object.entries(queries) ) {
        if( allowedParams.includes(key) ) {
            conditions.push(`${key} = ?`);
            values.push(value);
        }
    }

    if(conditions.length===0) {
        throw createError('Sin condiciones para actualizar', 400, 'NO_VALID_CONDITIONS_TO_UPDATE');
    }

    const conditionsQuery = conditions.join(', ');

    //Check this: reemplazar conditionsQuery en sus invocaciones
    // const conditionsQuery = conditions.join(', ');

    return { conditionsQuery, values };
}

const updateClientBuilder = updateQueryBuilder([ 'phone', 'address', 'contact_name', 'contact_phone' ]);
const updateProductBuilder = updateQueryBuilder([ 'name', 'description', 'unit_price', 'stock', 'reserved_stock' ]);

//Helpers
const checkMandatoryColumns = (mandatoryColumns, queries) => {
    const missingFields = mandatoryColumns.filter( field => !(field in queries));
    if(missingFields.length>0) {
        throw createError(`Faltan campos obligatorios: ${missingFields.join(', ')}`, 400, 'MISSING_REQUIRED_FIELDS', missingFields);
    }
    
    return true;
}

const invoiceByQueryBuilder =(queries) =>
{
    const { issue_date_from, issue_date_to, due_date_from, due_date_to, total_from, total_to, paid_at_from, paid_at_to } = queries;
    const { client_id, status, invoice_number, payment_terms } = queries;

    const conditions = [];
    const values = [];

    if(issue_date_from && issue_date_to)
    {
        conditions.push('issue_date BETWEEN ? AND ?');
        values.push(issue_date_from, issue_date_to);        
    }
    else
    {
        if(issue_date_from)
        {
            conditions.push(`issue_date >= ?`);
            values.push(issue_date_from);
        }
        if(issue_date_to)
        {
            conditions.push('issue_date <= ?');
            values.push(issue_date_to);
        }
    }

    if(due_date_from && due_date_to)
    {
        conditions.push('due_date BETWEEN ? AND ?');
        values.push(due_date_from, due_date_to);
    }
    else
    {
        if(due_date_from)
        {
            conditions.push('due_date >= ?');
            values.push(due_date_from);
        }
        if(due_date_to)
        {
            conditions.push('due_date <= ?');
            values.push(due_date_to);
        }
    }

    if(total_from && total_to)
    {
        conditions.push('total BETWEEN ? AND ?');
        values.push(total_from, total_to);
    }
    else
    {
        if(total_from)
        {
            conditions.push('total >= ?');
            values.push(total_from);
        }
        if(total_to)
        {
            conditions.push('total <= ?');
            values.push(total_to);
        }
    }

    if(paid_at_from && paid_at_to)
    {
        conditions.push('paid_at BETWEEN ? AND ?');
        values.push(paid_at_from, paid_at_to);
    }
    else
    {
        if(paid_at_from)
        {
            conditions.push('paid_at >= ?');
            values.push(paid_at_from);
        }
        if(paid_at_to)
        {
            conditions.push('paid_at <= ?');
            values.push(paid_at_to);
        }
    }

    if(client_id)
    {
        if(isValidUUID(client_id)) {
            conditions.push('client_id = ?');
            values.push(client_id);
        }
        else {
            throw createError('El formato del ID recibido por query es inválido', 400, 'INVALID_ID_FORMAT');
        }
    }

    const allowedStatus = [ 'draft', 'confirmed', 'delivered', 'paid', 'cancelled' ];

    if(status)
    {
        if(allowedStatus.includes(status))
        {
            conditions.push('status = ?');
            values.push(status)
        }
        else
        {
            throw createError(`STATUS inválido, valores permitidos: ${allowedStatus.join(', ')}`, 400, 'INVALID_STATUS');
        }
    }

    const allowedPaymentTerms = [ '30', '60', '90', '120' ];

    if(payment_terms)
    {
        if(allowedPaymentTerms.includes(payment_terms))
        {
            conditions.push('payment_terms = ?');
            values.push(payment_terms);
        }
        else {
            throw createError(`Término de pago inválido, valores válidos: ${allowedPaymentTerms.join(', ')}`, 400, 'INVALID_PAYMENT_TERMS');
        }
    }

    if(invoice_number)
    {
        conditions.push('invoice_number LIKE ?');
        values.push(`%${invoice_number}%`);
    }

    if(conditions.length===0) {
        throw createError('No se recibieron parámetros de búsqueda válidos', 400, 'MISSING_SEARCH_PARAMETERS');
    }

    const whereClause = conditions.join(' AND ');

    return { whereClause, values };
}

module.exports = {
    postClientQueryBuilder, postProductQueryBuilder,
    searchClientsQuery, searchProductQuery,
    updateClientBuilder, updateProductBuilder,
    updateQueryBuilder,
    invoiceByQueryBuilder };