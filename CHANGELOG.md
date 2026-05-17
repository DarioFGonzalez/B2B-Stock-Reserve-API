# Changelog

## [Invoices Module] - 2026-05-16

### Swagger/OpenAPI Documentation Completed

Completed Swagger documentation for the entire invoices module, finalizing the comprehensive OpenAPI contract for the B2B server ecosystem. This iteration standardizes full document workflows, lifecycle transitions, and data safety logic.

#### Endpoints documented

**Authenticated client (requires `bearerAuth` + active client status):**
- `POST /invoices` → create a new invoice in 'Draft' status with the first product (includes strict formats, extra property filtration, and boundary data handling).
- `GET /invoices/me` → list all public invoice records belonging to the authenticated client.
- `GET /invoices/me/active` → fetch full breakdown (including relational `products` array) of the client's current active draft invoice (returns an empty object `{}` if none exists).
- `GET /invoices/me/{invoiceId}` → fetch strict relational detail for a specific invoice, guarded by client-ownership validation (`403 Forbidden`).
- `PATCH /invoices/{id}` → update quantities or batch-inject product items inside a draft invoice (includes empty body and invalid structure validation examples).
- `POST /invoices/confirm` → transition active invoice from 'Draft' to 'Confirmed', lock subtotals, calculate deadlines (`due_date`), and reserve stock inventory.
- `POST /invoices/{id}/cancel` → rollback a confirmed invoice, free up `reserved_stock` back to real availability, and archive metadata before storage.

**Admin (requires `bearerAuth` + admin role):**
- `GET /invoices/all` → full administrative catalog of all ecosystem invoices.
- `GET /invoices/search` → high-performance multi-range filtering by query parameters (dates, range-based amounts, whitelisted enumerations).
- `GET /invoices/{id}` → targeted retrieval of any invoice record with item arrays via ID.
- `POST /invoices/{id}/deliver` → finalize product fulfillment, drop `reserved_stock` alongside real stock levels, and set execution timestamps.

**Webhooks & Callbacks (guarded infrastructure):**
- `POST /invoices/{id}/paid` → transition state to 'Paid' upon payment processor event settlement.

#### Reusable schemas and components

Defined in `components/schemas`:
- `invoicePublic` → standard non-relational invoice structure (fields like `total` optimized for type-safe decimal representations).
- `invoicePrivate` → full extended invoice structure embedding a nested `products` array with item breakdown.
- `errorMessage` → unified error object formatting (`error`, `code`).

Data optimization components:
- Standardized query-level filters for `searchByQuery` inside `components/parameters`.
- Refactored `payment_terms` schema types to strictly handle `type: integer` (`enum: [30, 60, 90, 120]`) across endpoints, eradicating validation friction and structural ambiguity between query ranges and payload bodies.

#### Error responses documented

| Code | Cases documented |
|------|------------------|
| 400 | Missing IDs, invalid UUID formats, invalid quantity metrics, mismatched array-object payloads, missing or illegal payment parameters, out-of-order lifecycle execution rules. |
| 403 | Attempting to fetch non-owned documents (`FORBIDDEN`), trying to change fields outside 'Draft' states. |
| 404 | Document non-existent (`INVOICE_NOT_FOUND`). |
| 409 | Multiple active drafts conflict (`DRAFT_ALREADY_EXISTS`), inventory limits exceeded (`INSUFFICIENT_STOCK`), internal reservation data drift (`INCONSISTENT_RESERVED_STOCK`). |
| 500 | Database transaction crashes, middleware pipeline failures, structural system failures (`DATA_CONSISTENCY_ERROR`). |

