const createError = require('../../utils/errorBuilder');
const { getInvoiceWithItems, generateInvoiceNumber } = require('../../utils/invoiceUtils');
const { validateId, validatePaymentTerms } = require('../../utils/validations');

const confirmInvoice = async (req, res) => {    
    let connection;

    try {
        connection = await req.pool.getConnection();

        await connection.beginTransaction();
    
        const { id } = req.client;

        const { payment_terms, notes } = req.body;
        
        validatePaymentTerms(payment_terms);

        const [rows] = await connection.query('SELECT id FROM invoices WHERE status = "draft" AND client_id = ?', [ id ]);
        if(rows.length===0) {
            throw createError('No se encontró ningún invoice activo', 404, 'INVOICE_NOT_FOUND');
        }

        const caseConditions = [];
        const values = [];
        const ids = [];

        let total = 0;

        const invoice = await getInvoiceWithItems(connection, rows[0].id);

        invoice.products.forEach( (invoice_item) => {
            const newReservedStock = invoice_item.reserved_stock + invoice_item.quantity;
            if(newReservedStock <= invoice_item.stock)
            {
                caseConditions.push('WHEN id = ? THEN  ?');
                
                values.push(invoice_item.product_id, newReservedStock);
                ids.push(invoice_item.product_id);

                const subtotal = invoice_item.price_at_addition * invoice_item.quantity;
                total+=subtotal;
            }
            else
            {
                throw createError(`Sin stock suficiente en producto ID: ${invoice_item.product_id}`, 409, 'INSUFFICIENT_STOCK');
            }
        })

        const batchUpdateQuery =
        `UPDATE products
        SET reserved_stock = CASE
            ${caseConditions.join(' ')}
            ELSE reserved_stock
        END
        WHERE id IN (${ids.map( () => '?' ).join(', ')})`

        values.push( ...ids );

        await connection.query(batchUpdateQuery, values);

        const invoice_number = generateInvoiceNumber();

        const updateInvoiceQuery =
        `UPDATE invoices
        SET status = 'confirmed',
            invoice_number = ?,
            issue_date = CURDATE(),
            due_date = DATE_ADD(CURDATE(), INTERVAL ? DAY),
            payment_terms = ?,
            total = ?,
            notes = ?
        WHERE id = ?`;

        const [result] = await connection.query(updateInvoiceQuery, [ invoice_number, payment_terms, String(payment_terms), total, notes, rows[0].id ]);
        if(result.affectedRows===0) {
            throw createError('No se actualizó el invoice en el paso final', 500, 'DATA_CONSISTENCY_ERROR');
        }

        await connection.commit();

        return res.status(200).json( {message: 'Invoice confirmado', invoice_id: id, invoice_number} );
    } catch(error) {
        await connection.rollback();
        console.error( "Error confirmando invoice:", error.code || error );
        return res.status(error.status||500).json( {error: error.message || error} );
    } finally {
        connection.release();
    }    
}

module.exports = confirmInvoice;