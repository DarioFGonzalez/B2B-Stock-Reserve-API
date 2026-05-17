# Devlog

## [Invoices Swagger] 2026-05-16

### Documentación Swagger completa para el módulo de Invoices

Integré por completo la documentación de Swagger/JSDoc para todos los endpoints relacionados con facturas (invoices), cerrando así el ciclo de documentación de los tres módulos principales de este ecosistema de servidor B2B. Este módulo presentó la mayor complejidad arquitectónica debido al estricto ciclo de vida del documento (Draft ➔ Confirmed ➔ Delivered / Cancelled) y a las pesadas reglas transaccionales de la base de datos.

#### Endpoints documentados

**Cliente (👤 - Requiere `bearerAuth` + estado de cliente activo):**
- `POST /invoices` → Inicialización de facturas en estado "Draft".
- `GET /invoices/me` → Recuperación del historial de facturación del cliente autenticado.
- `GET /invoices/me/active` → Obtención del borrador activo con sus productos anidados.
- `GET /invoices/me/{invoiceId}` → Búsqueda protegida por validación de propiedad del recurso (`403 Forbidden`).
- `PATCH /invoices/{id}` → Mutaciones de ítems y cantidades restringidas estrictamente al estado "Draft".
- `POST /invoices/confirm` → El endpoint de cierre: transiciona el estado, calcula fechas de vencimiento y ejecuta las transacciones de reserva de stock.
- `POST /invoices/{id}/cancel` → Lógica de rollback para liberar `reserved_stock` y archivar documentos cancelados.

**Admin (🔐 - Requiere `bearerAuth` + rol de administrador):**
- `GET /invoices/all` → Catálogo administrativo general de todas las facturas del ecosistema.
- `GET /invoices/search` → Búsqueda filtrada multi-parámetro (`issue_date`, `due_date`, `total`, `status`, etc.).
- `GET /invoices/{id}` → Desglose administrativo de cualquier factura por ID.
- `POST /invoices/{id}/deliver` → Ejecución de la entrega del pedido y reducción real de los niveles de inventario.

**Webhooks (👥):**
- `POST /invoices/:id/paid` → Handler para la confirmación de eventos del procesador de pagos.

#### Componentes reutilizables y refactorización estructural

- **Esquemas:** Desarrollé capas de anidación para productos, separando `invoicePublic` (metadatos planos para listas) de `invoicePrivate` (arrays de objetos anidados con desglose de productos) para mantener los modelos de respuesta estrictamente predecibles.
- **Fail Fast y Consistencia de UI:** Replicando la arquitectura de validación estricta del backend, documenté explícitamente todos los objetos de error de casos de borde (`400`, `403`, `404`, `409`, `500`) con códigos de aplicación precisos (ej. `INSUFFICIENT_STOCK`, `DATA_CONSISTENCY_ERROR`). Esto garantiza que el frontend reciba bloques descriptivos en lugar de sets vacíos cuando rompe un parámetro.
- **Normalización del tipo Payment Terms:** Apliqué un paso crítico de normalización. En `searchByQuery`, `payment_terms` se esperaba como un enum `integer` (`[30, 60, 90, 120]`), pero en los payloads de los bodies se venía definiendo laxamente como string en los primeros borradores. Alineé todo a enteros estrictos tanto en esquemas como en los ejemplos del JSON, eliminando fricciones en el parser de la UI de Swagger.

#### Siguientes metas y estrategia de verificación
1. [ ] **Ciclo Completo de Camino Feliz:** Probar el flujo documental completo (Draft ➔ Agregar Ítems ➔ Confirmar ➔ Entregar ➔ Callback de Pago) usando Swagger UI directamente como cliente HTTP mediante el bloque de autorización por token.
2. [ ] **Concurrencia y Condiciones de Carrera:** Testear los límites de `POST /confirm` bajo simulación de agotamiento de inventario multi-cliente para asegurar que las restricciones transaccionales de la base de datos bloqueen reservas duplicadas (manejo de `409`).
3. [ ] **Rotura de Máquina de Estados:** Intentar transiciones de estado ilegales (ej. ejecutar `/paid` en un documento `Draft` o mandar un `PATCH` a un archivo `Confirmed`) para verificar que la capa de validación bloquee estados prohibidos.

