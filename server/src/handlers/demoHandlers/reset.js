const {initializeDatabase} = require('../../config/init-db');

const resetDatabase = async (req, res) => {
    try {
        await req.pool.query('SET FOREIGN_KEY_CHECKS = 0');

        await req.pool.query('TRUNCATE TABLE clients');
        await req.pool.query('TRUNCATE TABLE invoice_items');
        await req.pool.query('TRUNCATE TABLE invoices');
        await req.pool.query('TRUNCATE TABLE products');

        await req.pool.query('SET FOREIGN_KEY_CHECKS = 1');

        await initializeDatabase();

        return res.status(200).json( { message: 'Database reseteada', timestamp: new Date().toISOString()} );
    } catch(error) {
        console.error("Error reseteando base de datos:", error.code||error);
        return res.status(error.status||500).json({error: error.message||error});
    }
}

module.exports = resetDatabase;