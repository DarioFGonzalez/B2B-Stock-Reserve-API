const {Router} = require('express');
const productsRouter = Router();
const postProduct = require('../../handlers/productHandlers/postProduct');
const { getAllproducts, getProductById, getProductsByQuery } = require('../../handlers/productHandlers/getProducts');
const { updateProduct, toggleProduct } = require('../../handlers/productHandlers/updateProduct');
const authMiddleware = require('../../middlewares/auth');
const {adminOnly} = require('../../middlewares/adminOnly');

//Public routes

/**
 * @swagger
 * /products/all:
 *   get:
 *     summary: (👥) Entrega todos los productos en base de datos.
 *     description: Entrega un array con los datos básicos de todos los productos en base de datos.
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Devuelve un array con todos los productos en base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/productPublic'
 *             example:
 *               - id: e7b5f3e4-49b0-11f1-acdd-507b9d97da6f
 *                 sku: SKU-004
 *                 name: Monitor 24"
 *                 description: Full HD, IPS, 75Hz
 *                 category: Electronica
 *                 unit_price: 180000.00
 *                 stock: 30
 *                 reserved_stock: 10
 *                 is_active: 1
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Error interno del servidor
 *               code: INTERNAL_SERVER_ERROR
 */

productsRouter.get('/all', getAllproducts);

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: (👥) Busca productos por filtros específicos by query.
 *     description: Entrega los datos básicos del los productos que coincidan con los filtros de búsqueda enviados por query.
 *     tags:
 *       - Products
 *     parameters:
 *       - $ref: '#/components/parameters/querySku'
 *       - $ref: '#/components/parameters/queryName'
 *       - $ref: '#/components/parameters/queryCategory'
 *       - $ref: '#/components/parameters/queryUnitPrice'
 *       - $ref: '#/components/parameters/queryStock'
 *       - $ref: '#/components/parameters/queryReservedStock'
 *       - $ref: '#/components/parameters/queryIsActive'
 *     responses:
 *       200:
 *         description: Devuelve un array con todos los productos que cumplen con las condiciones de búsqueda.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/productPublic'
 *             example:
 *               - id: e7b58c1f-49b0-11f1-acdd-507b9d97da6f
 *                 sku: SKU-003
 *                 name: Teclado Mecanico
 *                 description: Redragon Kumara
 *                 category: Electronica
 *                 unit_price: 35000.00
 *                 stock: 80
 *                 reserved_stock: 5
 *                 is_active: 1
 *       400:
 *         description: Enviamos un body vacío o ninguna condición válida de búsqueda.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               body_vacío:
 *                 summary: ⭕ Body vacío
 *                 value:
 *                   error: No se recibió nada por body
 *                   code: RECEIVED_AN_EMPTY_BODY
 *               sin_condiciones_válidas:
 *                 summary: ⚠ Condiciones inválidas
 *                 value:
 *                   error: Sin filtros válidos
 *                   code: NO_VALID_FILTERS_TO_SEARCH
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Error interno del servidor
 *               code: INTERNAL_SERVER_ERROR
 */

productsRouter.get('/search', getProductsByQuery);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: (👥) Entrega todos los datos un producto.
 *     operationId: getProductById
 *     description: Entrega los datos completos del producto dueño del ID enviado por parámetro.
 *     tags:
 *       - Products
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *          example: e7b50924-49b0-11f1-acdd-507b9d97da6f
 *     responses:
 *       200:
 *         description: Devuelve un objeto con todos los datos del producto.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/productPublic'
 *             example:
 *               id: e7b50924-49b0-11f1-acdd-507b9d97da6f
 *               sku: SKU-002
 *               name: Mouse Inalambrico
 *               description: Logitech MX Master 3
 *               category: Electronica
 *               unit_price: 45000.00
 *               stock: 150
 *               reserved_stock: 0
 *               is_active: 1
 *       400:
 *         description: Hay problemas con el ID recibido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *             examples:
 *               id_inexistente:
 *                 summary: ✖ No había ID en el token
 *                 value:
 *                   error: ID no recibido
 *                   code: ID_REQUIRED
 *               id_con_formato_inválido:
 *                 summary: ✖ ID con formato inválido
 *                 value:
 *                   error: Formato del ID inválido
 *                   code: INVALID_ID_FORMAT
 *       404:
 *         description: No hay un producto con ese ID en la base de datos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *             example:
 *               error: Producto no encontrado
 *               code: PRODUCT_NOT_FOUND
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *             example:
 *               error: Error interno del servidor
 *               code: INTERNAL_SERVER_ERROR
 */

productsRouter.get('/:id', getProductById);

