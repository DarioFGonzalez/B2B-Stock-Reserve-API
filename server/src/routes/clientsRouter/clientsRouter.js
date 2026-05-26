const {Router} = require('express');
const clientsRouter = Router();
const postClient = require('../../handlers/clientHandlers/postClient');
const { getAllClients, getClientById, getClientsByQuery } = require('../../handlers/clientHandlers/getClients');
const { changeMyPassword, updateMyProfile, deactivateMySelf, toggleClient, toggleAdmin } = require('../../handlers/clientHandlers/updateClients');
const loginClient = require('../../handlers/clientHandlers/loginClient');
const {verifyMail, sendReactivationMail, reactivateMyAccount} = require('../../handlers/clientHandlers/verifyClient');
const authMiddleware = require('../../middlewares/auth');
const {adminOnly} = require('../../middlewares/adminOnly');
const getMyProfile = require('../../handlers/clientHandlers/getMyData');

//Public routes

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: (👥) Crear un nuevo registro de cliente.
 *     description: |
 *       Crea un nuevo registro de cliente con los datos enviados por body.
 * 
 *       ---
 * 
 *       ### 🔒 Datos obligatorios
 *       Podemos enviar solo los datos obligatorios:
 *       * **business_name**: Razón social completa o nombre comercial legalmente registrado de la empresa cliente.
 *       * **tax_id**: Identificador fiscal único de la entidad (ej CUIT/RUT). Se utiliza para la validación de identidad y facturación.
 *       * **email**: Dirección de correo electrónico institucional. Actúa como identificador de acceso y canal principal de notificaciones legales.
 *       * **password**: Contraseña de acceso al sistema. Se almacena mediante hashing y debe cumplir políticas de seguridad.
 * 
 *       ### 🔓 Datos opcionales
 *       También podemos enviar los datos opcionales, para un registro más completo:
 *       * **phone**: Línea telefónica principal de contacto de la organización.
 *       * **address**: Domicilio fiscal o dirección de contacto de la organización.
 *       * **contact_name**: Nombre y apellido de la persona de contacto designada o representante administrativo.
 *       * **contact_phone**: Telefono de contacto administrativo.
 *     tags:
 *       - Clients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/postClient'
 *           examples:
 *               solo_datos_necesarios:
 *                 summary: ✔ Enviamos solo datos necesarios.
 *                 description: El registro se crea exitosamente con el estado inicial 'pending'.
 *                 value:
 *                   business_name: Freelance mayhem S.A.
 *                   tax_id: 25-36999123-1
 *                   email: FreeMay@consultas.com
 *                   password: freemay123freemay
 *               enviar_con_datos_opcionales:
 *                 summary: ✔ Enviamos datos mandatorios y opcionales.
 *                 description: Se incluyen datos de contacto y dirección para completar el perfil desde el inicio.
 *                 value:
 *                   business_name: Corporate TECH & Cia.
 *                   tax_id: 23-338492012-2
 *                   email: ctech@consultas.com
 *                   password: ctech123ctech
 *                   phone: 47469283
 *                   address: Pueyrredón 3022
 *                   contact_name: Rodizio Fernandez
 *                   contact_phone: 1557483920
 *               enviar_datos_extra:
 *                 summary: ⚠ Todo dato extra/inválido será ignorado.
 *                 description: En caso de recibir datos extra ó inválidos estos serán ignorados y se creará el registro con los datos mandatorios.
 *                 value:
 *                   business_name: Freelance mayhem S.A.
 *                   tax_id: 25-36999123-1
 *                   email: FreeMay@consultas.com
 *                   password: freemay123freemay
 *                   vip_status: true
 *                   international: false
 *                   iva: 21
 *                   etc: other extra slots
 *               falta_dato_obligatorio:
 *                 summary: ✖ No enviamos todos los datos necesarios.
 *                 description: En caso de no recibir datos clave, recibiremos un error detallando los campos faltantes.
 *                 value:
 *                   business_name: Salvation 300 & Cia.
 *                   tax_id: 19-32199123-2
 *                   email: salvation300@consultas.com
 *                   phone: 47669283
 *                   address: Gral Espejo 421
 *     responses:
 *       201:
 *         description: |
 *           ### ✔ Cliente creado correctamente
 * 
 *           Recibimos un objeto con los datos básicos del nuevo registro de cliente, detallado en el ejemplo de esta respuesta. El dato que nos sirve ahora mismo es el verification_token, necesario para verificar el mail del cliente.
 * 
 *           A partir de este punto, podemos:
 * 
 *           ---
 * 
 *           ### 📧 Verificar correo del cliente
 *           
 *           Sigue estos pasos para confirmar el mail de la cuenta:
 *           
 *           1. **Copia** el `verification_token` que aparece en el cuerpo de la respuesta.
 *           2. **Pega** el token en el campo correspondiente de la siguiente ruta:
 *              [VERIFICAR CUENTA](#operations-Clients-verifyEmail)
 *           3. Al ejecutar, la cuenta pasará de "Pendiente" _(pending)_ a "Confirmada" _(confirmed)_.
 *           
 *           > `⚠` Esto simula el email de confirmación que recibe el cliente.
 * 
 *           ---
 * 
 *           ### 🔐 Iniciar sesion del cliente
 * 
 *           Podemos autenticar el cliente usando el email y contraseña que enviamos en la creación de la cuenta.
 * 
 *           1. Debemos **acceder** a la siguiente ruta:
 *              [AUTENTICAR CLIENTE](#operations-Clients-loginClient)
 *           2. **Enviamos** por body el email y password del cliente que acabamos de crear.
 *           3. Al **Ejecutar** recibiremos el **JWToken** de seguridad como respuesta.
 *           
 *           > `🔐` Usamos este token para autenticarnos clickeando el 🔒 en las rutas protegidas o en el **🔒AUTHORIZE** general de esta documentación.
 * 
 *           ---
 * 
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 email:
 *                   type: string
 *                 business_name:
 *                   type: string
 *                 tax_id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [inactive, pending, confirmed, active]
 *                 is_admin:
 *                   type: integer
 *                   enum: [0, 1]
 *                 verification_token:
 *                   type: string
 *             example:
 *               id: 08ed9059-26f3-11f1-bf6b-e4fd45b45662
 *               email: Alpine@consultas.com
 *               business_name: Alpine TECH
 *               tax_id: 25-930201-3
 *               status: pending
 *               is_admin: 0
 *               verification_token: 96b9fc202999f7f65c03280ee21505444edb2ec2168a5e36a08f3abae30273e0
 *       400:
 *         description: Faltan campos obligatorios o se enviaron valores con formato inválido.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *                 - code
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *                 missingFields:
 *                   type: array
 *                   items:
 *                     type: string
 *             examples:
 *               email_o_password_no_recibidos:
 *                 summary: ✖ Email o Password no recibidos
 *                 value:
 *                   error: Contraseña no recibida || Email no recibido
 *                   code: PASSWORD_REQUIRED || EMAIL_REQUIRED
 *               email_o_password_con_formato_inválido:
 *                 summary: ✖ Email o Password con formato inválido
 *                 value:
 *                   error: Formato de la contraseña inválido || Formato del email inválido
 *                   code: INVALID_EMAIL_FORMAT || INVALID_PASSWORD_FORMAT
 *               faltan_datos_obligatorios:
 *                  summary: ✖ Faltan campos obligatorios
 *                  value:
 *                    error: Faltan campos obligatorios- business_name, tax_id, email, password
 *                    code: MISSING_REQUIRED_FIELDS
 *                    missingFields: [ business_name, tax_id, email, password ]
 *       409:
 *         description: Ya existe un registro con valor clave idéntico.
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
 *               error: El cliente ya existe
 *               code: ER_DUP_ENTRY
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
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
 *               no_pudimos_traer_el_cliente_recien_creado:
 *                  summary: ✖ No se pudo traer el cliente nuevo de DDBB
 *                  value:
 *                    error: Error al recuperar el cliente creado
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

clientsRouter.post('/', postClient);

/**
 * @swagger
 * /clients/login:
 *   post:
 *     summary: (👥) Log in para clientes.
 *     operationId: loginClient
 *     description: |
 *       ### 👤 Log in de clientes
 *       
 *       En esta ruta recibimos el JWToken de autenticación que el cliente usará en todas las rutas protegidas de este servidor.
 *        
 *       1. Enviamos el **email** y **contraseña** del cliente por body.
 *       2. Al ejecutar, si las credenciales son correctas, recibiremos el JWToken de autorización para ese cliente 
 *       3. Actualiza la propiedad "last_login" en el registro del cliente.
 *     tags:
 *       - Clients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email del cliente, se usa como usuario para el log in.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Contraseña del cliente.
 *           examples:
 *             enviar_datos_correctos:
 *               summary: ✔ Enviamos credenciales correctas
 *               description: Si el mail existe en la base de datos y la contraseña coincide recibiremos como respuesta el token de autenticación con expiración en 7 días.
 *               value:
 *                 email: cliente@demo.com
 *                 password: test123password
 *             enviar_datos_erroneos:
 *               summary: ✖ Enviamos credenciales inválidas
 *               description: Si las credenciales no coinciden (mail/contraseña) recibiremos como respuesta un error sin detallar cuál es el dato equivocado, para no exponer datos sensibles y por seguridad.
 *               value:
 *                 email: noExiste@esteMail.com
 *                 password: passwordfalsa123
 *             no_enviar_datos_clave:
 *               summary: ✖ No enviamos un dato clave
 *               description: De no enviar un dato clave, sea el email o la contraseña, recibiremos como respuesta un mensaje detallando el campo faltante.
 *               value:
 *                 email: admin@demo.com
 *             enviar_datos_con_formato_inválido:
 *               summary: ✖ Enviamos datos con formato inválido
 *               description: De recibir algún dato con formato inválido, recibiremos como respuesta un mensaje detallando el dato con formato incorrecto.
 *               value:
 *                 email: cliente#demo.com
 *                 password: test123password
 *     responses:
 *       200:
 *         description: |
 *           ### 🔐 Log in exitoso
 *           Con las credenciales confirmadas, recibimos un JWToken firmado del cliente con expiración de 7 (siete) días.
 * 
 *           ```
 *           {
 *             "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
 *           }
 *           ```
 * 
 *           > Debemos autenticarnos introduciendo el token en el 🔒 de la ruta protegida ó el `AUTHORIZE 🔒` general al principio de esta documentación.
 * 
 *           A partir de este punto, podemos:
 * 
 *           ---
 * 
 *           ### 👤 Consultar datos
 *           Podemos consultar los datos del cliente, usando el JWToken que conseguimos al autenticarnos.
 * 
 *           1. Debemos dirigirnos a la siguiente ruta:
 *           [CONSULTAR DATOS PROPIOS](#operations-Clients-getMyData)
 *           2. Al **ejecutar**, _una vez autenticados_, recibiremos un objeto con los datos básicos del cliente
 * 
 *           ---
 * 
 *           ### ⛔ Solo cuando se active su cuenta
 * 
 *           - [Crear facturas](#operations-Invoices-postInvoice)
 *           - [Ver mis facturas](#operations-Invoices-getMyInvoices)
 *           - Actualizar, confirmar o cancelar facturas existentes.
 * 
 *           > `⚠` Solo un administrador puede activar la cuenta, previa [confirmación del mail](#operations-Clients-verifyEmail) del cliente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *             example:
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQzMGFhMTkwLTQwMzUtMTFmMS04YzI0LWU0ZmQ0NWI0NTY2MiIsImlhdCI6MTc3NzU2NjA4NiwiZXhwIjoxNzc4MTcwODg2fQ.ZDc7V4MbogX0I1QGsNpnlTrssA1zU9qClskEkR-Ne0w
 *       400:
 *         description: No se envió mail, contraseña o tienen un formato inválido.
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
 *               email_o_password_no_recibidos:
 *                 summary: ✖ Email o Password no recibidos
 *                 value:
 *                   error: Email no recibido || Contraseña no recibida
 *                   code: EMAIL_REQUIRED || PASSWORD_REQUIRED
 *               email_o_password_con_formato_inválido:
 *                 summary: ✖ Email o Password con formato inválido
 *                 value:
 *                   error: Formato del email inválido || Formato de la contraseña inválido
 *                   code: INVALID_EMAIL_FORMAT || INVALID_PASSWORD_FORMAT
 *       401:
 *         description: Email o contraseña incorrectos.
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
 *               message: Credenciales inválidas
 *               code: INVALID_CREDENTIALS
 *       500:
 *         description: Error interno del servidor.
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

clientsRouter.post('/login', loginClient);

/**
 * @swagger
 * /clients/me/verify/{verification_token}:
 *   get:
 *     summary: (👥) Verificamos el Email del cliente mediante un token único.
 *     operationId: verifyEmail
 *     description: |
 *       ### 📧 Verificar Email del cliente
 *       
 *       Esta ruta recibe el token de verificación único asignado al cliente al momento de la creación de su cuenta y la confirma.
 * 
 *       1. Enviamos el verification_token por parámetro.
 *       2. El endpoint busca este token único entre los registros de clientes.
 *       3. De encontrar coincidencia, cambia el estado del cliente de _'pending'_ (Pendiente) a _'confirmed'_ (Confirmado).
 * 
 *       ---
 * 
 *       ### 🔄 Ciclo de Vida del Registro
 *       A continuación se detalla el flujo secuencial de estados que debe atravesar la cuenta antes de poder operar en la plataforma:
 *       - REGISTRO: La cuenta comienza con el estado **Pending**, porque aún el cliente no confirma su Email.
 *       - CONFIRMACIÓN: Una vez confirmado el Email del cliente el estado de la cuenta pasa a **Confirmed**, lista para su activación por parte de un administrador.
 *       - ACTIVACIÓN: Cuando un administrador activa la cuenta, esta ya queda habilitada para manejar facturas y es 100% operativa.
 * 
 *     tags:
 *       - Clients
 *     parameters:
 *      - in: path
 *        name: verification_token
 *        required: true
 *        schema:
 *          type: string
 *          example: 7eff170bf6872bff6ce8d4af1c97114aa890da7fa4449554d0378d076906bec1
 *        description: Token único de verificación del cliente. (32 caracteres hex)
 *     responses:
 *       200:
 *         description: |
 *           ### 📧 Mail del cliente verificado
 *           Al encontrar coincidencia de token y estado actualizable (pending):          
 * 
 *           1. Se borra el token de verificación del registro del cliente.
 *           2. Se actualiza el estado del cliente a **"Confirmado"** _(confirmed)_.
 *           3. Recibimos un mensaje confirmando la verificación del cliente como respuesta.
 * 
 *           > `⚠` Una vez confirmado el email del cliente, la activación debe ser aprobada por un administrador.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: Mail del cliente verificado
 *       400:
 *         description: Se envió un token vacío, inválido o la cuenta ya fue verificada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               token_requerido:
 *                 summary: ✖ Token no recibido
 *                 value:
 *                   error: Token no recibido
 *                   code: TOKEN_REQUIRED
 *               token_inválido:
 *                 summary: ✖ Token con formato inválido
 *                 value:
 *                   error: Formato del token inválido
 *                   code: INVALID_TOKEN_FORMAT
 *               token_expirado_o_ya_verificado:
 *                  summary: ✖ Token ya verificado ó no encontrado en DDBB
 *                  value:
 *                    error: Token expirado o cuenta ya verificada
 *                    code: ALREADY_VERIFIED_OR_EXPIRED_TOKEN
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

clientsRouter.get('/me/verify/:verification_token', verifyMail);

/**
 * @swagger
 * /clients/me/reactivate/{verification_token}:
 *   patch:
 *     summary: (👥) Reactivamos la cuenta del cliente con su token.
 *     operationId: reactivateMyAccount
 *     description: |
 *       ### ✅👤 Reactivamos nuestra cuenta
 *       Usando el token de verificación que recibe la ruta por params, buscamos el cliente y re-activamos su cuenta.
 * 
 *       1. Buscamos entre los registros de cliente el dueño del token recibido por parámetro.
 *       2. Al encontrar coincidencia, actualizamos el estado del cliente a 'Activo' _(active)_ y borramos el token de verificación.
 *     tags:
 *       - Clients
 *     parameters:
 *      - in: path
 *        name: verification_token
 *        description: Token único de verificación del cliente. (64 caracteres hex)
 *        required: true
 *        schema:
 *          type: string
 *          example: a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890
 *     responses:
 *       200:
 *         description: |
 *           ###👤✅ Cuenta re-activada con éxito
 *           Devuelve un mensaje confirmando el cambio de estado del cliente.
 * 
 *           - Cambiamos el estado del cliente a 'active'
 *           - Borramos el 'verification_token' del registro del cliente
 *         content:
 *           application/json:
 *             schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *             example:
 *                 message: Estado del cliente actualizado
 *       400:
 *         description: Token con formato inválido, no recibido, no corresponde a ningún cliente ó el cliente ya está activo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               token_no_recibido:
 *                  summary: ✖ No se recibió token
 *                  value:
 *                    error: Token no recibido
 *                    code: TOKEN_REQUIRED
 *               token_con_formato_inválido:
 *                  summary: ✖ Token con formato inválido
 *                  value:
 *                    error: Formato del token inválido
 *                    code: INVALID_TOKEN_FORMAT
 *               token_inválido_o_cliente_activo:
 *                  summary: ✖ Token inválido o cliente activo
 *                  value:
 *                    error: Token inválido o cliente ya activo
 *                    code: INVALID_TOKEN_OR_ACTIVE_CLIENT
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

clientsRouter.patch('/me/reactivate/:verification_token', reactivateMyAccount)

//Client routes
clientsRouter.use(authMiddleware);

/**
 * @swagger
 * /clients/me:
 *   get:
 *     summary: (👤) Entrega los datos del usuario logeado.
 *     operationId: getMyData
 *     description: |
 *       ### 👤 Datos personales
 *       Esta ruta entrega los datos básicos del usuario logeado, utilizando el token de autorización enviado por headers.
 * 
 *       - El middleware verifica el JWT y su firma.
 *       - Extrae el ID del token y se lo envía a esta ruta [ next() ].
 *       - Lo usa para buscar la información de este ID en base de datos.
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Devuelve un objeto con los datos básicos de la cuenta logeada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *             example:
 *                 id: 08ed9059-26f3-11f1-bf6b-e4fd45b45662
 *                 business_name: Alpine TECH
 *                 tax_id: 25-930201-3
 *                 email: Alpine@consultas.com
 *                 phone: 0800-666-7171
 *                 address: Constitución 411
 *                 contact_name: Minerva Belen
 *                 contact_phone: 1557483920
 *                 last_login: null
 *                 status: pending
 *                 is_admin: 0
 *       400:
 *         description: Hay problemas con el ID recibido por token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
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
 *       401:
 *         description: No se recibió token vía header.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_enviamos_token:
 *                 summary: ✖ No enviamos ningún token
 *                 value:
 *                   error: No se recibió token via header
 *                   code: MISSING_AUTH_HEADER
 *               token_inválido:
 *                 summary: ✖ Token con formato inválido
 *                 value:
 *                   error: Token inválido
 *                   code: JsonWebTokenError
 *               token_expirado:
 *                 summary: ✖ Token expirado
 *                 value:
 *                   error: Token expirado
 *                   code: TokenExpiredError
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               el_cliente_desapareció_estando_logeado:
 *                  summary: ✖ No se encontró datos del cliente logeado
 *                  value:
 *                    error: El cliente autenticado ya no existe en el sistema
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

clientsRouter.get('/me', getMyProfile);

/**
 * @swagger
 * /clients/me:
 *   patch:
 *     summary: (👤) Actualiza datos no críticos del cliente.
 *     description: Enviamos por body los datos a cambiar, usamos el id del cliente logeado como punto de referencia.
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/updateClient'
 *           examples:
 *               cambiar_valores_permitidos:
 *                 summary: ✔ Cambiamos valores permitidos.
 *                 value:
 *                   phone: 0800-123-3030
 *                   address: Wallaby 42, Sydney.
 *                   contact_name: P. Sherman
 *                   contact_phone: 1557493021
 *               enviar_valores_mixtos:
 *                 summary: ⚠ Enviamos valores inválidos.
 *                 description: Cualquier valor no permitido será ignorado, mientras la petición tenga un valor válido la actualización tendrá lugar.
 *                 value:
 *                   city: Tigre
 *                   province: Buenos Aires
 *                   country: Argentina
 *                   address: Constitución 911
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
 *         description: Devuelve el registro completo del cliente actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *             example:
 *                 id: 08ed9059-26f3-11f1-bf6b-e4fd45b45662
 *                 business_name: Alpine TECH
 *                 tax_id: 25-930201-3
 *                 email: Alpine@consultas.com
 *                 phone: 0800-123-3030
 *                 address: Wallaby 42, Sydney.
 *                 contact_name: P. Sherman
 *                 contact_phone: 1557493021
 *                 last_login: null
 *                 status: pending
 *                 is_admin: 0
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
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_conseguimos_datos_actualizados:
 *                  summary: ✖ No se pudo traer el cliente actualizado
 *                  value:
 *                    error: No se pudo actualizar el cliente
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

clientsRouter.patch('/me', updateMyProfile);

/**
 * @swagger
 * /clients/me/change-password:
 *   patch:
 *     summary: (👤) Actualiza la contraseña del cliente logeado.
 *     description: Utiliza el token de seguridad para identificar al cliente. Recibe la contraseña actual y la nueva por body, Valida credenciales y reemplaza la contraseña por la nueva (hasheada) en el registro del cliente.
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *           examples:
 *               enviamos_valores_correctos_A:
 *                 summary: ✔ Enviamos valores correctos. [Ejemplo A]
 *                 value:
 *                   password: test123
 *                   newPassword: 123test123
 *               enviamos_valores_correctos_B:
 *                 summary: ✔ Enviamos valores correctos. [Ejemplo B]
 *                 value:
 *                   password: 123test123
 *                   newPassword: test123
 *               enviamos_valores_iguales:
 *                 summary: 🔂 Enviamos valores idénticos.
 *                 value:
 *                   password: test123
 *                   newPassword: test123
 *               contraseña_actual_incorrecta:
 *                 summary: ✖ Contraseña actual incorrecta.
 *                 value:
 *                   password: administradorTorre3
 *                   newPassword: 123test123
 *               nueva_contraeseña_con_formato_inválido:
 *                 summary: ✖ Formato inválido para nueva contraseña.
 *                 value:
 *                   password: test123
 *                   newPassword: 1
 *               falta_algun_dato:
 *                 summary: ✖ Falta algún dato.
 *                 value:
 *                   newPassword: 123testn123
 *                   old_password: test123
 *     responses:
 *       200:
 *         description: Devuelve un mensaje confirmando la actualización exitosa de la contraseña.
 *         content:
 *           application/json:
 *             schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *             example:
 *                 message: Contraseña actualizada exitosamente
 *       400:
 *         description: Falta alguna contraseña, la nueva tiene un formato inválido o ambas contraseñas son iguales.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               falta_contraseña:
 *                 summary: ✖ Faltan datos
 *                 value:
 *                   error: No se recibió una contraseña
 *                   code: MISSING_PASSWORD_FIELD
 *               formato_inválido:
 *                 summary: ✖ Contraseña con formato inválido
 *                 value:
 *                   error: Formato de la contraseña inválido
 *                   code: INVALID_PASSWORD_FORMAT
 *               contraseñas_iguales:
 *                  summary: 🔂 Ambas contraseñas son iguales
 *                  value:
 *                    error: La nueva contraseña debe ser diferente de la actual
 *                    code: SAME_PASSWORD_CONFLICT
 *       401:
 *         description: La contraseña enviada es incorrecta, no coincide con la guardada en base de datos a este registro de cliente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Contraseña incorrecta
 *               code: UNAUTHORIZED_WITHOUT_PASSWORD
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_conseguimos_datos_actualizados:
 *                  summary: ✖ No se pudo traer el cliente actualizado
 *                  value:
 *                    error: Error al recuperar el cliente actualizado
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

clientsRouter.patch('/me/change-password', changeMyPassword);

/**
 * @swagger
 * /clients/me/deactivate:
 *   patch:
 *     summary: (👤) Desactiva la cuenta del cliente logeado.
 *     description: |
 *       ### ❎👤 Desactivar nuestra cuenta
 *       En esta ruta el cliente desactiva manualmente su cuenta.
 * 
 *       1. Usando el ID del **token de autenticación**, buscamos el registro del cliente.
 *       2. Creamos un token hexadecimal único de 64 caracteres para usar como **verification_token**.
 *       3. Actualizamos el estado del cliente a **"inactive"**.
 *       4. Inyectamos el token hexadecimal como nuevo **"verification_token"** para su posterior re-activación. 
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: |
 *           ### ❎ Cuenta desactivada
 *           Devuelve un mensaje confirmando la actualización de estado y token de verificación exitosa.
 * 
 *           A partir de este punto, solo podemos:
 * 
 *           ---
 * 
 *           ### ✅👤 Iniciar la reactivación de nuestra cuenta
 *           Para reactivar nuestra cuenta, primero tenemos que pedir que se nos envíe el mail de reactivación.
 * 
 *           1. Debemos ir a este endpoint:
 *             [Pedir mail de reactivación](#operations-Clients-sendReactivationMail)
 *           2. Se nos enviará al mail un correo de reactivación, como estamos en el modo sandbox- eso no ocurre.
 *           3. Lo que pasará es que recibiremos el token para reactivar manualmente nuestra cuenta desde la ruta para [reactivar con token](#operations-Clients-reactivateMyAccount) la cuenta.
 *         content:
 *           application/json:
 *             schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *             example:
 *                 message: Estado del cliente actualizado
 *       403:
 *         description: El usuario no aparece como 'active' en la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: El cliente no está activo.
 *               code: FORBIDDEN_ACOUNT_NOT_ACTIVE
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_se_actualizó_el_estado:
 *                  summary: ✖ No se pudo actualizar el estado del cliente
 *                  value:
 *                    error: No se pudo actualizar el estado del cliente
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

clientsRouter.patch('/me/deactivate', deactivateMySelf);

/**
 * @swagger
 * /clients/me/reactivate:
 *   post:
 *     summary: (👤) Envía un correo de reactivación al cliente.
 *     operationId: sendReactivationMail
 *     description: |
 *       ### 📧👤 Enviar correo de reactivación
 *       Esta ruta envía al correo del cliente un mail para reactivar su cuenta.
 * 
 *       1. Usando el ID del token de autenticación, busca el verification_token asignado a esta cuenta al momento de la desactivación.
 *       2. Envía al mail del cliente un correo en formato HTML que contenga un botón para re-activar su cuenta.
 *       3. El botón dentro del mail va a hablar directamente con la ruta de [reactivación de cuentas](#operations-Clients-reactivateMyAccount) proporcionandole el verification_token que necesita para la re-activación.
 * 
 *       > `📧` Como estamos en el modo sandbox, debemos tomar el token que recibimos en la respuesta y re-activar manualmente desde la siguiente ruta: [Reactivar cuenta con token](#operations-Clients-reactivateMyAccount)
 *
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: |
 *           ### ✅📧 Correo de reactivación enviado
 *           Devuelve un mensaje confirmando el envío del correo de reactivación y el token del cliente.
 * 
 *           > `⚠` Aclaración importante: Como estamos en el modo sandbox, la respuesta tiene también el token de verificación del cliente. Esto `NO` ocurre así en producción, solo se envía el correo al cliente con un botón que siga el proceso, filtrar el token en esta respuesta es un riesgo de seguridad adrede para facilitarle a quien esté probando el acceso a dicho token.
 *         content:
 *           application/json:
 *             schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                token:
 *                  type: string
 *             example:
 *                 message: Mail de reactivación enviado
 *                 token: 7eff170bf6872bff6ce8d4af1c97114aa890da7fa4449554d0378d076906bec1
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_se_actualizó_el_estado:
 *                  summary: ✖ No se pudo traer los datos del cliente
 *                  value:
 *                    error: No se pudo traer el cliente de base de datos
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

clientsRouter.post('/me/reactivate', sendReactivationMail);

//Admin routes
clientsRouter.use(adminOnly);

/**
 * @swagger
 * /clients/all:
 *   get:
 *     summary: (🔐) Entrega todos los usuarios en base de datos.
 *     description: Entrega los datos básicos de todos los usuarios en base de datos, siempre y cuando estemos autorizados para ello.
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Devuelve un array con todos los clientes en base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/clientPublic'
 *             example:
 *               - id: 091549e9-49b1-11f1-acdd-507b9d97da6f
 *                 business_name: Freelance mayhem SA
 *                 tax_id: 25-36999123-1
 *                 email: FreeMay@consultas.com
 *                 phone: null
 *                 address: null
 *                 contact_name: null
 *                 contact_phone: null
 *                 last_login: null
 *                 status: confirmed
 *                 is_admin: 0
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

clientsRouter.get('/all', getAllClients);

/**
 * @swagger
 * /clients/search:
 *   get:
 *     summary: (🔐) Busca clientes por filtros específicos by query.
 *     description: Entrega los datos básicos del los clientes que coincidan con los filtros de búsqueda enviados por query.
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/queryBusinessName'
 *       - $ref: '#/components/parameters/queryTaxId'
 *       - $ref: '#/components/parameters/queryEmail'
 *       - $ref: '#/components/parameters/queryPhone'
 *       - $ref: '#/components/parameters/queryAddress'
 *       - $ref: '#/components/parameters/queryContactName'
 *       - $ref: '#/components/parameters/queryContactPhone'
 *       - $ref: '#/components/parameters/queryIsAdmin'
 *       - $ref: '#/components/parameters/queryStatus'
 *     responses:
 *       200:
 *         description: Devuelve un array con todos los clientes que cumplan con las condiciones de búsqueda.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/clientPublic'
 *             example:
 *               - id: 091549e9-49b1-11f1-acdd-507b9d97da6f
 *                 business_name: Freelance mayhem SA
 *                 tax_id: 25-36999123-1
 *                 email: FreeMay@consultas.com
 *                 phone: null
 *                 address: null
 *                 contact_name: null
 *                 contact_phone: null
 *                 last_login: null
 *                 status: confirmed
 *                 is_admin: 0
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

clientsRouter.get('/search', getClientsByQuery);

/**
 * @swagger
 * /clients/{id}/toggle:
 *   patch:
 *     summary: (🔐) Alterna el estado del cliente [active/inactive].
 *     description: Enviamos un ID por params, el servidor busca ese cliente -> encuentra su estado actual -> lo actualiza por su opuesto. [ Active -> Inactive ] || [ Inactive -> Active ]
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *          example: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
 *     responses:
 *       200:
 *         description: Devuelve un mensaje confirmando la actualización del estado del cliente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: Estado del cliente actualizado
 *       400:
 *         description: Problemas con el ID enviado o el estado actual del cliente.
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
 *               status_actual_inmutable:
 *                 summary: ⚠ Status no modificable
 *                 description: En caso que el usuario no sea exactamente 'active' o 'inactive' recibiremos este error. 'Pending' y 'Confirmed' no pueden modificarse mediante esta ruta.
 *                 value:
 *                   error: Status actual no intercambiable
 *                   code: INVALID_ACTUAL_STATUS
 *       404:
 *         description: No encontramos un cliente con esa ID en la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Cliente no encontrado
 *               code: CLIENT_NOT_FOUND
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               no_conseguimos_datos_actualizados:
 *                  summary: ❓ El cliente desapareció durante la operación
 *                  value:
 *                    error: El cliente desapareció durante la operación
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

clientsRouter.patch('/:id/toggle', toggleClient);

/**
 * @swagger
 * /clients/{id}/toggle-admin:
 *   patch:
 *     summary: (🔐) Alterna permisos de administrador [active/inactive].
 *     description: Cambia los permisos del cliente dueño del ID enviado por parámetros.
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *          example: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
 *     responses:
 *       200:
 *         description: Devuelve un mensaje confirmando la actualización de los permisos del cliente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: Privilegios del cliente actualizados
 *       400:
 *         description: Problemas con el ID enviado o el estado actual del cliente.
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
 *         description: Estamos intentando quitarnos nuestros propios privilegios de administrador.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: No puede auto-quitarse los privilegios
 *               code:  CANNOT_TOGGLE_OWN_PRIVILEGES
 *       404:
 *         description: No encontramos un cliente con esa ID en la base de datos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             example:
 *               error: Cliente no encontrado
 *               code: CLIENT_NOT_FOUND
 *       500:
 *         description: Error interno o inconsistencia de datos del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/errorMessage'
 *             examples:
 *               datos_desaparecidos_inesperadamente:
 *                  summary: ❓ El cliente desapareció durante la operación
 *                  value:
 *                    error: El cliente desapareció durante la operación
 *                    code: DATA_CONSISTENCY_ERROR
 *               error_interno_general:
 *                  summary: ✖ Error interno inesperado
 *                  value:
 *                    error: Error interno del servidor
 *                    code: INTERNAL_SERVER_ERROR
 */

clientsRouter.patch('/:id/toggle-admin', toggleAdmin);

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     summary: (🔐) Entrega datos y facturas relacionadas con el cliente.
 *     description: Entrega los datos completos del usuario y todas las facturas relacionadas con el mismo.
 *     tags:
 *       - Clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: string
 *          example: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
 *     responses:
 *       200:
 *         description: Devuelve un objeto con todos los datos y facturas del cliente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/clientPrivate'
 *             example:
 *                 id: 08ed9059-26f3-11f1-bf6b-e4fd45b45662
 *                 business_name: Alpine TECH
 *                 tax_id: 25-930201-3
 *                 email: Alpine@consultas.com
 *                 phone: 0800-666-7171
 *                 address: Constitución 411
 *                 contact_name: Minerva Belen
 *                 contact_phone: 1557483920
 *                 last_login: null
 *                 status: pending
 *                 is_admin: 0
 *                 invoices: []
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
 *       401:
 *         description: No se recibió token vía header.
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
 *               no_enviamos_token:
 *                 summary: ✖ No enviamos ningún token
 *                 value:
 *                   error: No se recibió token via header
 *                   code: MISSING_AUTH_HEADER
 *               token_inválido:
 *                 summary: ✖ Token con formato inválido
 *                 value:
 *                   error: Token inválido
 *                   code: JsonWebTokenError
 *               token_expirado:
 *                 summary: ✖ Token expirado
 *                 value:
 *                   error: Token expirado
 *                   code: TokenExpiredError
 *       404:
 *         description: No hay un cliente con ese ID en la base de datos
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
 *               error: Cliente no encontrado
 *               code: CLIENT_NOT_FOUND
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

clientsRouter.get('/:id', getClientById);

module.exports = clientsRouter;