#### Technical Highlights
- **Fail Fast Documentation:** Extensively detailed validation contracts mirroring the server-side architecture to enforce explicit rejections (`400 Bad Request`) on structural drift, protecting the client-side against silently swallowed empty sets (`[]`).
- **Data Normalization Integration:** Aligned schemas with server database driver behavior, using type-safe definitions for amounts and numbers.
- **Strict Path Isolation:** Standardized Swagger path keys against Express native bindings (e.g., swapping out `:invoiceId` token definitions for strict OpenAPI compliance blocks `{invoiceId}`).
- **Visual Token Mapping:** Maintained strict consistency using standard role visual cues: (👤) client-level routing, (👥) shared routing, and (🔐) admin-only scopes.

## [Products Module] - 2026-05-11

### Swagger/OpenAPI Documentation Completed

Completed Swagger documentation for the entire products module, including public endpoints for catalog browsing and protected admin routes for inventory management.

#### Endpoints documented

**Public:**
- `GET /products/all` → list all products (basic data)
- `GET /products/search` → dynamic search with multiple filters (sku, name, category, unit_price, stock, reserved_stock, is_active)
- `GET /products/{id}` → get complete product details by ID

**Admin (requires `bearerAuth` + admin role):**
- `POST /products` → create a new product with examples (only required data, optional data included, ignored extra data, missing fields)
- `PATCH /products/{id}` → update product data with examples (valid fields, mixed valid/invalid fields, empty body)
- `PATCH /products/{id}/toggle-active` → toggle product status (active ↔ inactive)

#### Reusable schemas and components

Defined in `components/schemas`:
- `Product` → full product structure
- `productPublic` → reduced version for catalog listings (`/all`, `/search`)
- `postProduct` → required and optional fields for product creation
- `updateProduct` → allowed fields for partial updates

Defined in `components/parameters` (reused in `/search`):
- `querySku`, `queryName`, `queryCategory`, `queryUnitPrice`, `queryStock`, `queryReservedStock`, `queryIsActive`

#### Error responses documented

| Code | Cases documented |
|------|------------------|
| 400 | Empty body, missing required fields, invalid ID format, no valid conditions to update, no valid filters to search |
| 404 | Product not found |
| 409 | Duplicate entry (`ER_DUP_ENTRY`) for SKU |
| 500 | Data inconsistency (`DATA_CONSISTENCY_ERROR`), internal server error (`INTERNAL_SERVER_ERROR`) |

#### Technical Highlights
- Used `$ref` extensively to maintain a DRY Swagger configuration across schemas and search parameters.
- Implemented robust `examples` in request bodies (e.g., `POST /products` and `PATCH /products/{id}`) to clearly illustrate success paths, ignored extra data, and specific validation failures.
- Visual separation using emojis in summaries: (👥) public, (🔐) admin.

## [Clients Module] - 2026-05-09

### Swagger/OpenAPI Documentation Completed

Completed Swagger documentation for the entire clients module, including public routes, authenticated client routes, and admin routes.

#### Endpoints documented

**Public:**
- `POST /clients` → client registration with examples (success, errors, empty body)
- `POST /clients/login` → authentication with examples (valid/invalid credentials, missing fields, invalid format)
- `GET /clients/me/verify/{verification_token}` → email verification with `operationId: verifyClient`
- `PATCH /clients/me/reactivate/{verification_token}` → account reactivation via token

**Authenticated client (requires `bearerAuth`):**
- `GET /clients/me` → logged-in user profile
- `PATCH /clients/me` → update non-critical data (phone, address, contact_name, contact_phone)
- `PATCH /clients/me/change-password` → password change with security validations
- `PATCH /clients/me/deactivate` → deactivate own account
- `POST /clients/me/reactivate` → request reactivation email

**Admin (requires `bearerAuth` + admin role):**
- `GET /clients/all` → list all clients
- `GET /clients/search` → dynamic search with multiple filters (business_name, tax_id, email, phone, address, contact_name, contact_phone, is_admin, status)
- `PATCH /clients/{id}/toggle` → toggle client status (active ↔ inactive)
- `PATCH /clients/{id}/toggle-admin` → toggle admin privileges
- `GET /clients/{id}` → get client by ID with related invoices

