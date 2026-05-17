const createError = require("../../utils/errorBuilder");
const { validateId } = require("../../utils/validations");

const payInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        validateId(id);

        const [invoiceStatus] = await req.pool.query('SELECT status FROM invoices WHERE id = ?', [id]);
        if(invoiceStatus.length===0) {
            throw createError('Invoice no encontrado', 404, 'INVOICE_NOT_FOUND');
        }

        const {status} = invoiceStatus[0];
        const validStatus = [ 'confirmed', 'delivered' ];
        if(!validStatus.includes(status)) {
            throw createError('Status del invoice inválido para aceptar pago', 403, 'INVALID_INVOICE_STATUS');
        }

        const [result] = await req.pool.query('UPDATE invoices SET status = "paid", paid_at = CURRENT_TIMESTAMP WHERE id = ?', [ id ]);
        if(result.affectedRows===0) {
            throw createError('No se actualizó el invoice en el paso final', 500, 'DATA_CONSISTENCY_ERROR');
        }

        return res.status(200).json( {message: 'Invoice actualizado a "paid"', invoiceId: id} );
    } catch(error) {
        console.error( "Error actualizando invoice a 'paid': ", error.code || error );
        return res.status(error.status||500).json( {error: error.message || error} );
    }
}

module.exports = payInvoice;