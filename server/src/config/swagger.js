const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'B2B Stock reserve API',
            version: '1.0.0',
            "x-dev-access": 'e2b2ff5c05be70cf10f201f8c2e8241020b08fb1a6583c183669a870f1ef44fdf4a0ad18a817004c2baf1b1da28ee2158218edec3db2c21a86b968df5d80b663',
            description: 
            'Este es el motor de una plataforma B2B enfocada en lo importante: gestionar clientes, inventario y facturación de forma atómica.\n\n' +
            '### 🛠️ Stack y Enfoque\n' +
            'Para este proyecto decidí ir por un camino más artesanal y sólido:\n' +
            '* **Base de Datos:** MySQL usando **Raw Queries**. Sin ORMs; las consultas están escritas con builders personalizados para tener control total sobre performance y estructura de datos.\n' +
            '* **Seguridad:** Autenticación con JWT, roles de usuario y lógica de estados (Activo, Inactivo, Pendiente).\n' +
            '* **Documentación:** Swagger para cada ruta. Cada una con ejemplos de éxito, errores y edge cases además de todos los errores con sus ejemplos y schemas debidamente documentados.\n\n' +
            '---\n\n' +
            '### 🔑 Guía de Accesos\n' +
            'Cada ruta tiene un icono en su descripción inicial para saber que necesitas para usarla sin tener que leer todo el flujo:\n\n' +
            '* **👥 Acceso Público:** Rutas abiertas (Login, Registro, etc.).\n' +
            '* **👤 Requiere Token:** Para clientes logueados. Tenés que pasar el `Bearer Token` en los headers.\n' +
            '* **🔐 Solo Admin:** Rutas de gestión crítica, exclusivas para usuarios con privilegios de administrador.\n\n' +
            '---\n' +
            '**Desarrollado por Darío González, full stack web developer amante del código.**',
            contact: {
                name: 'Dario Fernando Gonzalez',
                email: 'dario.zerobyte@gmail.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Servidor local'
            }
        ],
        components: {
            schemas: {
                Client: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Identificador único universal (UUID) del cliente. Generado automáticamente en el momento del registro.'
                        },
                        business_name: {
                            type: 'string',
                            minLength: 1,
                            description: 'Razón social completa o nombre comercial legalmente registrado de la empresa cliente.'
                        },
                        tax_id: {
                            type: 'string',
                            minLength: 5,
                            description: 'Identificador fiscal único de la entidad (ej CUIT/RUT). Se utiliza para la validación de identidad y facturación.'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Dirección de correo electrónico institucional. Actúa como identificador de acceso y canal principal de notificaciones legales.'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            description: 'Contraseña de acceso al sistema. Debe ser almacenada mediante hashing y cumplir con políticas de seguridad.'
                        },
                        phone: {
                            type: 'string',
                            nullable: true, 
                            description: 'Línea telefónica principal de contacto de la organización.'
                        },
                        address: {
                            type: 'string',
                            nullable: true,
                            description: 'Domicilio fiscal o dirección de contacto de la organización.'
                        },
                        contact_name: {
                            type: 'string',
                            nullable: true,
                            description: 'Nombre y apellido de la persona de contacto designada o representante administrativo.'
                        },
                        contact_phone: {
                            type: 'string',
                            nullable: true,
                            description: 'Telefono de contacto administrativo.'
                        },
                        last_login: {
                            type: 'string',
                            nullable: true,
                            description: 'Fecha y hora del último inicio de sesión exitoso. Se actualiza automáticamente con cada login.'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'confirmed', 'active', 'inactive'],
                            description: 'Estado actual de la cuenta del cliente. pending = email sin verificar, confirmed = email verificado pendiente aprobación admin, active = cuenta habilitada para operar, inactive = cuenta desactivada por el cliente.'
                        },
                        is_admin: {
                            type: 'integer',
                            enum: [0, 1],
                            description: 'Indica si el cliente tiene privilegios de administrador. 0 = cliente común, 1 = administrador.'
                        }
                    }
                },
                clientPublic: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Identificador único universal (UUID) del cliente. Generado automáticamente en el momento del registro.'
                        },
                        business_name: {
                            type: 'string',
                            minLength: 1,
                            description: 'Razón social completa o nombre comercial legalmente registrado de la empresa cliente.'
                        },
                        tax_id: {
                            type: 'string',
                            minLength: 5,
                            description: 'Identificador fiscal único de la entidad (ej CUIT/RUT). Se utiliza para la validación de identidad y facturación.'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Dirección de correo electrónico institucional. Actúa como identificador de acceso y canal principal de notificaciones legales.'
                        },
                        phone: {
                            type: 'string',
                            nullable: true, 
                            description: 'Línea telefónica principal de contacto de la organización.'
                        },
                        address: {
                            type: 'string',
                            nullable: true,
                            description: 'Domicilio fiscal o dirección de contacto de la organización.'
                        },
                        contact_name: {
                            type: 'string',
                            nullable: true,
                            description: 'Nombre y apellido de la persona de contacto designada o representante administrativo.'
                        },
                        contact_phone: {
                            type: 'string',
                            nullable: true,
                            description: 'Telefono de contacto administrativo.'
                        },
                        last_login: {
                            type: 'string',
                            nullable: true,
                            description: 'Fecha y hora del último inicio de sesión exitoso. Se actualiza automáticamente con cada login.'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'confirmed', 'active', 'inactive'],
                            description: 'Estado actual de la cuenta del cliente. pending = email sin verificar, confirmed = email verificado pendiente aprobación admin, active = cuenta habilitada para operar, inactive = cuenta desactivada por el cliente.'
                        },
                        is_admin: {
                            type: 'integer',
                            enum: [0, 1],
                            description: 'Indica si el cliente tiene privilegios de administrador. 0 = cliente común, 1 = administrador.'
                        }
                    }
                },
                clientPrivate: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Identificador único universal (UUID) del cliente. Generado automáticamente en el momento del registro.'
                        },
                        business_name: {
                            type: 'string',
                            minLength: 1,
                            description: 'Razón social completa o nombre comercial legalmente registrado de la empresa cliente.'
                        },
                        tax_id: {
                            type: 'string',
                            minLength: 5,
                            description: 'Identificador fiscal único de la entidad (ej CUIT/RUT). Se utiliza para la validación de identidad y facturación.'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Dirección de correo electrónico institucional. Actúa como identificador de acceso y canal principal de notificaciones legales.'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            description: 'Contraseña de acceso al sistema. Debe ser almacenada mediante hashing y cumplir con políticas de seguridad.'
                        },
                        phone: {
                            type: 'string',
                            nullable: true, 
                            description: 'Línea telefónica principal de contacto de la organización.'
                        },
                        address: {
                            type: 'string',
                            nullable: true,
                            description: 'Domicilio fiscal o dirección de contacto de la organización.'
                        },
                        contact_name: {
                            type: 'string',
                            nullable: true,
                            description: 'Nombre y apellido de la persona de contacto designada o representante administrativo.'
                        },
                        contact_phone: {
                            type: 'string',
                            nullable: true,
                            description: 'Telefono de contacto administrativo.'
                        },
                        last_login: {
                            type: 'string',
                            nullable: true,
                            description: 'Fecha y hora del último inicio de sesión exitoso. Se actualiza automáticamente con cada login.'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'confirmed', 'active', 'inactive'],
                            description: 'Estado actual de la cuenta del cliente. pending = email sin verificar, confirmed = email verificado pendiente aprobación admin, active = cuenta habilitada para operar, inactive = cuenta desactivada por el cliente.'
                        },
                        is_admin: {
                            type: 'integer',
                            enum: [0, 1],
                            description: 'Indica si el cliente tiene privilegios de administrador. 0 = cliente común, 1 = administrador.'
                        },
                        invoices: {
                            type: 'array',
                            description: 'Listado histórico de facturas asociadas al cliente.',
                            items: {
                                type: 'object',
                                properties: {
                                    invoice_id: { type: 'string' },
                                    status: { type: 'string', enum: ['confirmed','delivered','paid','cancelled'] },
                                    issue_date: { type: 'string', format: 'date' },
                                    total: { type: 'number', format: 'double' }
                                }
                            }
                        }
                    }
                },
                postClient: {
                    type: 'object',
                    required: [ 'business_name', 'tax_id', 'email', 'password' ],
                    properties: {
                        business_name: {
                            type: 'string',
                            minLength: 1,
                            description: 'Razón social completa o nombre comercial legalmente registrado de la empresa cliente.'
                        },
                        tax_id: {
                            type: 'string',
                            minLength: 5,
                            description: 'Identificador fiscal único de la entidad (ej CUIT/RUT). Se utiliza para la validación de identidad y facturación.'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Dirección de correo electrónico institucional. Actúa como identificador de acceso y canal principal de notificaciones legales.'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            description: 'Contraseña de acceso al sistema. Debe ser almacenada mediante hashing y cumplir con políticas de seguridad.'
                        },
                        phone: {
                            type: 'string',
                            nullable: true, 
                            description: 'Línea telefónica principal de contacto de la organización.'
                        },
                        address: {
                            type: 'string',
                            nullable: true,
                            description: 'Domicilio fiscal o dirección de contacto de la organización.'
                        },
                        contact_name: {
                            type: 'string',
                            nullable: true,
                            description: 'Nombre y apellido de la persona de contacto designada o representante administrativo.'
                        },
                        contact_phone: {
                            type: 'string',
                            nullable: true,
                            description: 'Telefono de contacto administrativo.'
                        }
                    }
                },
                updateClient: {
                    type: 'object',
                    properties: {
                        phone: { type: 'string' },
                        address: { type: 'string' },
                        contact_name: { type: 'string' },
                        contact_phone: { type: 'string' }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        sku: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string' },
                        unit_price: { type: 'number', format: 'double' },
                        stock: { type: 'number' },
                        reserved_stock: { type: 'number' },
                        is_active: { type: 'integer', enum: [0, 1] },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                productPublic: { 
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Identificador único universal (UUID) del producto. Generado automáticamente en el momento del registro.'
                        },
                        sku: {
                            type: 'string',
                            description: 'Stock Keeping Unit. Código alfanumérico único de identificación comercial. Se utiliza para la gestión de inventario y sincronización con sistemas externos.'
                        },
                        name: {
                            type: 'string',
                            description: 'Nombre comercial del producto. Debe ser descriptivo y único para facilitar la búsqueda en el catálogo.'
                        },
                        description: {
                            type:'string',
                            description: 'Detalle técnico o comercial del producto. Soporta texto extendido para especificaciones, materiales o dimensiones.'
                        },
                        category: {
                            type: 'string',
                            enum: [ 'Electronica', 'Mobiliario', 'Iluminacion', 'Insumos' ],
                            description: 'Categoría o familia a la que pertenece el producto. Utilizada para la segmentación en búsquedas y reportes de inventario.'
                        },
                        unit_price: {
                            type: 'number',
                            format: 'double',
                            description: 'Precio unitario de venta en formato decimal. Este valor se captura y congela en la factura al momento de agregar el producto al carrito.'
                        },
                        stock: {
                            type: 'number',
                            description: 'Cantidad física total disponible en almacén. Representa la existencia real antes de considerar reservas pendientes de entrega.'
                        },
                        reserved_stock: {
                            type: 'number',
                            description: 'Cantidad de unidades comprometidas en pedidos confirmados pero aún no entregados. Este valor garantiza la integridad del inventario durante el ciclo de venta.'
                        },
                        is_active: {
                            type: 'number',
                            enum: [0,1],
                            description: 'Estado lógico del producto. 1 (activo) permite la venta y visualización; 0 (inactivo) actúa como borrado lógico para preservar la integridad referencial de facturas históricas.'
                        }
                    }
                },
                postProduct: {
                    type: 'object',
                    required: [ 'sku', 'name', 'category', 'unit_price' ],
                    properties: {
                        sku: {
                            type: 'string',
                            description: 'Stock Keeping Unit. Código alfanumérico único de identificación comercial. Se utiliza para la gestión de inventario y sincronización con sistemas externos.'
                        },
                        name: {
                            type: 'string',
                            description: 'Nombre comercial del producto. Debe ser descriptivo y único para facilitar la búsqueda en el catálogo.'
                        },
                        category: {
                            type: 'string',
                            enum: [ 'Electronica', 'Mobiliario', 'Iluminacion', 'Insumos' ],
                            description: 'Categoría o familia a la que pertenece el producto. Utilizada para la segmentación en búsquedas y reportes de inventario.'
                        },
                        unit_price: {
                            type: 'number',
                            format: 'double',
                            description: 'Precio unitario de venta en formato decimal. Este valor se captura y congela en la factura al momento de agregar el producto al carrito.'
                        },
                        description: {
                            type:'string',
                            description: 'Detalle técnico o comercial del producto. Soporta texto extendido para especificaciones, materiales o dimensiones.'
                        },
                        stock: {
                            type: 'number',
                            description: 'Cantidad física total disponible en almacén. Representa la existencia real antes de considerar reservas pendientes de entrega.'
                        },
                        is_active: {
                            type: 'number',
                            enum: [0,1],
                            description: 'Estado lógico del producto. 1 (activo) permite la venta y visualización; 0 (inactivo) actúa como borrado lógico para preservar la integridad referencial de facturas históricas.'
                        }
                    }
                },
                updateProduct: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        unit_price: { type: 'number', format: 'double' },
                        stock: { type: 'integer' },
                        reserved_stock: { type: 'integer' }
                    }
                },
                invoicePrivate: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        client_id: { type: 'string' },
                        status: { type: 'string', enum: ['draft', 'confirmed', 'delivered','paid','cancelled']},
                        invoice_number: { type: 'string' },
                        issue_date: { type: 'string', format: 'date', nullable: true },
                        due_date: { type: 'string', format: 'date', nullable: true },
                        payment_terms: { type: 'integer', enum: [ 30, 60, 90, 120 ] },
                        total: { type: 'number', format: 'double', nullable: true },
                        notes: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        paid_at: { type: 'string', format: 'date-time', nullable: true },
                        delivered_at: { type: 'string', format: 'date-time', nullable: true },
                        products: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/invoiceItem'
                            }
                        }
                    }
                },
                invoicePublic: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        client_id: { type: 'string' },
                        status: { type: 'string', enum: ['draft', 'confirmed', 'delivered','paid','cancelled']},
                        total: { type: 'number', format: 'double', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        issue_date: { type: 'string', format: 'date', nullable: true },
                        due_date: { type: 'string', format: 'date', nullable: true },
                        delivered_at: { type: 'string', format: 'date-time', nullable: true },
                        paid_at: { type: 'string', format: 'date-time', nullable: true }
                    }
                },
                invoiceItem: {
                    type: 'object',
                    properties: {
                        product_id: { type: 'string' },
                        product_name: { type: 'string' },
                        price_at_addition: { type: 'number', format: 'double' },
                        quantity: { type: 'integer' },
                        stock: { type: 'integer' },
                        reserved_stock: { type: 'integer' },
                        subtotal: { type: 'number', format: 'double' }
                    }
                },
                errorMessage: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        code: { type: 'string' }
                    }
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 
                    '### 🔒 Autenticación JWT\n\n' +
                    'Usá uno de los siguientes tokens para probar directamente desde el botón **Authorize**:\n\n' +
                    '#### 👤 Cliente\n' +
                    '```\n' +
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFhYWFhYWFhLWFhYWEtYWFhYS1hYWFhLWFhYWFhYWFhYWFhYSIsImlhdCI6MTc3ODI2NjE2OX0.i6Yy2RKn-0L0IUNqqrHZIitT65qTUXWph5VVqmZbCN8\n' +
                    '```\n\n' +
                    '#### 🔐 Administrador\n' +
                    '```\n' +
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJiYmJiYmJiLWJiYmItYmJiYi1iYmJiLWJiYmJiYmJiYmJiYiIsImlhdCI6MTc3ODI2NjE2OX0.cYOl52pFNLxugK_Jcj7RthjvIHtcLwo5ComnbMnAXik\n' +
                    '```\n\n' +
                    '#### 🚫 Sin token\n' +
                    'No ingreses nada en el authorize para testear las respuestas **401 Unauthorized**.'
                }
            },
            parameters: {
                //Client queries
                queryBusinessName: {
                    in: 'query',
                    name: 'business_name',
                    example: 'Admin Demo',
                    schema: { type: 'string' },
                    description: 'Razón social completa o nombre comercial legalmente registrado de la empresa cliente.'
                },
                queryTaxId: {
                    in: 'query',
                    name: 'tax_id',
                    example: '30-87654321-0',
                    schema: { type: 'string' },
                    description: 'Identificador fiscal único de la entidad (ej CUIT/RUT). Se utiliza para la validación de identidad y facturación.'
                },
                queryEmail: {
                    in: 'query',
                    name: 'email',
                    example: 'admin@demo.com',
                    schema: { type: 'string' },
                    description: 'Dirección de correo electrónico institucional. Actúa como identificador de acceso y canal principal de notificaciones legales.'
                },
                queryPhone: {
                    in: 'query',
                    name: 'phone',
                    example: '1145678902',
                    schema: { type: 'string' },
                    description: 'Línea telefónica principal de contacto de la organización.'
                },
                queryAddress: {
                    in: 'query',
                    name: 'address',
                    example: 'Av. Santa Fe 5678',
                    schema: { type: 'string' },
                    description: 'Domicilio fiscal o dirección de contacto de la organización.'
                },
                queryContactName: {
                    in: 'query',
                    name: 'contact_name',
                    example: 'Maria Gonzalez',
                    schema: { type: 'string' },
                    description: 'Nombre y apellido de la persona de contacto designada o representante administrativo.'
                },
                queryContactPhone: {
                    in: 'query',
                    name: 'contact_phone',
                    example: '1156789013',
                    schema: { type: 'string' },
                    description: 'Telefono de contacto administrativo.'
                },
                queryIsAdmin: {
                    in: 'query',
                    name: 'is_admin',
                    example: 1,
                    schema: { type: 'integer', enum: [0, 1] },
                    description: 'Indica si el cliente tiene privilegios de administrador. 0 = cliente común, 1 = administrador.'
                },
                queryStatus: {
                    in: 'query',
                    name: 'status',
                    example: 'active',
                    schema: { type: 'string', enum: [ 'pending', 'confirmed', 'active', 'inactive' ] },
                    description: 'Estado actual de la cuenta del cliente. pending = email sin verificar, confirmed = email verificado pendiente aprobación admin, active = cuenta habilitada para operar, inactive = cuenta desactivada por el cliente.'
                },
                // Product queries
                querySku: {
                    in: 'query',
                    name: 'sku',
                    schema: { type: 'string' },
                    example: 'SKU-003',
                    description: 'Buscamos por código de identificación comercial único'
                },
                queryName: {
                    in: 'query',
                    name: 'name',
                    schema: { type: 'string' },
                    example: 'Teclado Mecanico',
                    description: 'Buscamos por nombre del producto'
                },
                queryCategory: {
                    in: 'query',
                    name: 'category',
                    schema: { type: 'string', enum: [ 'Electronica', 'Mobiliario', 'Iluminacion', 'Insumos' ] },
                    example: 'Electronica',
                    description: 'Buscamos por categoria'   
                },
                queryUnitPrice: {
                    in: 'query',
                    name: 'unit_price',
                    schema: { type: 'number', format: 'double' },
                    example: 35000.00,
                    description: 'Buscamos por precio exacto'
                },
                queryStock: {
                    in: 'query',
                    name: 'stock',
                    schema: { type: 'number' },
                    example: 80,
                    description: 'Buscamos por stock exacto'
                },
                queryReservedStock: {
                    in: 'query',
                    name: 'reserved_stock',
                    schema: { type: 'number' },
                    example: 5,
                    description: 'Buscamos por stock reservado exacto'
                },
                queryIsActive: {
                    in: 'query',
                    name: 'is_active',
                    schema: { type: 'integer', enum: [0, 1] },
                    example: 1,
                    description: 'Buscamos por estado del producto [0 = inactivo] [1 = activo]'
                },
                // Invoice queries
                queryIssueDateFrom: {
                    in: 'query',
                    name: 'issue_date_from',
                    schema: { type: 'string', format: 'date' },
                    example: '2026-01-01',
                    description: 'Filtra facturas emitidas desde esta fecha (inclusive). Formato ISO 8601: YYYY-MM-DD.'
                },
                queryIssueDateTo: {
                    in: 'query',
                    name: 'issue_date_to',
                    schema: { type: 'string', format: 'date' },
                    example: '2026-12-31',
                    description: 'Filtra facturas emitidas hasta esta fecha (inclusive). Formato ISO 8601: YYYY-MM-DD.'
                },
                queryDueDateFrom: {
                    in: 'query',
                    name: 'due_date_from',
                    schema: { type: 'string', format: 'date' },
                    example: '2026-01-01',
                    description: 'Filtra facturas con fecha de vencimiento desde esta fecha (inclusive).'
                },
                queryDueDateTo: {
                    in: 'query',
                    name: 'due_date_to',
                    schema: { type: 'string', format: 'date' },
                    example: '2026-12-31',
                    description: 'Filtra facturas con fecha de vencimiento hasta esta fecha (inclusive).'
                },
                queryTotalFrom: {
                    in: 'query',
                    name: 'total_from',
                    schema: { type: 'number', format: 'double' },
                    description: 'Filtra facturas con total mayor o igual a este valor.'
                },
                queryTotalTo: {
                    in: 'query',
                    name: 'total_to',
                    schema: { type: 'number', format: 'double' },
                    description: 'Filtra facturas con total menor o igual a este valor.'
                },
                queryPaidAtFrom: {
                    in: 'query',
                    name: 'paid_at_from',
                    schema: { type: 'string', format: 'date-time' },
                    description: 'Filtra facturas pagadas desde esta fecha/hora (inclusive).'
                },
                queryPaidAtTo: {
                    in: 'query',
                    name: 'paid_at_to',
                    schema: { type: 'string', format: 'date-time' },
                    description: 'Filtra facturas pagadas hasta esta fecha/hora (inclusive).'
                },
                queryClientId: {
                    in: 'query',
                    name: 'client_id',
                    schema: { type: 'string', format: 'uuid' },
                    example: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                    description: 'UUID del cliente. Filtra facturas pertenecientes a un cliente específico.'
                },
                queryInvoiceStatus: {
                    in: 'query',
                    name: 'status',
                    schema: { 
                        type: 'string', 
                        enum: ['draft', 'confirmed', 'delivered', 'paid', 'cancelled'] 
                    },
                    example: 'draft',
                    description: 'Estado actual de la factura. draft = borrador, confirmed = confirmada, delivered = entregada, paid = pagada, cancelled = cancelada.'
                },
                queryInvoiceNumber: {
                    in: 'query',
                    name: 'invoice_number',
                    schema: { type: 'string' },
                    description: 'Número de factura. Soporta búsqueda parcial (contiene).'
                },
                queryPaymentTerms: {
                    in: 'query',
                    name: 'payment_terms',
                    schema: { type: 'integer', enum: [30, 60, 90, 120] },
                    description: 'Días de plazo para el pago. 30 = neto 30, 60 = neto 60, etc.'
                }
            },
            examples: {
            }
        }
    },
    apis: ['./src/routes/**/*.js', './src/handlers/*.js']
};

module.exports = swaggerJSDoc(options);