#### Reusable schemas and components

Defined in `components/schemas`:
- `Client` → full client structure (`/me` response)
- `clientPublic` → reduced version for listings (`/all`, `/search`)
- `clientPrivate` → full version with nested `invoices` (`/{id}`)
- `postClient` → required fields for registration
- `updateClient` → allowed fields for update
- `errorMessage` → unified error structure

Defined in `components/parameters` (reused in `/search`):
- `queryBusinessName`, `queryTaxId`, `queryEmail`, `queryPhone`, `queryAddress`, `queryContactName`, `queryContactPhone`, `queryIsAdmin`, `queryStatus`

#### Error responses documented

| Code | Cases documented |
|------|------------------|
| 400 | Empty body, invalid format, missing fields, invalid conditions, immutable status |
| 401 | Missing token, invalid token, expired token |
| 403 | Inactive account, self-privilege removal |
| 404 | Client not found |
| 409 | Duplicate entry (`ER_DUP_ENTRY`) |
| 500 | Data inconsistency (`DATA_CONSISTENCY_ERROR`), internal error (`INTERNAL_SERVER_ERROR`) |

#### Technical Highlights
- Used `$ref` to avoid repeating schemas and parameters
- Used `operationId: verifyClient` to link from `POST /clients` response
- Added step-by-step instructions in `POST /clients` description guiding users to verify their account
- Visual separation using emojis in titles: (👥) public, (👤) authenticated, (🔐) admin

## [Project v1.0] - 2026-04-12

### Final Status
- **Clients Module**: Full CRUD + JWT auth + role-based access (admin/client) + email verification + self-service (deactivate/reactivate)
- **Products Module**: Full CRUD + search with whitelist + soft delete + admin-only write operations
- **Invoices Module**: Full lifecycle (draft → confirm → deliver → paid/cancel) + stock management (reserved/real) + transactions + admin/client separation

### Authentication & Authorization
- JWT implemented with `authMiddleware`
- `adminOnly` middleware for role-based access
- `activeClientOnly` middleware for clients with active status
- Login returns only token (client data fetched via `/me`)

### Technical Highlights
- No ORM: pure SQL queries with parameterized placeholders
- Transactions on critical operations (confirm, deliver, cancel)
- Batch updates with `CASE` statements
- Composite primary keys in `invoice_items`
- UUIDs for all primary keys

### Pending (for future iterations)
- Pagination for list endpoints
- Real webhook integration (MercadoPago)
- Frontend dashboard

---

## [Invoices Module] - 2026-04-02

