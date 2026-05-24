const createError = require("./errorBuilder");

const getInvoiceWithItems = async (pool, id) => {
    const getInvoiceByIdQuery = 'SELECT * FROM invoices WHERE id = ?';

    const [invoice] = await pool.query(getInvoiceByIdQuery, [id]);
    if(invoice.length===0) {
        throw createError('Invoice no encontrado', 404, 'INVOICE_NOT_FOUND');
    }

    const getProductsRelatedToInvoice =
    `SELECT
    products.id AS product_id,
    products.name AS product_name,
    invoice_items.unit_price AS price_at_addition,
    invoice_items.quantity AS quantity,
    products.stock AS stock,
    products.reserved_stock AS reserved_stock,
    invoice_items.subtotal AS subtotal
    FROM invoices
    JOIN invoice_items ON invoice_items.invoice_id = invoices.id
    JOIN products ON invoice_items.product_id = products.id
    WHERE invoices.id = ?`;
    
    const [productsRelated] = await pool.query( getProductsRelatedToInvoice, [id] );
    
    invoice[0].products = productsRelated;

    return invoice[0];
}

const generateInvoiceNumber = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${date}-${random}`;
};

module.exports = { getInvoiceWithItems, generateInvoiceNumber };