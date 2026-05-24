const {Router} = require('express');
const invoicesRouter = Router();
const postInvoice = require('../../handlers/invoiceHandlers/postInvoice');
const { getAllInvoices, getInvoiceById, getInvoicesByQuery } = require('../../handlers/invoiceHandlers/getInvoices');
const { updateInvoice } = require('../../handlers/invoiceHandlers/updateInvoice');
const confirmInvoice = require('../../handlers/invoiceHandlers/confirmInvoice');
const deliverInvoice = require('../../handlers/invoiceHandlers/deliverInvoice');
const payInvoice = require('../../handlers/invoiceHandlers/payInvoice');
const cancelInvoice = require('../../handlers/invoiceHandlers/cancelInvoice');
const authMiddleware = require('../../middlewares/auth');
const { activeClientOnly, adminOnly } = require('../../middlewares/adminOnly');
const { getMyInvoices, getThisInvoice, getMyActiveInvoice } = require('../../handlers/invoiceHandlers/getMyInvoices');

//Client routes
invoicesRouter.use(authMiddleware);

//Only active clients
invoicesRouter.use(activeClientOnly);

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: (👤) Crea un nuevo registro de factura.
 *     operationId: postInvoice
 *     description: |
 *       ### 📃 Creación de una nueva factura
 *       En esta ruta, creamos una factura a nombre del cliente logeado. 
 * 
 *       ---
 * 
 *       ## Requisitos
 *       1. Enviamos por body el id del primer producto y la cantidad del mismo a agregar.
 *       ```json
 *       {
 *         "product_id": "e7b50924-49b0-11f1-acdd-507b9d97da6f",
 *         "quantity": 10
 *       }
 *       ``` 
 * 
 *       ---
 * 
 *       ## Proceso
 *       La ruta se cerciora de lo siguiente:
 *       - Cantidad mayor a cero
 *       - Que no exista otra factura activa
 *       - Que el producto exista
 *       - Que haya suficiente stock del producto que estamos agregando
 *       
 *       De estar todo en orden:
 *       - Crea la factura a nombre del cliente.
 *       - Crea el registro en la tabla intermedia entre Factura y Producto (invoice_items)
 *       - Devuelve el ID de la factura recién creada.
 * 
 *       > `🤝` Todo este proceso se lleva a cabo utilizando transacciones para mantener un código atómico y evitar condiciones de carrera.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 min: 1
 *           examples:
 *               enviamos_datos_válidos:
 *                 summary: ✔ Enviamos datos válidos.
 *                 description: Enviamos ID del producto y la cantidad a agregar en la factura.
 *                 value:
 *                   product_id: e7b50924-49b0-11f1-acdd-507b9d97da6f 
 *                   quantity: 4
 *               enviar_datos_extra:
 *                 summary: ⚠ Todo dato extra/inválido será ignorado.
 *                 description: En caso de recibir datos extra estos serán ignorados y se creará el registro con los datos obligatorios.
 *                 value:
 *                   product_id: e7b5f3e4-49b0-11f1-acdd-507b9d97da6f
 *                   quantity: 1
 *                   paid: true
 *                   total: 175.55
 *               falta_dato_obligatorio:
 *                 summary: ✖ No enviamos todos los datos necesarios.
 *                 description: En caso de no recibir un dato clave, recibiremos un error detallando el campo faltante.
 *                 value:
 *                   product_id: e7b49539-49b0-11f1-acdd-507b9d97da6f
 *               producto_inexistente:
 *                 summary: ✖ Enviamos un producto que no existe.
 *                 description: Si enviamos un ID que no le pertenece a ningún producto en DDBB, recibiremos un error como respuesta.
 *                 value:
 *                   product_id: g7b49539-49b0-11f1-acdd-507b9d97da6f
 *                   quantity: 10
 *               cantidad_inválida:
 *                 summary: ✖ Enviamos cantidad inválida.
 *                 description: Si enviamos una cantidad menor o igual a cero, recibiremos un error como respuesta.
 *                 value:
 *                   product_id: e7b49539-49b0-11f1-acdd-507b9d97da6f
 *                   quantity: -10
 *     responses:
 *       201:
 *         description: |
 *           ### ✅ Factura creada con éxito
 *           La factura se crea exitosamente en estado 'Draft'. Recibimos el ID de la factura recién creada como respuesta.
 * 
 *           Ahora que tenemos una factura activa, podemos:
 * 
 *           ---
 * 
 *           ### 🔎📃 Consultar datos de la **factura activa**
 *           Podemos ver los detalles y productos relacionados con la factura activa desde la siguiente ruta:
 *           - [Consultar factura activa](#operations-Invoices-getMyActiveInvoice)
 * 
 *           ---
 * 
 *           ### ➕📃 Agregar items a la **factura activa**
 *           Podemos agregar, quitar o modificar productos de la factura activa desde la siguiente ruta:
 *           - [Modificar factura activa](#operations-Invoices-updateMyInvoice)
 * 
 *           ---
 * 
 *           
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invoiceId:
 *                   type: string
 *             example:
 *               invoiceId: cccccccc-cccc-cccc-cccc-cccccccccccc
 *       400:
 *         description: ID del producto/cantidad faltante o con formato inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               id_no_recibidos:
 *                 summary: ✖ ID no recibido
 *                 value:
 *                   error: ID no recibido
 *                   code: ID_REQUIRED
 *               id_con_formato_inválido:
 *                 summary: ✖ ID con formato inválido
 *                 value:
 *                   error: Formato del ID inválido
 *                   code: INVALID_ID_FORMAT
 *               cantidad_inválida_o_no_recibida:
 *                  summary: ✖ Cantidad inválida
 *                  value:
 *                    error: La cantidad debe ser mayor que cero
 *                    code: INVALID_QUANTITY
 *       404:
 *         description: No se encontró un producto con esa ID en la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Producto no encontrado
 *               code: PRODUCT_NOT_FOUND
 *       409:
 *         description: Ya existe una factura activa o el producto no cuenta con stock suficiente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *                 details:
 *                   type: string
 *             examples:
 *               ya_existe_un_draft:
 *                 summary: El cliente ya tiene una factura activa
 *                 value:
 *                   error: El cliente ya tiene un invoice activo
 *                   code: DRAFT_ALREADY_EXISTS
 *                   details: ID del Invoice existente cccccccc-cccc-cccc-cccc-cccccccccccc
 *               sin_stock_suficiente:
 *                 summary: Producto sin stock suficiente
 *                 value:
 *                   error: No hay suficiente stock del producto seleccionado
 *                   code: INSUFFICIENT_STOCK
 *                   details: El producto id 123123 tiene stock real de 10 y necesitamos 15
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_se_pudo_recuperar_la_factura_creada:
 *                  summary: ✖ No se pudo traer la nueva factura de DDBB
 *                  value:
 *                    error: Error al recuperar la factura creada
 *                    code: DATA_CONSISTENCY_ERROR
 *               no_se_pudo_crear_la_relacional:
 *                  summary: ✖ Error al crear la relacional
 *                  value:
 *                    error: Error al crear la relacional
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

invoicesRouter.post('/', postInvoice);

/**
 * @swagger
 * /invoices/me:
 *   get:
 *     summary: (👤) Entrega las facturas del usuario logeado.
 *     operationId: getMyInvoices
 *     description: |
 *       ### 📃 Todas nuestras facturas
 *       Esta ruta entrega un array con la información básica de todas facturas del usuario logeado.
 * 
 *       - Utiliza el ID del token de seguridad para la búsqueda.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: |
 *           ### [📃, 📃] Array de facturas ó vacío
 *           Devuelve un array con la información básica de cada una de las facturas del cliente logeado.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/invoicePublic'
 *             example:
 *               - id: cccccccc-cccc-cccc-cccc-cccccccccccc
 *                 client_id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
 *                 status: draft
 *                 total: null
 *                 created_at: 2026-05-07T01:05:57.000Z
 *                 issue_date: null
 *                 due_date: null
 *                 delivered_at: null
 *                 paid_at: null
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

invoicesRouter.get('/me', getMyInvoices);

/**
 * @swagger
 * /invoices/me/active:
 *   get:
 *     summary: (👤) Entrega todos los datos de la factura activa del cliente logeado.
 *     operationId: getMyActiveInvoice
 *     description: |
 *       ### 🔎📃 Todo sobre la factura activa
 *       Entrega todos los datos de la factura activa del cliente logeado.
 * 
 *       - Datos completos de la factura
 *       - Array con todos los productos relacionados a la misma
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: |
 *           ### ✅📃 Factura activa encontrada
 *           
 *           Devuelve un objeto con la factura activa y todos los productos relacionados en la propiedad "products".
 * 
 *           ### ❎📃 Sin factura activa
 *           
 *           En caso de no tener una factura activa, la ruta devuelve un objeto vacío.
 * 
 *           > `📃` Formato de ambas respuestas en los ejemplos más abajo.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/invoicePrivate'
 *                 - type: 'object'
 *                   description: Objeto vacío cuando no hay factura activa
 *                   example: {}
 *             examples:
 *               con_factura:
 *                 summary: 📃 Existe una factura activa
 *                 value:
 *                   id: 7937fef3-4f19-11f1-aac0-507b9d97da6f
 *                   client_id: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
 *                   status: draft
 *                   invoice_number: null
 *                   issue_date: null
 *                   due_date: null
 *                   payment_terms: null
 *                   total: null
 *                   notes: null
 *                   created_at: 2026-05-13T22:17:05.000Z
 *                   updated_at: 2026-05-13T22:17:05.000Z
 *                   paid_at: null
 *                   delivered_at: null
 *                   products:
 *                     - product_id: e7b50924-49b0-11f1-acdd-507b9d97da6f
 *                       product_name: Mouse Inalambrico
 *                       price_at_addition: 45000
 *                       quantity: 10
 *                       stock: 150
 *                       reserved_stock: 0
 *                       subtotal: 450000
 *               sin_factura:
 *                 summary: ❓ Sin factura activa
 *                 value: {}
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

invoicesRouter.get('/me/active', getMyActiveInvoice);

/**
 * @swagger
 * /invoices/me/{invoiceId}:
 *   get:
 *     summary: (👤) Entrega todos los datos de la factura activa del cliente logeado.
 *     description: Entrega todos los datos de la factura activa mas los productos relacionados con la misma.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: invoiceId
 *        required: true
 *        schema:
 *          type: string
 *          example: cccccccc-cccc-cccc-cccc-cccccccccccc
 *     responses:
 *       200:
 *         description: Devuelve un objeto con la factura deseada y todos los productos relacionados en la propiedad "products".
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/invoicePrivate'
 *             example:
 *               id: 7937fef3-4f19-11f1-aac0-507b9d97da6f
 *               client_id: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
 *               status: draft
 *               invoice_number: null
 *               issue_date: null
 *               due_date: null
 *               payment_terms: null
 *               total: null
 *               notes: null
 *               created_at: 2026-05-13T22:17:05.000Z
 *               updated_at: 2026-05-13T22:17:05.000Z
 *               paid_at: null
 *               delivered_at: null
 *               products:
 *                 - product_id: e7b50924-49b0-11f1-acdd-507b9d97da6f
 *                   product_name: Mouse Inalambrico
 *                   price_at_addition: 45000
 *                   quantity: 10
 *                   stock: 150
 *                   reserved_stock: 0
 *                   subtotal: 450000
 *       400:
 *         description: ID inexistente o con formato inválido.
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
 *       403:
 *         description: El invoice que buscamos no le pertenece al cliente logeado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Este invoice no le pertenece
 *               code: FORBIDDEN
 *       404:
 *         description: No encontramos un invoice con esa ID en base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Invoice no encontrado
 *               code: INVOICE_NOT_FOUND
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

invoicesRouter.get('/me/:invoiceId', getThisInvoice);

/**
 * @swagger
 * /invoices/:
 *   patch:
 *     summary: (👤) Agregamos productos a la factura activa.
 *     operationId: updateMyInvoice
 *     description: |
 *       ### ➕📃 Agregar items a la factura activa
 *       En esta ruta enviamos los datos de los productos a agregar,modificar o quitar de la factura activa.
 * 
 *       ---
 * 
 *       ## Datos requeridos
 *       Esta ruta espera un array de objetos que contengan la siguiente información:
 * 
 *       1. ID del producto a agregar, quitar o modificar
 *       2. Nueva cantidad (número entero) del producto en la factura
 * 
 *       ```json
 *       [
 *         {
 *           "product_id": "e7b58c1f-49b0-11f1-acdd-507b9d97da6f",
 *           "quantity": 0 // <-- Quitar producto de la factura
 *         },
 *         {
 *           "product_id": "e7b5f3e4-49b0-11f1-acdd-507b9d97da6f",
 *           "quantity": 4 // <-- Nueva cantidad de este producto en factura
 *         }
 *       ]
 *       ```
 *       - A tener en cuenta: La cantidad enviada sobre-escribirá la cantidad existente del producto en la factura.
 *       - Todos los productos en la factura que no se modifiquien o mencionen quedarán tal cual estaban.
 * 
 *       > `👤📃` Se tomará la factura activa del cliente logeado para esta operación.
 * 
 *       ---
 * 
 *       ## Proceso
 *       Esta ruta se cerciosa de lo siguiente:
 * 
 *       1. Confirma la existencia de una factura activa
 *       2. Confirma haber recibido todos los datos necesarios
 *       3. Checkea que haya stock necesario para la petición de cada producto
 *       4. `🤝` De estar todo en orden, ejecuta los cambios.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: 'object'
 *               required:
 *                 - quantity
 *                 - product_id
 *               properties:
 *                 quantity:
 *                   type: integer
 *                 product_id:
 *                   type: string
 *                   format: uuid
 *           examples:
 *               enviamos_un_item:
 *                 summary: ✔ Enviamos un solo item.
 *                 value:
 *                   - quantity: 1
 *                     product_id: e7b50924-49b0-11f1-acdd-507b9d97da6f
 *               enviamos_varios_items:
 *                 summary: ✔✔ Enviamos varios items.
 *                 description: Podemos enviar un batch de productos para agregar al invoice.
 *                 value:
 *                   - quantity: 2
 *                     product_id: e7b50924-49b0-11f1-acdd-507b9d97da6f
 *                   - quantity: 3
 *                     product_id: e7b5f3e4-49b0-11f1-acdd-507b9d97da6f
 *                   - quantity: 4
 *                     product_id: e7b58c1f-49b0-11f1-acdd-507b9d97da6f
 *               item_con_stock_insuficiente:
 *                 summary: ⚠ Producto sin stock suficiente.
 *                 value:
 *                   - quantity: 999
 *                     product_id: e7b50924-49b0-11f1-acdd-507b9d97da6f
 *               producto_inexistente:
 *                 summary: ⚠ Producto inexistente.
 *                 value:
 *                   - quantity: 1
 *                     product_id: e7b50914-46b0-12f1-acdd-507b9d97da6f
 *               falta_dato_clave:
 *                 summary: ⭕ Falta dato clave.
 *                 value:
 *                   - product_id: e7b50924-49b0-11f1-acdd-507b9d97da6f
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
 *     responses:
 *       200:
 *         description: |
 *           ### ➕📃 Factura actualizada
 *           En caso de que el proceso termine correctamente, recibimos un mensaje de confirmación.
 * 
 *           ---
 * 
 *           Recuerde que puede:
 *           - [Checkear datos de la factura activa](#operations-Invoices-getMyActiveInvoice)
 *           - [Confirmar la factura activa](#operations-Invoices-confirmMyInvoice)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               value:
 *                 message:
 *                   type: string
 *             example:
 *               message: 'Invoice actualizado'
 *       400:
 *         description: ID inexistente, con formato inválido o faltan datos necesarios para la relacional.
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
 *               faltan_datos_clave:
 *                 summary: ⭕ Faltan datos clave 
 *                 value:
 *                   error: Faltan datos necesarios para la relación
 *                   code: MISSING_RELATION_DATA
 *       404:
 *         description: No encontramos un invoice activo registrado a nombre del cliente logeado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Invoice activo no encontrado
 *               code: ACTIVE_INVOICE_NOT_FOUND
 *       409:
 *         description: El stock actual del producto no puede cumplir con la demanda de la solicitud.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Stock insuficiente en producto ID {id del producto}
 *               code: INSUFFICIENT_STOCK
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_conseguimos_datos_de_los_productos:
 *                  summary: ✖✖ Trayendo información de productos en general
 *                  value:
 *                    error: Error trayendo información de productos
 *                    code: DATA_CONSISTENCY_ERROR
 *               no_conseguimos_datos_de_un_producto:
 *                  summary: ✖ Trayendo información de un producto específico
 *                  value:
 *                    error: Error trayendo información sobre el producto id {id del producto}
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

invoicesRouter.patch('/', updateInvoice);

/**
 * @swagger
 * /invoices/confirm:
 *   post:
 *     summary: (👤) Confirmamos la factura activa.
 *     operationId: confirmMyInvoice
 *     description: |
 *       ### ✅📃 Confirmar la factura activa
 *       En esta ruta tomamos la factura activa y la confirmamos, reservando stock para cada producto y agregando datos clave a la factura.
 * 
 *       ---
 * 
 *       ## Datos requeridos
 *       Esta ruta espera un objeto con los siguientes datos:
 *       1. payment_ters: Término de pago elegido por el cliente, puede ser a 30, 60, 90 o 120 días.
 *       2. notes: Notas adicionales sobre la factura en cuestión.
 * 
 *       ```json
 *       {
 *         "payment_terms": 60,         // <-- Dato clave: Con este dato calculamos la fecha de vencimiento de pago.
 *         "notes": "Este lote debe ser entregado en conjunto con la factura ID aaa1-aa1-aaaa1-aaaaa1"  // <-- Opcional
 *       }
 *       ```
 * 
 *       ---
 * 
 *       ## Proceso
 *       Esta ruta se cerciora de lo siguiente:
 *       > `✋🔓` **Inicia transacción**
 *       1. Confirma la validez de los términos de pago recibidos
 *       2. Confirma la existencia de una factura activa a nombre del cliente logeado
 *       3. Checkea disponibilidad de stock para cada producto relacionado a esta factura
 *       4. Actualiza el stock reservado para cada producto relacionado a esta factura
 *       5. Actualiza la factura, agregando:
 *         - invoice_number
 *         - issue_date
 *         - due_date
 *         - payment_terms
 *         - total
 *         - notes
 *       > `🤝🔒` **Commitea la transacción**
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_terms
 *             properties:
 *               payment_terms:
 *                 type: integer
 *                 enum: [30, 60, 90, 120]
 *               notes:
 *                 type: string
 *           examples:
 *               enviamos_lo_necesario:
 *                 summary: ✔ Enviamos solo el dato clave.
 *                 description: Los terminos de pago (payment_terms) son clave para calcular la fecha de vencimiento (due_date), siendo el único dato obligatorio para la confirmación.
 *                 value:
 *                   payment_terms: 90
 *               enviamos_notas_también:
 *                 summary: ✔✔ Enviamos también las notas.
 *                 description: Podemos enviar una nota para dejar en el registro de la factura.
 *                 value:
 *                   payment_terms: 120
 *                   notes: El contacto para este pedido específico difiere del contacto de cliente registrado, por favor usar el siguiente (1557482019)Juan
 *               falta_dato_clave:
 *                 summary: ⭕ Falta dato clave.
 *                 value:
 *                   notes: Nota dedicada a detalles de venta o contacto.
 *                   total: 1500.75
 *                   due_date: 12/06/2026
 *                   issue_date: NOW()
 *                   paid_at: 15/05/2026
 *               payment_terms_inválido:
 *                 summary: ✖ Términos de pago inválidos.
 *                 description: Los términos de pago válidos son 30, 60, 90 y 120. Con cualquier otro valor recibiremos un error como respuesta.
 *                 value:
 *                   payment_terms: 15
 *                   notes: Se decidió dar 15 días como termino de pago.
 *     responses:
 *       200:
 *         description: |
 *           ### 🤝📃 Confirmación exitosa
 *           En caso de que el proceso termine correctamente, recibimos un mensaje de confirmación junto con el id del invoice y su invoice_number.
 * 
 *           Datos actualizados:
 *           - Datos y fechas de la factura
 *           - Stock reservado de los productos involucrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 invoice_id:
 *                   type: string
 *                 invoice_number:
 *                   type: string
 *             example:
 *               message: 'Invoice confirmado'
 *               invoice_id: 123123123123123123
 *               invoice_number: 123123123123
 *       400:
 *         description: No enviamos términos de pago o son inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               termino_de_pago_no_recibido:
 *                 summary: ⭕ No enviamos terminos de pago
 *                 value:
 *                   error: Términos de pago no recibidos
 *                   code: PAYMENT_TERMS_REQUIRED
 *               termino_de_pago_con_formato_inválido:
 *                 summary: ⚠ Enviamos terminos de pago inválidos
 *                 value:
 *                   error: Término de pago no válido
 *                   code: INVALID_PAYMENT_TERMS
 *       404:
 *         description: No se encontró ningún invoice activo a nombre del cliente logeado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: No se encontró ningún invoice activo
 *               code: INVOICE_NOT_FOUND
 *       409:
 *         description: El stock actual del producto no puede cumplir con la demanda de la solicitud.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example: 
 *               error: Stock insuficiente en producto ID {id del producto}
 *               code: INSUFFICIENT_STOCK
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_se_pudo_actualizar_en_el_paso_final:
 *                  summary: ✖ Error en el paso final del proceso
 *                  value:
 *                    error: No se actualizó el invoice en el paso final
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

invoicesRouter.post('/confirm', confirmInvoice);

/**
 * @swagger
 * /invoices/{id}/cancel:
 *   post:
 *     summary: (👤) Cancelamos la factura dueña del ID enviado.
 *     description: |
 *       ### ❎📃 Cancelación de factura confirmada
 *       En esta ruta enviamos por parametro el ID de una factura previamente confirmada para cancelarla, liberando el stock reservado de todos sus items y actualizando el registro de la misma.
 * 
 *       ---
 * 
 *       ## Datos requeridos
 *       Esta ruta espera como único dato el **ID** de la factura a cancelar, la misma debe estar en estado 'confirmed'.
 * 
 *       ---
 * 
 *       ## Proceso
 *       Esta ruta, fuera de las validaciones de seguridad y formatos, se cerciosa de lo siguiente:
 * 
 *       > `✋🔓` **Inicia transacción**
 * 
 *       1. Que el estado actual de la factura sea 'confirmed'
 *       2. Calcula y actualiza el nuevo stock de los productos relacionados
 *       3. Actualiza el estado de la factura a 'cancelled'
 * 
 *       > `🤝🔒` **Commitea la transacción**
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *          example: cccccccc-cccc-cccc-cccc-cccccccccccc
 *     responses:
 *       200:
 *         description: Invoice cancelado, stock devuelto, registro archivado. Recibimos un mensaje confirmando la operación y el id de la factura archivada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               value:
 *                 message:
 *                   type: string
 *                 invoice_id:
 *                   type: string
 *             example:
 *               message: 'Invoice cancelado'
 *               invoice_id: 123123123123123123
 *       400:
 *         description: No enviamos términos de pago o son inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               summary: ⚠ El invoice no está confirmado
 *               value:
 *                   error: Solo se puede cancelar invoices confirmados
 *                   code: CANNOT_CANCEL_AN_UNCONFIRMED_INVOICE
 *       404:
 *         description: No se encontró ningún invoice con esa ID en base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Invoice no encontrado
 *               code: INVOICE_NOT_FOUND
 *       409:
 *         description: El stock actual del producto ya no puede cumplir con la demanda de la solicitud.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example: 
 *               error: Stock insuficiente en producto ID {id del producto}
 *               code: INCONSISTENT_RESERVED_STOCK
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_se_pudo_actualizar_en_el_paso_final:
 *                  summary: ✖ Error en el paso final del proceso
 *                  value:
 *                    error: No se actualizó el invoice en el paso final
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

invoicesRouter.post('/:id/cancel', cancelInvoice);

//Admin routes
invoicesRouter.use(adminOnly);

/**
 * @swagger
 * /invoices/all:
 *   get:
 *     summary: (🔐) Entrega todos los invoices en base de datos.
 *     description: Entrega los datos básicos de todos los invoices en base de datos.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Devuelve un array con todos los invoices en base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/invoicePublic'
 *             example:
 *               - id: cccccccc-cccc-cccc-cccc-cccccccccccc
 *                 client_id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
 *                 status: draft
 *                 total: null
 *                 created_at: 2026-05-07T01:05:57.000Z
 *                 issue_date: null
 *                 due_date: null
 *                 delivered_at: null
 *                 paid_at: null
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

invoicesRouter.get('/all', getAllInvoices);

/**
 * @swagger
 * /invoices/search:
 *   get:
 *     summary: (🔐) Busca invoices por filtros específicos by query.
 *     description: Entrega los datos básicos del los clientes que coincidan con los filtros de búsqueda enviados por query.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/queryIssueDateFrom'
 *       - $ref: '#/components/parameters/queryIssueDateTo'
 *       - $ref: '#/components/parameters/queryDueDateFrom'
 *       - $ref: '#/components/parameters/queryDueDateTo'
 *       - $ref: '#/components/parameters/queryTotalFrom'
 *       - $ref: '#/components/parameters/queryTotalTo'
 *       - $ref: '#/components/parameters/queryPaidAtFrom'
 *       - $ref: '#/components/parameters/queryPaidAtTo'
 *       - $ref: '#/components/parameters/queryClientId'
 *       - $ref: '#/components/parameters/queryInvoiceStatus'
 *       - $ref: '#/components/parameters/queryInvoiceNumber'
 *       - $ref: '#/components/parameters/queryPaymentTerms'
 *     responses:
 *       200:
 *         description: Devuelve un array con todos los invoices que cumplan con las condiciones de búsqueda.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/invoicePublic'
 *             example:
 *               - id: cccccccc-cccc-cccc-cccc-cccccccccccc
 *                 client_id: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
 *                 status: draft
 *                 total: null
 *                 created_at: 2026-05-07T01:05:57.000Z
 *                 issue_date: null
 *                 due_date: null
 *                 delivered_at: null
 *                 paid_at: null
 *       400:
 *         description: Hubo un error con los datos enviados para buscar por query.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               id_a_buscar_inválido:
 *                 summary: ⚠ ID Inválido
 *                 value:
 *                   error: El formato del ID recibido por query es inválido
 *                   code: INVALID_ID_FORMAT
 *               status_inválido:
 *                 summary: ⚠ Status inválido
 *                 value:
 *                   error: STATUS inválido, valores permitidos --- draft, confirmed, delivered, paid, cancelled
 *                   code: INVALID_STATUS
 *               término_de_pago_inválido:
 *                 summary: ⚠ Término de pago inválido
 *                 value:
 *                   error: Término de pago inválido, valores válidos -- 30, 60, 90, 120
 *                   code: INVALID_PAYMENT_TERMS
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

invoicesRouter.get('/search', getInvoicesByQuery);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: (🔐) Entrega todos los datos de la factura dueña del ID.
 *     description: Entrega todos los datos de la factura dueña del ID que mandamos por parametro.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *          example: cccccccc-cccc-cccc-cccc-cccccccccccc
 *     responses:
 *       200:
 *         description: Devuelve un objeto con la factura activa y todos los productos relacionados en la propiedad "products".
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/invoicePrivate'
 *             example:
 *               id: 7937fef3-4f19-11f1-aac0-507b9d97da6f
 *               client_id: bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
 *               status: draft
 *               invoice_number: null
 *               issue_date: null
 *               due_date: null
 *               payment_terms: null
 *               total: null
 *               notes: null
 *               created_at: 2026-05-13T22:17:05.000Z
 *               updated_at: 2026-05-13T22:17:05.000Z
 *               paid_at: null
 *               delivered_at: null
 *               products:
 *                 - product_id: e7b50924-49b0-11f1-acdd-507b9d97da6f
 *                   product_name: Mouse Inalambrico
 *                   price_at_addition: 45000
 *                   quantity: 10
 *                   stock: 150
 *                   reserved_stock: 0
 *                   subtotal: 450000
 *       404:
 *         description: No encontramos un invoice con esa ID en base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Invoice no encontrado
 *               code: INVOICE_NOT_FOUND
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

invoicesRouter.get('/:id', getInvoiceById);

/**
 * @swagger
 * /invoices/{id}/deliver:
 *   post:
 *     summary: (🔐) Actualiza el estado del invoice y descuenta stock.
 *     description: |
 *       ### 🚚📃 Entrega al cliente
 *       Esta ruta actualiza datos clave del invoice y decuenta el stock real de todos los productos relacionados.
 * 
 *       ---
 * 
 *       ## Datos requeridos
 *       Esta ruta solo requiere el **ID** del invoice a entregar.
 * 
 *       ---
 * 
 *       ## Proceso
 *       Esta ruta se cerciora de lo siguiente:
 * 
 *       > `✋🔓` **Inicia transacción**
 * 
 *       1. Que el estado del invoice sea "confirmed"
 *       2. Recheckea la disponibilidad de stock para entrega
 *       3. Actualiza el stock real y reservado para los productos relacionados
 *       4. Actualiza el estado del invoice a 'delivered' y delivered_at con la fecha actual
 * 
 *       > `🤝🔒` **Commitea la transacción**
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *          example: cccccccc-cccc-cccc-cccc-cccccccccccc
 *     responses:
 *       200:
 *         description: Confirmamos la entrega de los productos, descontamos el stock y recibimos un mensaje confirmado el éxito de la operación.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 invoice_id:
 *                   type: string
 *             example:
 *               message: Invoice entregado
 *               invoice_id: cccccccc-cccc-cccc-cccc-cccccccccccc
 *       400:
 *         description: ID del producto/cantidad faltante o con formato inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               id_no_recibidos:
 *                 summary: ✖ ID no recibido
 *                 value:
 *                   error: ID no recibido
 *                   code: ID_REQUIRED
 *               id_con_formato_inválido:
 *                 summary: ✖ ID con formato inválido
 *                 value:
 *                   error: Formato del ID inválido
 *                   code: INVALID_ID_FORMAT
 *       403:
 *         description: Problema con el estado actual del invoice, debe estar 'confirmado' previamente para poder entregarse.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Invoice no previamente confirmado
 *               code: ONLY_CONFIRMED_INVOICES_CAN_BE_DELIVERED
 *       404:
 *         description: No encontramos un invoice con esa ID en base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Invoice no encontrado
 *               code: INVOICE_NOT_FOUND
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               error_con_stock_en_producto_x:
 *                  summary: ⚠ Error con stock
 *                  value:
 *                    error: Error con stock||reserved_stock en producto ID {id del producto}
 *                    code: DATA_CONSISTENCY_ERROR
 *               no_se_pudo_actualizar_en_el_paso_final:
 *                  summary: ✖ Error en el paso final del proceso
 *                  value:
 *                    error: No se actualizó el invoice en el paso final
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

invoicesRouter.post('/:id/deliver', deliverInvoice);

//Webhook

/**
 * @swagger
 * /invoices/{id}/paid:
 *   post:
 *     summary: (🔐) Actualiza el estado del invoice a 'Paid'.
 *     description: Actualiza a "paid" (pagado) el estado del invoice. Esta ruta debe hablar con el webhook de pago directamente.
 *     tags:
 *       - Invoices
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *          example: cccccccc-cccc-cccc-cccc-cccccccccccc
 *     responses:
 *       200:
 *         description: Confirmamos el pago de la factura. Recibimos un mensaje confirmando el éxito de la operación.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 invoice_id:
 *                   type: string
 *             example:
 *               message: Invoice actualizado a "paid"
 *               invoice_id: cccccccc-cccc-cccc-cccc-cccccccccccc
 *       400:
 *         description: ID del producto/cantidad faltante o con formato inválido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               id_no_recibidos:
 *                 summary: ✖ ID no recibido
 *                 value:
 *                   error: ID no recibido
 *                   code: ID_REQUIRED
 *               id_con_formato_inválido:
 *                 summary: ✖ ID con formato inválido
 *                 value:
 *                   error: Formato del ID inválido
 *                   code: INVALID_ID_FORMAT
 *       403:
 *         description: Problema con el estado actual del invoice, debe estar 'confirmado' o 'entregado' previamente para poder aceptar un pago.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Status del invoice inválido para aceptar pago
 *               code: INVALID_INVOICE_STATUS
 *       404:
 *         description: No encontramos un invoice con esa ID en base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Invoice no encontrado
 *               code: INVOICE_NOT_FOUND
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_se_pudo_actualizar_en_el_paso_final:
 *                  summary: ✖ Error en el paso final del proceso
 *                  value:
 *                    error: No se actualizó el invoice en el paso final
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

invoicesRouter.post('/:id/paid', payInvoice);

module.exports = invoicesRouter;