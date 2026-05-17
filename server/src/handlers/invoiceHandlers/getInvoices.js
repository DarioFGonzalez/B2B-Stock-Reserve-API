const { getInvoiceWithItems } = require('../../utils/invoiceUtils');
const { invoiceByQueryBuilder } = require('../../utils/queryBuilder');
const validation = require('../../utils/validations');

const getAllInvoices = async (req, res) => {
    try {
        const [invoices] = await req.pool.query(`SELECT ${validation.invoiceFields} FROM invoices`);

        return res.status(200).json( invoices );
    } catch(error) {
        console.error( "Error trayendo todos los invoices:", error.code||error );
        return res.status(error.status||500).json( {error: error.message||error} );
    }
}

const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        validation.validateId(id);

        const invoice = await getInvoiceWithItems(req.pool, id);

        return res.status(200).json( invoice );
    } catch(error) {
        console.error( "Error trayendo invoice por ID:", error.code||error );
        return res.status(error.status||500).json( {error: error.message || error} );
    }
}

const getInvoicesByQuery = async (req, res) => {
    try {
        const { whereClause, values } = invoiceByQueryBuilder(req.query);
        
        const [rows] = await req.pool.query(`SELECT ${validation.invoiceFields} FROM invoices WHERE ${whereClause}`, values);
        return res.status(200).json( rows );
    }
    catch(error) {
        console.error('Error en /clients:', error.code || error);
        res.status(error.status || 500).json( { error: error.message || 'Error interno' } );
    }
};

module.exports = { getAllInvoices, getInvoiceById, getInvoicesByQuery };