### Schema
- Created `invoices` and `invoice_items` tables with:
  - `id CHAR(36) PRIMARY KEY DEFAULT (UUID())` for invoices
  - `client_id CHAR(36) NOT NULL` (FK to clients)
  - `status ENUM('draft','confirmed','delivered','paid','cancelled') DEFAULT 'draft'`
  - `invoice_number VARCHAR(50) UNIQUE NULL` (generated on confirm)
  - `issue_date DATE NULL` (set on confirm)
  - `due_date DATE NULL` (calculated as issue_date + payment_terms)
  - `payment_terms INT NULL` (30, 60, 90, 120)
  - `total DECIMAL(12,2) NULL` (calculated on confirm)
  - `paid_at DATETIME NULL` (set on paid)
  - `delivered_at DATETIME NULL` (set on deliver)
  - `notes TEXT NULL`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  - `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  
- `invoice_items` uses composite primary key `(invoice_id, product_id)`:
  - `invoice_id CHAR(36) NOT NULL` (FK to invoices, CASCADE delete)
  - `product_id CHAR(36) NOT NULL` (FK to products)
  - `quantity INT NOT NULL`
  - `unit_price DECIMAL(12,2) NOT NULL` (price at addition)
  - `subtotal DECIMAL(12,2) NOT NULL`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

### Added

#### Core endpoints
- **POST /invoices** (`src/handlers/invoiceHandlers/postInvoice.js`)
  - Creates draft invoice with first item in one call
  - Validates client_id and product_id (UUID format)
  - Fetches unit_price from products and calculates subtotal
  - Returns invoiceId for subsequent operations

- **GET /invoices/all** (`src/handlers/invoiceHandlers/getInvoices.js`)
  - Returns all invoices with items

- **GET /invoices/search** (`src/handlers/invoiceHandlers/getInvoices.js`)
  - Dynamic query builder with whitelist validation
  - Supports exact filters: `client_id`, `status`, `payment_terms`, `invoice_number`
  - Supports range filters: `total_min`, `total_max`, `issue_date_from`, `issue_date_to`, `due_date_from`, `due_date_to`, `paid_at_from`, `paid_at_to`
  - Returns 200 with empty array if no results

- **GET /invoices/:id** (`src/handlers/invoiceHandlers/getInvoices.js`)
  - Returns invoice with its items via JOIN query
  - 404 if not found

- **PATCH /invoices/:id** (`src/handlers/invoiceHandlers/updateInvoice.js`)
  - Batch update: insert or update items with quantity > 0
  - Deletes items with quantity = 0
  - Uses `ON DUPLICATE KEY UPDATE` for upsert
  - Validates stock before updating

#### Lifecycle endpoints (with transactions)
- **POST /invoices/:id/confirm** (`src/handlers/invoiceHandlers/confirmInvoice.js`)
  - Validates invoice is in `draft` status
  - Checks stock availability for all items
  - Generates `invoice_number` (format: `INV-YYYYMMDD-RRRR`)
  - Calculates `issue_date = CURDATE()` and `due_date = issue_date + payment_terms`
  - Updates `reserved_stock` in products via `CASE` batch update
  - Sets status to `confirmed`, stores `total` and `payment_terms`
  - Uses transaction for atomicity

- **POST /invoices/:id/deliver** (`src/handlers/invoiceHandlers/deliverInvoice.js`)
  - Validates invoice is `confirmed`
  - Updates `stock = stock - quantity` and `reserved_stock = reserved_stock - quantity` for each product
  - Uses `CASE` batch update with transaction
  - Sets status to `delivered` and `delivered_at = CURRENT_TIMESTAMP`

- **POST /invoices/:id/paid** (`src/handlers/invoiceHandlers/paidInvoice.js`)
  - Validates invoice is `confirmed` or `delivered`
  - Sets status to `paid` and `paid_at = CURRENT_TIMESTAMP`
  - Simple update (no transaction needed)

- **POST /invoices/:id/cancel** (`src/handlers/invoiceHandlers/cancelInvoice.js`)
  - Validates invoice is `confirmed`
  - Releases `reserved_stock = reserved_stock - quantity` for each product
  - Sets status to `cancelled`
  - Uses transaction for atomicity

### Helpers Added
- **`src/utils/invoiceUtils.js`** → `getInvoiceWithItems(pool, id)`
  - Reusable function to fetch invoice with its related products
  - Used by multiple lifecycle endpoints
  - Throws `INVOICE_NOT_FOUND` if no invoice exists

- **`src/utils/queryBuilder.js`** → `invoiceByQueryBuilder(queries)`
  - Builds dynamic WHERE clause for search endpoint
  - Handles exact matches, `LIKE` (invoice_number), and range filters
  - Validates enums (`status`, `payment_terms`) against whitelist

### Error Handling
- `400 INVALID_ID_FORMAT` → invalid UUID
- `400 MISSING_SEARCH_PARAMETERS` → search without filters
- `400 INVALID_STATUS` → invalid status value
- `400 INVALID_PAYMENT_TERMS` → invalid payment_terms value
- `400 CANNOT_CANCEL_AN_UNCONFIRMED_INVOICE` → cancel non-confirmed invoice
- `404 INVOICE_NOT_FOUND` → invoice does not exist
- `409 INSUFFICIENT_STOCK` → insufficient stock on confirm or deliver
- `409 INCONSISTENT_RESERVED_STOCK` → reserved stock inconsistency
- `500 COULDNT_UPDATE_INVOICE` → transaction commit failed

### Technical Decisions
- **Cart as draft invoice**: One active draft per client
- **No ORM**: Pure SQL queries with parameterized placeholders
- **Batch updates with CASE**: Update multiple products in single query
- **Transactions**: `confirm`, `deliver` and `cancel` use `BEGIN/COMMIT/ROLLBACK`
- **Composite primary key** in `invoice_items`: Prevents duplicates, no separate ID
- **Frozen price**: `unit_price` captured when adding to cart, not on confirm

### Notes
- `invoice_number` generated in memory (no extra DB query)
- Quantity 0 in update → removes item from cart
- `deliver` and `cancel` require transactions (multiple product updates)
- `paid` is simple update (only touches invoice)
- `getInvoiceWithItems` reused across all lifecycle endpoints
- `connection.release()` always in `finally` block for transaction handlers

### Next Steps
- [x] JWT authentication with middleware
- [x] Role-based access (admin / client)
- [ ] Pagination for list endpoints
- [ ] Demo script or Thunder Client collection
- [ ] Frontend dashboard (optional)

---

## [Products Module] - 2026-03-25

### Schema
- Created `products` table with:
  - `id CHAR(36) PRIMARY KEY DEFAULT (UUID())`
  - `sku VARCHAR(50) NOT NULL UNIQUE`
  - `name VARCHAR(100) NOT NULL`
  - `description TEXT`
  - `category VARCHAR(50) NOT NULL`
  - `unit_price DECIMAL(12,2) NOT NULL`
  - `stock INT NOT NULL DEFAULT 0`
  - `reserved_stock INT NOT NULL DEFAULT 0`
  - `is_active BOOLEAN DEFAULT true`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  - `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

