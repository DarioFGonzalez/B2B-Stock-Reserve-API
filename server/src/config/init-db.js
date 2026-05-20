const pool = require('./db');
const bcrypt = require('bcrypt');

const tables = {
    clients: `
        CREATE TABLE IF NOT EXISTS clients (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            business_name VARCHAR(255) NOT NULL UNIQUE,
            tax_id VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            phone VARCHAR(20) DEFAULT NULL,
            address TEXT,
            contact_name VARCHAR(100) DEFAULT NULL,
            contact_phone VARCHAR(20) DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
            password VARCHAR(255) NOT NULL,
            last_login DATETIME DEFAULT NULL,
            verification_token VARCHAR(255) DEFAULT NULL,
            email_verified_at DATETIME DEFAULT NULL,
            is_admin TINYINT(1) DEFAULT 0,
            approved_at DATETIME DEFAULT NULL,
            status ENUM('pending', 'confirmed', 'active', 'inactive') DEFAULT 'pending'
        )
    `,
    products: `
        CREATE TABLE IF NOT EXISTS products (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            sku VARCHAR(50) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            category VARCHAR(50) NOT NULL,
            unit_price DECIMAL(12,2) NOT NULL,
            stock INT NOT NULL DEFAULT 0,
            reserved_stock INT NOT NULL DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `,
    invoices: `
        CREATE TABLE IF NOT EXISTS invoices (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            client_id CHAR(36) NOT NULL,
            status ENUM('draft','confirmed','delivered','paid','cancelled') DEFAULT 'draft',
            invoice_number VARCHAR(50) DEFAULT NULL,
            issue_date DATE DEFAULT NULL,
            due_date DATE DEFAULT NULL,
            payment_terms ENUM('30','60','90','120') DEFAULT NULL,
            total DECIMAL(12,2) DEFAULT NULL,
            notes TEXT,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            paid_at DATETIME DEFAULT NULL,
            delivered_at DATETIME DEFAULT NULL,
            UNIQUE KEY invoice_number (invoice_number),
            KEY client_id (client_id),
            CONSTRAINT invoices_ibfk_1 FOREIGN KEY (client_id) REFERENCES clients (id)
        )
    `,
    invoice_items: `
        CREATE TABLE IF NOT EXISTS invoice_items (
            invoice_id CHAR(36) NOT NULL,
            product_id CHAR(36) NOT NULL,
            quantity INT NOT NULL,
            unit_price DECIMAL(12,2) NOT NULL,
            subtotal DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (invoice_id, product_id),
            KEY product_id (product_id),
            CONSTRAINT invoice_items_ibfk_1 FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
            CONSTRAINT invoice_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products (id)
        )
    `,
};

