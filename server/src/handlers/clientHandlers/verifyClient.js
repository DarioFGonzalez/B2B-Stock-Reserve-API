const createError = require('../../utils/errorBuilder');
const validation = require('../../utils/validations');

const verifyMail = async (req, res) => {
    try {
        const { verification_token } = req.params;
        validation.validateToken(verification_token);

        const verificationQuery = `
        UPDATE clients
        SET
            status = "confirmed",
            email_verified_at = CURRENT_TIMESTAMP,
            verification_token = NULL
        WHERE verification_token = ? AND status = "pending"`
    
        const [result] = await req.pool.query( verificationQuery, [verification_token] );
        if(result.affectedRows===0) {
            throw createError('Token expirado o cuenta ya verificada', 400, 'ALREADY_VERIFIED_OR_EXPIRED_TOKEN');
        }

        return res.status(200).json( { message: 'Mail del cliente verificado' } );
    } catch(error) {
        console.error('Error verificando email del cliente: ', error.code||error);
        return res.status(error.status || 500).json( {error: error.message||error} );
    }
}

const sendReactivationMail = async (req, res) => {
    const { id } = req.client;

    try {
        const [rows] = await req.pool.query('SELECT verification_token FROM clients WHERE id = ?', [id]);
        if(rows.length===0) {
            throw createError('No se pudo traer el token del cliente', 500, 'DATA_INCONSISTENCY_ERROR');
        }

        const token = rows[0].verification_token;

        //Acá vendría la parte donde usamos NodeMailer para crear el HTML y enviar el correo con el botón de reactivación.
        console.log(`Link de reactivación: https://midominio.com/reactivate/${token}`);

        return res.status(200).json( {message: 'Mail de reactivación enviado', token} );
    } catch(error) {
        console.error("Error enviando mail de reactivación:", error.code||error);
        return res.status(error.status||500).json( {error: error.message||error} );
    }
}

const reactivateMyAccount = async (req, res) => {
    try {
        const { verification_token } = req.params;
        validation.validateToken(verification_token);

        const verificationQuery =
        `UPDATE clients
        SET
            status = "active",
            verification_token = NULL
        WHERE verification_token = ? AND status = "inactive"`
    
        const [result] = await req.pool.query( verificationQuery, [verification_token] );
        if(result.affectedRows===0) {
            throw createError('Token inválido o cliente ya activo', 400, 'INVALID_TOKEN_OR_ACTIVE_ACCOUNT');
        }

        return res.status(200).json( { message: 'Estado del cliente actualizado' } );
    } catch(error) {
        console.error('Error en /client/reactivateMySelf:', error.code||error);
        return res.status(error.status || 500).json( {error: error.message||error} );
    }
}

module.exports = {verifyMail, sendReactivationMail, reactivateMyAccount};