## [Products Swagger] 2026-05-11

### Documentación Swagger completa para el módulo de Products

Integré por completo la documentación de Swagger/JSDoc para todos los endpoints relacionados con productos. Apliqué la misma arquitectura modular utilizada en el módulo de Clientes, pero refiné el uso de componentes reutilizables para manejar filtros de búsqueda complejos y acciones administrativas.

#### Endpoints documentados

**Públicos (👥):**
- `GET /products/all` → Listado completo utilizando el esquema `productPublic`.
- `GET /products/search` → Búsqueda dinámica. Documenté todos los parámetros de query (`sku`, `name`, `category`, `unit_price`, `stock`, `reserved_stock`, `is_active`) utilizando referencias globales.
- `GET /products/{id}` → Obtención de un producto específico por UUID con manejo de errores 404.

**Admin (🔐 - Requiere `bearerAuth` + rol de administrador):**
- `POST /products` → Lógica de creación. Incluí ejemplos detallados del request body para creación exitosa, campos obligatorios faltantes y conflictos por SKU duplicado.
- `PATCH /products/{id}` → Actualizaciones parciales con ejemplos de campos permitidos e ignorados.
- `PATCH /products/{id}/toggle-active` → Lógica para borrado lógico (soft-delete) y reactivación.

#### Componentes reutilizables y configuración

Actualicé `swagger.js` para dar soporte al nuevo módulo:
- **Esquemas:** Creé los componentes `Product`, `productPublic`, `postProduct` y `updateProduct`. Usé `$ref` para mantener el código del router limpio y la documentación DRY (sin repetir código).
- **Parámetros:** Centralicé todos los filtros de búsqueda en `components/parameters`. Esto permite que el endpoint `/search` los reutilice limpiamente en una sola línea por parámetro.
- **Respuestas de Error:** Estandaricé las respuestas para `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` y `409 Conflict` usando el esquema global de `errorMessage`.

#### Notas y Aprendizajes
- El enfoque de "Fail Fast" documentado ayuda a los desarrolladores frontend a entender exactamente por qué rebota una petición sin tener que adivinar los logs del servidor.
- Mantener los nombres de los parámetros en formato camelCase o snake_case consistente con la base de datos es vital. Me aseguré de que todos los filtros de query coincidan al 100% con los nombres de las columnas de MySQL.

## [Clients Swagger] 2026-04-28

### Documentación Swagger completa para el módulo de Clients

Terminé la integración de Swagger (OpenAPI 3.0) para el módulo de Clientes. Toda la documentación está escrita usando comentarios JSDoc directamente arriba de las rutas de Express, lo que mantiene la documentación cerca de la implementación real del código.

#### Endpoints documentados
- `POST /clients` → Registro público de clientes (estado inicial: 'pending').
- `POST /clients/login` → Autenticación, generación de JWT y actualización de la columna `last_login`.
- `GET /clients/verify` → Endpoint de verificación de correo electrónico usando tokens criptográficos.
- `GET /clients/me` → Perfil protegido para que los clientes recuperen sus propios datos.
- `PATCH /clients/me/update-profile` → Actualizaciones parciales del perfil (datos de contacto, dirección).
- `PATCH /clients/me/change-password` → Validación de contraseña actual y hash de la nueva contraseña con bcrypt.
- `POST /clients/me/deactivate` → Auto-desactivación (borrado lógico, setea `is_active = false`).

#### Rutas de Administrador (🔐)
- `GET /clients` → Listado de clientes con filtros avanzados por query.
- `PATCH /clients/:id/toggle-active` → Control administrativo para activar/suspender cuentas.
- `PATCH /clients/:id/toggle-admin` → Promoción/democión de roles de administrador.

#### Decisiones de Diseño y Solución de Problemas
- **Seguridad Global:** Configuré `bearerAuth` en la raíz de Swagger. Las rutas protegidas ahora muestran explícitamente el icono del candado en la UI.
- **Esquemas Reutilizables:** Extraje las estructuras comunes a `src/utils/swagger.js` bajo `components/schemas` (ej. `postClient`, `clientResponse`, `errorMessage`). Esto redujo las líneas de JSDoc en el router a más de la mitad.
- **Formatos de ID:** Forcé que todos los parámetros de ID en el path utilicen `format: uuid` en la especificación de Swagger para que la interfaz valide el formato antes de enviar la request.