async function seedTestData() {
    const hashUnverified = await bcrypt.hash('test123password', 10);
    const hashCliente = await bcrypt.hash('test123password', 10);
    const hashAdmin = await bcrypt.hash('test123password', 10);

    const unverifiedId = 'aaaaaaa1-aaa1-aaa1-aaa1-aaaaaaaaaaa1';
    const clienteId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const adminId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const now = new Date();

    await pool.query(`
        INSERT INTO clients (
            id, business_name, tax_id, email, password, phone, address,
            contact_name, contact_phone, status, is_admin, email_verified_at, approved_at, verification_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            business_name      = LEFT(business_name, 255),
            tax_id             = tax_id,
            email              = email,
            password           = password,
            status             = status,
            is_admin           = is_admin,
            verification_token = verification_token
    `, [
        unverifiedId, 'Cliente Sin Verificar', '31-12345678-1', 'unverified@demo.com', hashUnverified,
        '1145678902', 'Av. del Libertador 4321', 'Jorge Quiroga', '1156789013',
        'pending', 0, null, null, '7eff170bf6872bff6ce8d4af1c97114aa890da7fa4449554d0378d076906bec1'
    ]);

    await pool.query(`
        INSERT INTO clients (
            id, business_name, tax_id, email, password, phone, address,
            contact_name, contact_phone, status, is_admin, email_verified_at, approved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            business_name      = LEFT(business_name, 255),
            tax_id             = tax_id,
            email              = email,
            password           = password,
            status             = status,
            is_admin           = is_admin
    `, [
        clienteId, 'Cliente Demo', '30-12345678-9', 'cliente@demo.com', hashCliente,
        '1145678901', 'Av. Corrientes 1234', 'Juan Carlos', '1156789012',
        'active', 0, now, now
    ]);

    await pool.query(`
        INSERT INTO clients (
            id, business_name, tax_id, email, password, phone, address,
            contact_name, contact_phone, status, is_admin, email_verified_at, approved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            business_name      = LEFT(business_name, 255),
            tax_id             = tax_id,
            email              = email,
            password           = password,
            status             = status,
            is_admin           = is_admin
    `, [
        adminId, 'Admin Demo', '30-87654321-0', 'admin@demo.com', hashAdmin,
        '1145678902', 'Av. Santa Fe 5678', 'Maria Gonzalez', '1156789013',
        'active', 1, now, now
    ]);

    const productsList = [
        ['e7b49539-49b0-11f1-acdd-507b9d97da6f', 'SKU-001', 'Notebook Gamer', 'i7, 16GB RAM, RTX 3060', 'Electronica', 850000.00, 50, 0],
        ['e7b50924-49b0-11f1-acdd-507b9d97da6f', 'SKU-002', 'Mouse Inalambrico', 'Logitech MX Master 3', 'Electronica', 45000.00, 150, 0],
        ['e7b58c1f-49b0-11f1-acdd-507b9d97da6f', 'SKU-003', 'Teclado Mecanico', 'Redragon Kumara', 'Electronica', 35000.00, 80, 5],
        ['e7b5f3e4-49b0-11f1-acdd-507b9d97da6f', 'SKU-004', 'Monitor 24"', 'Full HD, IPS, 75Hz', 'Electronica', 180000.00, 30, 10]
    ];

    for (const p of productsList) {
        await pool.query(`
            INSERT INTO products (id, sku, name, description, category, unit_price, stock, reserved_stock, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
                name           = name,
                unit_price     = unit_price,
                stock          = stock,
                reserved_stock = reserved_stock
        `, p);
    }

    const [productRows] = await pool.query(`
        SELECT id, sku, unit_price FROM products WHERE sku IN ('SKU-001', 'SKU-002')
    `);

    const producto1 = productRows.find(p => p.sku === 'SKU-001');
    const producto2 = productRows.find(p => p.sku === 'SKU-002');

    const invoiceId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    await pool.query(`
        INSERT INTO invoices (id, client_id, status, notes, created_at)
        VALUES (?, ?, 'draft', 'Carrito de prueba', NOW())
        ON DUPLICATE KEY UPDATE
            status = 'draft',
            notes  = notes
    `, [invoiceId, clienteId]);

    if (producto1) {
        await pool.query(`
            INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, 2, ?, ?)
            ON DUPLICATE KEY UPDATE
                quantity   = quantity,
                unit_price = unit_price,
                subtotal   = subtotal
        `, [invoiceId, producto1.id, producto1.unit_price, producto1.unit_price * 2]);
    }

    if (producto2) {
        await pool.query(`
            INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal)
            VALUES (?, ?, 3, ?, ?)
            ON DUPLICATE KEY UPDATE
                quantity   = quantity,
                unit_price = unit_price,
                subtotal   = subtotal
        `, [invoiceId, producto2.id, producto2.unit_price, producto2.unit_price * 3]);
    }

    if (producto1 || producto2) {
        await pool.query(`
            UPDATE invoices 
            SET total = (SELECT SUM(subtotal) FROM invoice_items WHERE invoice_id = ?)
            WHERE id = ?
        `, [invoiceId, invoiceId]);
    }
}

async function initializeDatabase() {
    try {
        await pool.query(tables.clients);
        await pool.query(tables.products);
        await pool.query(tables.invoices);
        await pool.query(tables.invoice_items);
        await seedTestData();
        console.log('DDBB inyectada con dummys de forma segura.');
    } catch (error) {
        console.error('Error inicializando la base de datos:', error.message);
        throw error;
    }
}

module.exports = { initializeDatabase };