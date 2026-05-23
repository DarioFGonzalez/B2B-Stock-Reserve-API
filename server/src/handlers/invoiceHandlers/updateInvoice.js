const createError = require('../../utils/errorBuilder');
const validation = require('../../utils/validations');

const updateInvoice = async (req, res) => {
    try {
        const { id } = req.client;

        const [thisInvoice] = await req.pool.query('SELECT id FROM invoices WHERE status = draft AND client_id = ?', [ id ]);
        if(thisInvoice.length===0) {
            throw createError('Invoice activo no encontrado', 404, 'ACTIVE_INVOICE_NOT_FOUND');
        }

        const invoiceId = thisInvoice[0].id;

        const productIds = [];

        const productsBatch = req.body;
        productsBatch.forEach( ( productInfo ) => {
            if(productInfo.quantity==undefined || !productInfo.product_id) {
                throw createError('Faltan datos necesarios para la relación', 400, 'MISSING_RELATION_DATA');
            }

            validation.validateId(productInfo.product_id);
            productIds.push(productInfo.product_id);
        })

        const placeHolders = productIds.map( () => '?' ).join(', ');

        const findProductsByIdQuery = `SELECT products.id AS product_id, products.unit_price, products.stock, products.reserved_stock FROM products WHERE products.id IN (${placeHolders})`;

        const [allProductsInfo] = await req.pool.query( findProductsByIdQuery, productIds );
        if(allProductsInfo.length!==productIds.length) {
            throw createError('Error trayendo información de productos', 500, 'DATA_CONSISTENCY_ERROR');
        }

        const finalValues = [];
        const finalPlaceholders = [];

        const toDestroyValues = [];
        const toDestroyPlaceholders = [];

        productsBatch.forEach( (pInfo) => {
            const fetchedProductInfo = allProductsInfo.find( (x) => x.product_id === pInfo.product_id );
            if(!fetchedProductInfo) {
                throw createError(`Error trayendo información sobre el producto id ${pInfo.product_id}`, 500, 'DATA_CONSISTENCY_ERROR');
            }

            if(pInfo.quantity<=0) {
                toDestroyValues.push(pInfo.product_id);
                toDestroyPlaceholders.push('?');
            }
            else {
                if(fetchedProductInfo.reserved_stock + pInfo.quantity <= fetchedProductInfo.stock)
                {
                    finalValues.push(invoiceId, pInfo.product_id, pInfo.quantity, fetchedProductInfo.unit_price, pInfo.quantity * fetchedProductInfo.unit_price )
                    finalPlaceholders.push( '(?, ?, ?, ?, ?)' );
                }
                else
                {
                    throw createError(`Stock insuficiente en producto ID ${pInfo.product_id}`, 409, 'INSUFFICIENT_STOCK');
                }
            }
        })

        if(toDestroyValues.length!==0)
        {
            const destroyBatchQuery =
            `DELETE
            FROM invoice_items
            WHERE invoice_id = ?
            AND product_id IN (${toDestroyPlaceholders.join(', ')})`;

            await req.pool.query(destroyBatchQuery, [invoiceId, ...toDestroyValues]);
        }

        if(finalPlaceholders.length > 0)
        {
            const insertOrUpdateBatchQuery = `INSERT INTO invoice_items
                (invoice_id, product_id, quantity, unit_price, subtotal)
                VALUES ${finalPlaceholders.join(', ')}
                ON DUPLICATE KEY UPDATE
                    quantity = VALUES(quantity),
                    subtotal = VALUES(subtotal),
                    updated_at = CURRENT_TIMESTAMP`;
            
            await req.pool.query( insertOrUpdateBatchQuery, finalValues );
        }

        return res.status(200).json( { message: 'Invoice actualizado' } );
    } catch(error) {
        console.error( "Error actualizando muchos invoice:", error.code||error );
        return res.status(error.status||500).json( {error: error.message || error} );
    }
}

module.exports = { updateInvoice };