## [Products Module] 2026-04-12

### Base de datos e implementación del CRUD de Productos

Estructuré e implementé la tabla de productos y sus respectivos handlers de Express. El módulo de productos maneja el catálogo de inventario que consumirá el sistema de facturación.

#### Cambios en la base de datos
Creé la tabla `products` con la siguiente estructura:
- `id` CHAR(36) [UUID, Clave Primaria]
- `sku` VARCHAR(50) [Único, No Nulo] -> Formato de negocio estricto (ej. SKU-XXX)
- `name` VARCHAR(255) [No Nulo]
- `description` TEXT
- `category` VARCHAR(100)
- `unit_price` DECIMAL(12, 2) [No Nulo] -> Manejo preciso de dinero, evitando flotantes de JS
- `stock` INT [Por defecto: 0] -> Inventario físico real en depósito
- `reserved_stock` INT [Por defecto: 0] -> Stock comprometido en facturas confirmadas pero no entregadas
- `is_active` BOOLEAN [Por defecto: true] -> Para borrado lógico
- `created_at` / `updated_at` [Timestamps automáticos]

#### Endpoints implementados
1. `GET /products/all` -> Catálogo completo de productos activos (básico para listas del front).
2. `GET /products/search` -> Query builder dinámico para buscar por cualquier columna (SKU, nombre, precio, etc.).
3. `GET /products/:id` -> Detalle completo de un producto específico.
4. `POST /products` (Admin) -> Creación de producto con validación estricta de SKU duplicado.
5. `PATCH /products/:id` (Admin) -> Actualización parcial. Si mandan campos basura (como datos del perfil del desarrollador), el backend los ignora y procesa solo las columnas válidas.
6. `PATCH /products/:id/toggle-active` (Admin) -> Soft-delete para discontinuar productos sin romper el historial de facturas viejas.

#### Decisiones Técnicas
- **Manejo de Stock:** Dividir el stock en `stock` físico y `reserved_stock` es clave para el módulo de facturas que se viene. Permite asegurar mercadería al cliente cuando confirma la compra sin descontarla físicamente hasta que el camión sale del depósito.
- **Decimales Puros:** En las queries utilizo strings o tipos numéricos limpios para mapear el `DECIMAL` de MySQL. El redondeo y cálculo matemático se protege a nivel query y handlers.

## [Clients Module] 2026-03-23

### Cambios en la base de datos
- Saqué la tabla `users` y creé `clients` en su lugar pensando en:
  - Simular un negocio real de venta mayorista (B2B).
  - Agregar verificación de cuenta por correo electrónico.
  - Darle a futuro un dashboard para revisar sus facturas y preferencias, o incluso pagar desde la app.

- Borré todas las tablas y arranqué de cero. Decisión consciente para evitar deuda técnica temprana y construir con una arquitectura más planeada.
- Estoy priorizando un enfoque más profesional/real de la app: voy a ir creando un CRUD a la vez, integrando las tablas de a poco, y chequeando que todo avance de manera armoniosa.

### Siguientes metas (orden de ejecución)
1. [ ] POST `/clients/register` → bcrypt + token de verificación criptográfico.
2. [ ] GET `/clients/verify` → activación de cuenta mediante token.
3. [ ] POST `/clients/login` → autenticación y generación de sesión segura.
4. [ ] GET `/clients` (con filtros dinámicos y paginación).
5. [ ] PATCH `/clients/:id` (actualización de perfiles).
6. [ ] Diseño y modelo de la tabla de `products`.

### Notas
- Usando queries puras de MySQL mediante pools de conexiones, sin ningún ORM.
- Una vez termine CLIENTS por completo (edge cases, manejo estricto de errores, expresiones regulares) avanzo recién a la siguiente tabla.
- Todo el código se va a estructurar bajo la filosofía de "Fail Fast" para mantener consistencia absoluta en las respuestas del servidor.