### Added
- **POST /products** (`src/handlers/productHandlers/postProduct.js`)
  - Required fields validation (sku, name, category, unit_price)
  - Optional fields (description, stock, reserved_stock, is_active)
  - SKU uniqueness validation (409 Conflict)
  - Returns created product

- **GET /products/all** (`src/handlers/productHandlers/getProducts.js`)
  - Returns all products

- **GET /products/search** (`src/handlers/productHandlers/getProducts.js`)
  - Dynamic query builder for multiple filters
  - Whitelist validation for allowed columns (sku, name, category, is_active)
  - Supports `LIKE` for name and category (partial match)
  - Returns array (200) even if empty

- **GET /products/:id** (`src/handlers/productHandlers/getProducts.js`)
  - Returns single product by UUID
  - 404 if not found

- **PATCH /products/:id** (`src/handlers/productHandlers/updateProduct.js`)
  - Update allowed fields: name, description, unit_price, stock, reserved_stock
  - Validates at least one field is provided
  - Returns updated product

- **PATCH /products/:id/toggle-active** (`src/handlers/productHandlers/updateProduct.js`)
  - Soft delete / activate product
  - Flips `is_active` value (0 ↔ 1)

- **Query Builders** (`src/utils/queryBuilder.js`)
  - `productQueryBuilder` → columns and values for POST
  - `searchProductByQuery` → conditions and values for dynamic search
  - `updateProductQuery` → conditions and values for partial updates

### Next Steps
- [x] JWT authentication
- [x] Invoices with invoice_items
- [ ] Pagination for list endpoints

### Notes
- All queries use parameterized placeholders (SQL injection safe)
- No hard deletes - `toggle-active` handles deactivation
- `sku` is unique across all products
- Search uses `LIKE` for name and category (partial match)

---

## [Clients Module] - 2026-03-24

### Added
- **PATCH /clients/:id** (`src/handlers/clientHandlers/updateClients.js`)
  - Update allowed fields: phone, address, contact_name, contact_phone, business_name
  - Validates at least one field is provided
  - Returns updated client without sensitive data
  - Whitelist validation for updatable fields