//Admin routes
productsRouter.use(authMiddleware, adminOnly);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: (🔐) Crear un nuevo registro de producto.
 *     description: |
 *       # 🆕📦 Creación de un nuevo producto
 * 
 *       En esta ruta creamos un nuevo registro de producto con los datos que se reciben por body.
 * 
 *       ---
 * 
 *       ## Requisitos
 *       Esta ruta espera recibir los siguientes datos:
 * 
 *       ### Obligatorios
 *       - sku: Stock Keeping Unit. Código alfanumérico único de identificación comercial. Se utiliza para la gestión de inventario y sincronización con sistemas externos.
 *       - name: Nombre comercial del producto. Debe ser descriptivo y único para facilitar la búsqueda en el catálogo.
 *       - category: Categoría o familia a la que pertenece el producto. Utilizada para la segmentación en búsquedas y reportes de inventario.
 *       - unit_price: Precio unitario de venta en formato decimal. Este valor se captura y congela en la factura al momento de agregar el producto al carrito.
 *       - stock: Cantidad física total disponible en almacén. Representa la existencia real antes de considerar reservas pendientes de entrega.
 *       ### Opcionales
 *       - description: Detalle técnico o comercial del producto. Soporta texto extendido para especificaciones, materiales o dimensiones.
 *       - is_active: Estado lógico del producto. 1 (activo) permite la venta y visualización; 0 (inactivo) actúa como borrado lógico para preservar la integridad referencial de facturas históricas.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/postProduct'
 *           examples:
 *               enviar_con_datos_opcionales:
 *                 summary: ✔ Enviamos datos clave y opcionales.
 *                 description: Se incluyen datos opcionales para tener un registro completo del producto desde el inicio.
 *                 value:
 *                   sku: SKU-016
 *                   name: Velador high-tech Rzrz
 *                   category: Iluminacion
 *                   unit_price: 75000.00
 *                   description: Velador bajo lumen, táctil, múltiples colores y motivos.
 *                   stock: 100
 *                   is_active: 1
 *               solo_datos_necesarios:
 *                 summary: ✔ Enviamos solo datos necesarios.
 *                 description: El producto se crea en estado activo y con los valores opcionales en NULL.
 *                 value:
 *                   sku: SKU-015
 *                   name: Silla Gamer
 *                   category: Mobiliario
 *                   unit_price: 200000.00
 *               enviar_datos_extra:
 *                 summary: ⚠ Todo dato extra/inválido será ignorado.
 *                 description: En caso de recibir datos extra ó inválidos estos serán ignorados y se creará el registro con los datos clave recibidos.
 *                 value:
 *                   sku: SKU-017
 *                   name: Cartucho de tinta (Azul)
 *                   category: Insumos
 *                   unit_price: 50000.00
 *                   manufacturer: HP Inks
 *                   exp_date: 14/06/2026
 *                   legacy_item: false
 *                   returneable: false
 *               falta_dato_obligatorio:
 *                 summary: ✖ No enviamos todos los datos necesarios.
 *                 description: En caso de no recibir datos clave, recibiremos un error detallando los campos faltantes.
 *                 value:
 *                   sku: SKU-018
 *                   name: Luces LED (multicolor)
 *                   category: Iluminacion
 *                   stock: 150
 *                   is_active: 1
 *     responses:
 *       201:
 *         description: |
 *           # ✅📦 Producto creado exitosamente
 *           El registro del producto se creó exitosamente, recibimos como respuesta un objeto con los datos del producto en cuestión.
 * 
 *           Con el `ID` que recibimos en la respuesta de esta ruta, podemos:
 * 
 *           ---
 * 
 *           ### 👥 Ruta pública
 *           - [Consultar los datos](#operations-Products-getProductById) de este producto
 *           ### 🔐 Solo administradores
 *           - [Actualizar datos](#operations-Products-updateProduct) del producto
 *           - [Desactivar](#operations-Products-toggleProduct) el producto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/productPublic'
 *             example:
 *               id: d577c6c0-4d45-11f1-b0fe-507b9d97da6f
 *               sku: SKU-999
 *               name: Notebook ÚLTIMO MODELO
 *               description: Notebook último modelo de la marca Rzrz
 *               category: Electronica
 *               unit_price: 1250000.00
 *               stock: 75
 *               reserved_stock: 0
 *               is_active: 1
 *       400:
 *         description: No se enviaron todos los campos obligatorios.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *                 missingFields:
 *                   type: array
 *                   items:
 *                     type: string
 *               example:
 *                 error: >
 *                   Faltan campos obligatorios: sku, name, category, unit_price
 *                 code: MISSING_REQUIRED_FIELDS
 *                 missingFields: [ sku, name, category, unit_price ]
 *       404:
 *         description: No hay un producto con ese ID en la base de datos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *             example:
 *               error: Producto no encontrado
 *               code: PRODUCT_NOT_FOUND
 *       409:
 *         description: Ya existe un registro con valor clave idéntico.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: El producto ya existe
 *               code: ER_DUP_ENTRY
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_se_pudo_crear_el_producto:
 *                  summary: ✖ No se pudo crear el producto
 *                  description: Aunque los datos fueron enviados y eran correctos hubo un error durante la creación.
 *                  value:
 *                    error: No se pudo crear el registro del producto.
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

productsRouter.post('/', postProduct);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: (🔐) Actualiza datos del producto.
 *     operationId: updateProduct
 *     description: |
 *       # 🔁📦 Actualizar datos del producto
 *       En esta ruta enviamos el ID del producto y los datos a actualizar para modificar su registro en base de datos.
 * 
 *       ---
 * 
 *       ## Datos requeridos
 *       Esta ruta espera el ID por parámetros y los datos a actualizar por body de la siguiente manera:
 * 
 *       1. ID por parámetros
 *       ```json
 *       https://tudominio.com/products/e7b49539-49b0-11f1-acdd-507b9d97da6f
 *       ```
 *       2. Datos a modificar por body
 *       ```json
 *       {
 *         "unit_price": 1500.75
 *       }
 *       ```
 * 
 *       ---
 * 
 *       ## Proceso
 *       Esta ruta se cerciora de lo siguiente:
 * 
 *       1. Recibir valores válidos para actualizar
 *       2. Que el producto exista
 *       3. Actualiza el registro y lo devuelve actualizado
 * 
 *       > `⚠` Todas las excepciones contempladas en los errores ejemplo más abajo.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *          example: e7b49539-49b0-11f1-acdd-507b9d97da6f
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/updateProduct'
 *           examples:
 *               cambiar_valores_permitidos:
 *                 summary: ✔ Cambiamos valores permitidos.
 *                 value:
 *                   name: Notebook promedio
 *                   description: i5, 8GB RAM, Integrated graphics
 *                   unit_price: 350000.00
 *                   stock: 75
 *                   reserved_stock: 0
 *               enviar_valores_mixtos:
 *                 summary: ⚠ Enviamos valores inválidos.
 *                 description: Cualquier valor no permitido será ignorado, mientras la petición tenga un valor válido la actualización tendrá lugar.
 *                 value:
 *                   unit_price: 450000.00
 *                   manufacturer: Sony
 *                   outdated: true
 *                   warranty_lasts: 1 Año
 *                   imported_at: 02/02/2023
 *               enviar_solo_valores_inválidos:
 *                 summary: ✖ Enviamos solo valores inválidos.
 *                 description: Enviar solo valores no permitidos para actualización devolverá un mensaje de error.
 *                 value:
 *                   name: Dario F. Gonzalez
 *                   stack: PERN
 *                   experience: 3+ Years
 *                   actual_status: Freelancer
 *                   github: github.com/DarioFGonzalez
 *                   ready_to_work: true
 *               enviar_body_vacío:
 *                 summary: ✖ Enviamos un body vacío.
 *                 description: Enviar un body vacío devolverá un mensaje de error.
 *                 value: {}
 *     responses:
 *       200:
 *         description: Devuelve el registro completo del producto actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *             example:
 *               id: e7b49539-49b0-11f1-acdd-507b9d97da6f
 *               sku: SKU-001
 *               name: Notebook promedio
 *               description: i5, 8GB RAM, Integrated graphics
 *               unit_price: 350000.00
 *               stock: 75
 *               reserved_stock: 0
 *               is_active: 1
 *               created_at: 2026-05-07T01:05:57.000Z
 *               updated_at: 2026-05-10T22:49:18.000Z
 *       400:
 *         description: No se recibió nada por body o no hay condiciones válidas para actualizar.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               body_vacío:
 *                 summary: ⭕ Body vacío
 *                 value:
 *                   error: No se recibió nada por body
 *                   code: RECEIVED_AN_EMPTY_BODY
 *               sin_condiciones_válidas:
 *                 summary: ⚠ Condiciones inválidas
 *                 value:
 *                   error: Sin condiciones para actualizar
 *                   code: NO_VALID_CONDITIONS_TO_UPDATE
 *       404:
 *         description: Producto con esa ID no encontrado en base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               body_vacío:
 *                 summary: ❓ Producto no encontrado
 *                 value:
 *                   error: Producto no encontrado
 *                   code: PRODUCT_NOT_FOUND
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_conseguimos_datos_actualizados:
 *                  summary: ✖ No se pudo traer el producto actualizado
 *                  value:
 *                    error: El producto desapareció durante la petición
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

productsRouter.patch('/:id', updateProduct);

/**
 * @swagger
 * /products/{id}/toggle-active:
 *   patch:
 *     summary: (🔐) Alterna el estado del producto [active/inactive].
 *     operationId: toggleProduct
 *     description: Enviamos un ID por params, el servidor busca ese producto -> encuentra su estado actual -> lo actualiza por su opuesto. [ Active / Inactive ]
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Devuelve un mensaje confirmando la actualización del estado del producto.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: Estado del producto actualizado
 *       400:
 *         description: Problemas con el ID enviado o el estado actual del producto.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               id_no_recibido:
 *                 summary: ⭕ No enviamos ID
 *                 value:
 *                   error: ID no recibido
 *                   code: ID_REQUIRED
 *               id_con_formato_inválido:
 *                 summary: ⚠ Enviamos ID inválido
 *                 value:
 *                   error: Formato del ID inválido
 *                   code: INVALID_ID_FORMAT
 *       404:
 *         description: No encontramos un producto con esa ID en la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Producto no encontrado
 *               code: PRODUCT_NOT_FOUND
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Error interno del servidor
 *               code: INTERNAL_SERVER_ERROR
 */

productsRouter.patch('/:id/toggle-active', toggleProduct);

module.exports = productsRouter;