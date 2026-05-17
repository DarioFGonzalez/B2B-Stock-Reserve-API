<div align="center">

# 🚀 **B2B Stock Reserve API**

### *Sistema de facturación e inventario transaccional con garantías ACID*

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Swagger](https://img.shields.io/badge/Swagger-UI-85EA2D?style=flat&logo=swagger)
![Transactions](https://img.shields.io/badge/ACID-transactions-blue)
![Stock](https://img.shields.io/badge/feature-reserved--stock-orange)
![MySQL](https://img.shields.io/badge/MySQL-raw--queries-4479A1)

**⚡ 30+ Endpoints | 🔒 JWT + Roles | 📦 Stock Reservado | 💰 Ciclo de Vida de Facturación**

</div>

---

# 🏭 Backend robusto con Express + MySQL (Queries Puras)

API REST diseñada para resolver la lógica crítica de un ecosistema mayorista (B2B): gestión de clientes, catálogo de productos, control estricto de inventario y un motor de facturación con transiciones de estado complejas.

Este proyecto fue desarrollado **sin ORM (Sequelize/Prisma)**. Toda la capa de persistencia se implementó mediante queries SQL puras y parametrizadas utilizando pools de conexiones nativos, demostrando control total sobre las consultas, optimización de índices y manejo transaccional manual.

## 🎯 El Desafío del Negocio B2B (¿Qué resuelve?)

A diferencia de un e-commerce tradicional (B2C), un flujo mayorista requiere reglas de negocio rigurosas para proteger el stock y evitar pérdidas financieras:

1. **Reserva Inmediata:** El stock físico real no debe alterarse hasta la entrega, pero el stock disponible debe disminuir inmediatamente al confirmar un pedido para evitar la sobreventa (*overselling*).
2. **Garantía Transaccional:** La confirmación de una factura implica múltiples escrituras: actualizar totales, generar fechas de vencimiento basadas en términos comerciales (`Net 30/60/90/120`) y bloquear las unidades en stock. Si una sola falla, el sistema debe aplicar un *rollback* completo.
3. **Liberación de Inventario:** Si un pedido confirmado se cancela, el sistema debe revertir con precisión el stock comprometido sin alterar el flujo físico del depósito.

---

## 🛠️ Arquitectura y Decisiones Técnicas

- **Persistencia y Control ACID:** Implementación manual de `START TRANSACTION`, `COMMIT` y `ROLLBACK` mediante bloques transaccionales del driver `mysql2/promise`. Cero cajas negras; control absoluto sobre el comportamiento de la base de datos.
- **Estrategia Fail Fast:** Arquitectura defensiva que corta la tubería de ejecución mediante middlewares de validación estricta (formatos UUID, tipos de datos, estructuras de payloads) antes de consumir recursos de red o base de datos.
- **Tipado Decimal Estricto:** Almacenamiento de valores monetarios mediante el tipo `DECIMAL(12,2)` a nivel base de datos y procesamiento controlado de strings numéricos en el backend para mitigar los errores de redondeo de punto flotante nativos de JavaScript.
- **Seguridad y Control de Acceso:** Middleware de autenticación basado en JWT con segregación estricta de scopes: rutas públicas (`👥`), rutas exclusivas de clientes autenticados (`👤`) y operaciones críticas protegidas bajo rol de administrador (`🔐`).

---

## 🗺️ Mapa Completo del Ecosistema de Endpoints

A continuación se detalla la estructura completa de rutas que componen el servidor. Toda esta arquitectura se encuentra auto-documentada interactivamente bajo la especificación OpenAPI 3.0.

### 👤 Módulo de Clientes (`/clients`)

| Método | Ruta | Acceso | Descripción / Casos de Borde Documentados |
| :---: | :--- | :---: | :--- |
| **POST** | `/clients` | 👥 Público | Registro de cliente (estado inicial `pending`). Filtra campos extra basura. |
| **POST** | `/clients/login` | 👥 Público | Autenticación por JWT. Hasheo `bcrypt`. Actualiza timestamp de `last_login`. |
| **GET** | `/clients/verify` | 👥 Público | Verificación criptográfica de cuenta por email mediante tokens únicos. |
| **POST** | `/clients/reactivate` | 👥 Público | Solicita y procesa token de reactivación si la cuenta fue dada de baja. |
| **GET** | `/clients/me` | 👤 Cliente | Recupera el perfil completo del cliente autenticado (protege datos sensibles). |
| **PATCH** | `/clients/me/update-profile`| 👤 Cliente | Actualización parcial de datos de contacto (dirección, teléfonos, nombre). |
| **PATCH** | `/clients/me/change-password` | 👤 Cliente | Modificación de credenciales con validación obligatoria de contraseña actual. |
| **POST** | `/clients/me/deactivate` | 👤 Cliente | Auto-desactivación de cuenta (Soft-delete. Setea `is_active = false`). |
| **GET** | `/clients` | 🔐 Admin | Catálogo de auditoría de clientes con Query Builder dinámico. |
| **GET** | `/clients/:id` | 🔐 Admin | Obtención detallada de cualquier entidad cliente mediante su UUID. |
| **PATCH** | `/clients/:id/toggle-active`| 🔐 Admin | Suspensión o reactivación forzada de cuentas desde el panel de control. |
| **PATCH** | `/clients/:id/toggle-admin` | 🔐 Admin | Promoción o democión de privilegios de rol administrador. |

### 👥 Módulo de Productos (`/products`)

| Método | Ruta | Acceso | Descripción / Casos de Borde Documentados |
| :---: | :--- | :---: | :--- |
| **GET** | `/products/all` | 👥 Público | Entrega un array optimizado con los datos básicos del catálogo activo. |
| **GET** | `/products/search` | 👥 Público | Query Builder dinámico multivariante (`sku`, `name`, `category`, rangos de precio). |
| **GET** | `/products/:id` | 👥 Público | Detalle extendido de un producto específico por UUID con control de `404`. |
| **POST** | `/products` | 🔐 Admin | Alta de producto. Valida duplicidad de SKU única y campos obligatorios. |
| **PATCH** | `/products/:id` | 🔐 Admin | Modificación parcial de stock, precios o datos. Ignora propiedades inválidas. |
| **PATCH** | `/products/:id/toggle-active`| 🔐 Admin | Desactivación lógica (soft-delete) para no romper relaciones históricas. |

### 💰 Módulo de Facturación e Inventario (`/invoices`)

| Método | Ruta | Acceso | Descripción / Casos de Borde Documentados |
| :---: | :--- | :---: | :--- |
| **POST** | `/invoices` | 👤 Cliente | Inicializa factura en estado `Draft` e inyecta el primer ítem al lote. |
| **GET** | `/invoices/me` | 👤 Cliente | Historial completo de transacciones comerciales del cliente logueado. |
| **GET** | `/invoices/me/active` | 👤 Cliente | Recupera el borrador activo con su array relacional anidado de productos. |
| **GET** | `/invoices/me/:invoiceId` | 👤 Cliente | Detalle estricto de documento protegido por validación de propiedad (`403`). |
| **PATCH** | `/invoices/:id` | 👤 Cliente | Mutación de ítems y cantidades en lote. Bloqueado fuera del estado `Draft`. |
| **POST** | `/invoices/confirm` | 👤 Cliente | Transiciona a `Confirmed`, calcula `due_date`, bloquea totales y reserva stock. |
| **POST** | `/invoices/:id/cancel` | 👤 Cliente | Rollback manual: cancela el documento y re-inyecta `reserved_stock` al inventario. |
| **GET** | `/invoices/all` | 🔐 Admin | Catálogo general de auditoría de facturación de todo el ecosistema B2B. |
| **GET** | `/invoices/search` | 🔐 Admin | Filtrado multi-rango administrativo (fechas, totales, estados del ciclo). |
| **GET** | `/invoices/:id` | 🔐 Admin | Inspección relacional completa de cualquier documento y su desglose. |
| **POST** | `/invoices/:id/deliver` | 🔐 Admin | Cierre físico: el camión sale, baja `reserved_stock` e impacta inventario real. |
| **POST** | `/invoices/:id/paid` | 👥 Webhook | Callback asincrónico para la confirmación y liquidación de pasarelas de pago. |

---

## 📊 Matriz de Control de Errores (Fail Fast)

El servidor no expone respuestas genéricas ni propaga fallas internas a la interfaz. Cada caso de borde cuenta con códigos de aplicación semánticos y payloads predecibles mapeados globalmente en la documentación:

| Estado HTTP | Código de Aplicación | Escenario de Disparo |
|:---:|:---|:---|
| **400** | `INVALID_ID_FORMAT` / `INVALID_QUANTITY` | El cliente envía payloads con tipos de datos inválidos o UUIDs corruptos. |
| **400** | `PAYMENT_TERMS_REQUIRED` | Intento de confirmar factura sin proveer plazos comerciales válidos. |
| **403** | `FORBIDDEN` | El cliente intenta acceder de forma fraudulenta a recursos de otra entidad comercial. |
| **404** | `PRODUCT_NOT_FOUND` / `INVOICE_NOT_FOUND` | Peticiones a recursos inexistentes o dados de baja lógicamente. |
| **409** | `INSUFFICIENT_STOCK` | La base de datos frena la confirmación porque la demanda supera el inventario real. |
| **409** | `DRAFT_ALREADY_EXISTS` | Restricción de negocio: un cliente no puede iniciar un nuevo borrador si ya posee uno activo. |
| **500** | `DATA_CONSISTENCY_ERROR` | Salvaguarda transaccional ante fallas concurrentes en el último paso de escritura. |

---

## ⚙️ Instalación y Ejecución

> ⚠️ **Nota crítica de configuración (Swagger & Tokens de prueba):** > Para que los tokens firmados de ejemplo incluidos en la documentación interactiva de Swagger UI (`/api-docs`) funcionen correctamente y no arrojen errores de autenticación, el servidor requiere validar las firmas con una clave criptográfica específica. Es **obligatorio** configurar en el archivo `.env` el hash exacto provisto en las instrucciones de abajo. Si se omite o se genera un string aleatorio, el flujo de pruebas interactivo fallará por discrepancia de firma simétrica.

---

```
git clone https://github.com/DarioFGonzalez/fullstack-express-mysql-raw.git
cd fullstack-express-mysql-raw/server
npm install
cp .env.example .env
echo "JWT_SECRET=e2b2ff5c05be70cf10f201f8c2e8241020b08fb1a6583c183669a870f1ef44fdf4a0ad18a817004c2baf1b1da28ee2158218edec3db2c21a86b968df5d80b663" >> .env
npm run dev
```

La interfaz interactiva de pruebas y especificación técnica estará disponible en:
🔗 `http://localhost:5000/api-docs`

---

## 📊 Progreso de Desarrollo del Ecosistema

| Componente Arquitectónico | Estado | Cobertura JSDoc/Swagger |
| :--- | :---: | :---: |
| **Módulo de Clientes (CRUD + Auth)** | ✅ Completado | ✅ 100% Documentado |
| **Módulo de Productos (Catálogo + Filtros)** | ✅ Completado | ✅ 100% Documentado |
| **Módulo de Invoices (Lógica Transaccional)** | ✅ Completado | ✅ 100% Documentado |
| **Capa de Transacciones ACID (SQL Puros)** | ✅ Completado | ✅ Protegido en Handlers |
| **Portal Interactivo Swagger UI (`/api-docs`)** | ✅ Operativo | ✅ Contrato OpenAPI 3.0 |