- **PATCH /clients/:id/change-password** (`src/handlers/clientHandlers/updateClients.js`)
  - Requires password (current) and newPassword
  - Validates newPassword format (min 8 chars, at least one letter and one number)
  - Prevents reusing the same password
  - Verifies current password with bcrypt
  - Hashes new password with bcrypt (10 rounds) before update

- **PATCH /clients/:id/toggle-active** (`src/handlers/clientHandlers/updateClients.js`)
  - Soft delete / activate client
  - Flips is_active value (0 ↔ 1)

- **GET /clients/verify/:verification_token** (`src/handlers/clientHandlers/verifyClient.js`)
  - Account activation via token
  - Token format validation (hexadecimal, 64 chars)
  - Single query update using affectedRows (no SELECT)
  - Sets is_active = true, verified_at = NOW(), verification_token = NULL

- **GET /clients/search** (`src/handlers/clientHandlers/clients.js`)
  - Dynamic query builder for multiple filters
  - Whitelist validation for allowed columns (business_name, email, is_active, tax_id, phone)
  - Supports LIKE for business_name (partial match)
  - Returns array of clients (200) even if empty

- **GET /clients/all** (`src/handlers/clientHandlers/clients.js`)
  - Returns all clients with filtered fields (excludes password, verification_token)

- **GET /clients/:id** (`src/handlers/clientHandlers/clients.js`)
  - Returns single client by UUID
  - 404 if not found

### Changed
- Refactored getClientsByQuery to support multiple filters dynamically
- Added whitelist validation for query parameters
- Moved validations.js from services/ to utils/ for consistency
- Created queryBuilder.js utility for dynamic WHERE clause generation

### Next Steps
- [x] Products module (table + CRUD)
- [x] Invoices with invoice_items
- [x] JWT authentication for admin endpoints

### Notes
- All updates use parameterized queries (SQL injection safe)
- No hard deletes - toggle-active handles client deactivation
- Password update requires current password verification (security best practice)

---

## [Clients Module] - 2026-03-23

### Schema
- Dropped users table, created clients with:
  - id CHAR(36) PRIMARY KEY DEFAULT (UUID())
  - business_name VARCHAR(255) NOT NULL UNIQUE
  - tax_id VARCHAR(50) NOT NULL UNIQUE
  - email VARCHAR(100) NOT NULL UNIQUE
  - phone VARCHAR(20) NULL
  - address TEXT NULL
  - contact_name VARCHAR(100) NULL
  - contact_phone VARCHAR(20) NULL
  - password VARCHAR(255) NOT NULL
  - verification_token VARCHAR(255) NULL
  - verified_at TIMESTAMP NULL
  - is_active BOOLEAN DEFAULT false
  - last_login TIMESTAMP NULL
  - created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  - updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### Added
- **Validation service** (`src/utils/validations.js`)
  - isValidUUID() - UUID format validation
  - isValidEmail() - email format validation
  - isValidPassword() - password strength validation (min 8 chars, at least one letter and one number)

- **POST /clients** (`src/handlers/clientHandlers/postClient.js`)
  - Required fields validation (business_name, tax_id, email, password)
  - Email and password format validation
  - Password hashing with bcrypt (10 rounds)
  - Token generation with crypto.randomBytes(32).toString('hex')
  - Dynamic query builder for optional fields (phone, address, contact_name, contact_phone)
  - Returns created client without sensitive data
  - Handles duplicate entries with 409 Conflict response

### Technical Decisions
- Raw MySQL queries with parameterized placeholders (SQL injection safe)
- UUID generation handled by MySQL DEFAULT (UUID())
- Connection pool configured with mysql2/promise
- No ORM - full control over queries

### Notes
- All inserts use placeholders (`?`) to prevent SQL injection
- is_active defaults to false until email verification
- verification_token to be sent via email (Nodemailer pending)