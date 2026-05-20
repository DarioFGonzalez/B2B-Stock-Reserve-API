const createError = require("../../utils/errorBuilder");
const validation = require("../../utils/validations");

const getMyProfile = async (req, res) => {
    const { id } = req.client;

    try {
        const [userInfo] = await req.pool.query(`SELECT ${validation.selectedFields} FROM clients WHERE id = ?`, [id]);
        if(userInfo.length === 0) {
            throw createError('El cliente autenticado ya no existe en el sistema', 500, 'DATA_CONSISTENCY_ERROR');
        }

        return res.status(200).json(userInfo[0]);
    } catch(error) {
        console.error("Error trayendo perfíl del cliente:", error.code||error);
        return res.status(error.status||500).json( {error: error.message||error} );
    }
}

module.exports = getMyProfile;