const createError = require('../../utils/errorBuilder');
const { getInvoiceWithItems } = require('../../utils/invoiceUtils');
const { validateId } = require('../../utils/validations');

const deliverInvoice = async (req, res) => {
    let connection;
    
    try {
        const { id } = req.params;
        validateId(id);
        
        connection = await req.pool.getConnection();
        
        await connection.beginTransaction();

        const caseConditions = [];

        const stockValues = [];
        const reservedStockValues = [];

        const ids = [];

        const invoice = await getInvoiceWithItems(connection, id);

        if(invoice.status!=='confirmed') {
            throw createError('Invoice no previamente confirmado', 403, 'ONLY_CONFIRMED_INVOICES_CAN_BE_DELIVERED');
        }

        invoice.products.forEach( (invoice_item) => {
            const newStock = invoice_item.stock - invoice_item.quantity;
            const newReservedStock = invoice_item.reserved_stock - invoice_item.quantity;

            if(newStock >= 0 && newReservedStock >=0)
            {
                caseConditions.push('WHEN id = ? THEN  ?');

                stockValues.push(invoice_item.product_id, newStock);
                reservedStockValues.push(invoice_item.product_id, newReservedStock);
                
                ids.push(invoice_item.product_id);
            }
            else {
                throw createError(`Error con stock||reserved_stock en producto ID: ${invoice_item.product_id}`, 500, 'DATA_CONSISTENCY_ERROR');
            }
        })

        const batchUpdateQuery =
        `UPDATE products
        SET
            reserved_stock = CASE
            ${caseConditions.join(' ')}
            ELSE reserved_stock
        END,
            stock = CASE
            ${caseConditions.join(' ')}
            ELSE stock
        END
        WHERE id IN (${ids.map( () => '?' ).join(', ')})`

        await connection.query(batchUpdateQuery, [...reservedStockValues, ...stockValues, ...ids ]);

        const updateInvoiceQuery =
        `UPDATE invoices
        SET status = 'delivered',
            delivered_at = CURRENT_TIMESTAMP
        WHERE id = ?`;

        const [result] = await connection.query(updateInvoiceQuery, [ id ]);
        if(result.affectedRows===0) {
            throw createError('No se actualizó el invoice en el paso final', 500, 'COULDNT_UPDATE_INVOICE');
        }

        await connection.commit();

        return res.status(200).json( {message: 'Invoice entregado', invoice_id: id } );
    } catch(error) {
        if(connection) await connection.rollback();
        console.error( "Error entregando invoice:", error.code || error );
        return res.status(error.status||500).json( {error: error.message || error} );
    } finally {
        if(connection) connection.release();
    }    
}

module.exports = deliverInvoice;