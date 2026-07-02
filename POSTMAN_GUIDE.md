# Guía de Testing con Postman

**Base URL:** `http://localhost:7771`

---

## Configuración Inicial

### 1. Variables de Entorno en Postman
Crea un Environment con estas variables:
- `base_url`: `http://localhost:7771`
- `token`: (se llenará después de login)

### 2. Header de Autenticación
Para rutas protegidas, agrega este header:
```
Authorization: Bearer {{token}}
```

---

## 1. HEALTH CHECK

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/health` | No | Verificar que el servidor está corriendo |

**Respuesta esperada:**
```json
{
  "status": "ok"
}
```

---

## 2. AUTENTICACIÓN (Auth)

### Rutas Públicas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar nuevo usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh` | Refrescar token |

### Rutas Protegidas (requieren token)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/auth/me` | Obtener mi perfil |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/change-password` | Cambiar contraseña |

### Ejemplos:

#### POST /api/auth/register (Registrar usuario)
```
POST {{base_url}}/api/auth/register
Headers:
  Content-Type: application/json

Body:
{
  "email": "usuario@ejemplo.com",
  "password": "miPassword123",
  "name": "Juan Pérez"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Usuario registrado correctamente",
  "data": {
    "user": {
      "id": "uuid-del-usuario",
      "email": "usuario@ejemplo.com",
      "name": "Juan Pérez",
      "role": "user"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "v1.refresh-token...",
      "expires_in": 3600,
      "expires_at": 1234567890
    }
  }
}
```

#### POST /api/auth/login (Iniciar sesión)
```
POST {{base_url}}/api/auth/login
Headers:
  Content-Type: application/json

Body:
{
  "email": "usuario@ejemplo.com",
  "password": "miPassword123"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "uuid-del-usuario",
      "email": "usuario@ejemplo.com",
      "name": "Juan Pérez",
      "role": "user"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "v1.refresh-token...",
      "expires_in": 3600,
      "expires_at": 1234567890
    }
  }
}
```

> **TIP Postman:** Después de login, guarda el `access_token` en tu variable `{{token}}`

#### GET /api/auth/me (Mi perfil)
```
GET {{base_url}}/api/auth/me
Headers:
  Authorization: Bearer {{token}}
```

#### POST /api/auth/refresh (Refrescar token)
```
POST {{base_url}}/api/auth/refresh
Headers:
  Content-Type: application/json

Body:
{
  "refresh_token": "v1.refresh-token..."
}
```

#### POST /api/auth/change-password (Cambiar contraseña)
```
POST {{base_url}}/api/auth/change-password
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "currentPassword": "miPasswordActual",
  "newPassword": "miNuevoPassword123"
}
```

#### POST /api/auth/logout (Cerrar sesión)
```
POST {{base_url}}/api/auth/logout
Headers:
  Authorization: Bearer {{token}}
```

---

## 3. PRODUCTOS (Products)

### Rutas Públicas (sin autenticación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Listar todos los productos |
| GET | `/api/products/:id` | Obtener producto por ID |
| GET | `/api/products/category/:category` | Productos por categoría |
| GET | `/api/products/price-low-to-high` | Productos ordenados precio ↑ |
| GET | `/api/products/price-high-to-low` | Productos ordenados precio ↓ |

### Rutas Admin (requieren token + rol admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/products` | Crear producto |
| PUT | `/api/products/:id` | Actualizar producto |
| DELETE | `/api/products/:id` | Eliminar producto |

### Ejemplos:

#### GET /api/products
```
GET {{base_url}}/api/products
```

#### GET /api/products/:id
```
GET {{base_url}}/api/products/550e8400-e29b-41d4-a716-446655440000
```

#### POST /api/products (Admin)
```
POST {{base_url}}/api/products
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "name": "Camiseta Básica",
  "description": "Camiseta 100% algodón",
  "price": 29.99,
  "stock": 100,
  "category": "ropa",
  "imageUrl": "https://example.com/camiseta.jpg"
}
```

#### PUT /api/products/:id (Admin)
```
PUT {{base_url}}/api/products/550e8400-e29b-41d4-a716-446655440000
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "name": "Camiseta Premium",
  "price": 39.99,
  "stock": 50
}
```

---

## 4. USUARIOS (Users) - Solo Admin

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar todos los usuarios |
| GET | `/api/users/:id` | Obtener usuario por ID |
| POST | `/api/users` | Crear usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

### Ejemplos:

#### GET /api/users (Admin)
```
GET {{base_url}}/api/users
Headers:
  Authorization: Bearer {{token}}
```

#### POST /api/users (Admin)
```
POST {{base_url}}/api/users
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "role": "user"
}
```

---

## 5. CARRITO (Cart) - Requiere Autenticación

### Carrito

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/cart` | Crear carrito |
| GET | `/api/cart/me` | Obtener mi carrito |
| DELETE | `/api/cart/me` | Eliminar mi carrito |

### Items del Carrito

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/cart/items` | Agregar item al carrito |
| GET | `/api/cart/items` | Ver items del carrito |
| PATCH | `/api/cart/items/:itemId` | Actualizar cantidad |
| DELETE | `/api/cart/items/:itemId` | Eliminar item |
| DELETE | `/api/cart/clear` | Vaciar carrito |

### Ejemplos:

#### POST /api/cart (Crear carrito)
```
POST {{base_url}}/api/cart
Headers:
  Authorization: Bearer {{token}}
```

#### GET /api/cart/me (Mi carrito)
```
GET {{base_url}}/api/cart/me
Headers:
  Authorization: Bearer {{token}}
```

#### POST /api/cart/items (Agregar producto)
```
POST {{base_url}}/api/cart/items
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "productId": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 2
}
```

#### PATCH /api/cart/items/:itemId (Actualizar cantidad)
```
PATCH {{base_url}}/api/cart/items/550e8400-e29b-41d4-a716-446655440001
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "quantity": 5
}
```

#### DELETE /api/cart/items/:itemId (Eliminar item)
```
DELETE {{base_url}}/api/cart/items/550e8400-e29b-41d4-a716-446655440001
Headers:
  Authorization: Bearer {{token}}
```

#### DELETE /api/cart/clear (Vaciar carrito)
```
DELETE {{base_url}}/api/cart/clear
Headers:
  Authorization: Bearer {{token}}
```

---

## 6. ÓRDENES (Orders) - Requiere Autenticación

### Rutas de Usuario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/orders/checkout` | Iniciar checkout |
| GET | `/api/orders/my-orders` | Mis órdenes |
| GET | `/api/orders/:id` | Detalle de orden |

### Rutas Admin

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| PATCH | `/api/orders/:id/status` | Actualizar estado |

### Ejemplos:

#### POST /api/orders/checkout
```
POST {{base_url}}/api/orders/checkout
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "shippingAddressId": "550e8400-e29b-41d4-a716-446655440002",
  "paymentMethod": "card"
}
```

**Respuesta:**
```json
{
  "message": "Checkout iniciado correctamente",
  "data": {
    "orderId": "uuid-de-la-orden",
    "clientSecret": "pi_xxx_secret_xxx",
    "total": 59.98
  }
}
```

#### GET /api/orders/my-orders
```
GET {{base_url}}/api/orders/my-orders
Headers:
  Authorization: Bearer {{token}}
```

#### GET /api/orders/:id
```
GET {{base_url}}/api/orders/550e8400-e29b-41d4-a716-446655440003
Headers:
  Authorization: Bearer {{token}}
```

#### PATCH /api/orders/:id/status (Admin)
```
PATCH {{base_url}}/api/orders/550e8400-e29b-41d4-a716-446655440003/status
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "status": "shipped"
}
```

**Estados válidos:** `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`

---

## 7. PAGOS (Payments)

### Rutas de Usuario

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/payments/my-payments` | Mis pagos |
| GET | `/api/payments/order/:orderId` | Estado de pago de orden |

### Rutas Admin

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/payments/refund/:orderId` | Crear reembolso |

### Webhook (Stripe)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/payments/webhook` | Webhook de Stripe |

### Ejemplos:

#### GET /api/payments/my-payments
```
GET {{base_url}}/api/payments/my-payments
Headers:
  Authorization: Bearer {{token}}
```

#### GET /api/payments/order/:orderId
```
GET {{base_url}}/api/payments/order/550e8400-e29b-41d4-a716-446655440003
Headers:
  Authorization: Bearer {{token}}
```

#### POST /api/payments/refund/:orderId (Admin)
```
POST {{base_url}}/api/payments/refund/550e8400-e29b-41d4-a716-446655440003
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "amount": 1000,
  "reason": "requested_by_customer"
}
```

**Razones válidas:** `duplicate`, `fraudulent`, `requested_by_customer`

---

## Flujo de Compra Típico

```
1. POST /api/auth/register              → Registrar usuario (obtener token)
   o POST /api/auth/login               → Login (obtener token)
2. GET /api/products                    → Ver productos disponibles
3. POST /api/cart                       → Crear carrito
4. POST /api/cart/items                 → Agregar productos al carrito
5. GET /api/cart/me                     → Ver carrito con total
6. POST /api/orders/checkout            → Crear orden y obtener clientSecret
7. [Frontend: Stripe.confirmPayment()]  → Pagar con Stripe Elements
8. GET /api/orders/my-orders            → Ver historial de órdenes
```

---

## Códigos de Respuesta

| Código | Significado |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - No encontrado |
| 500 | Internal Server Error |

---

## Obtener Token de Autenticación

Ahora puedes obtener el token directamente desde tu API:

### Opción 1: Usar tu API (Recomendado)

**1. Registrar usuario:**
```
POST {{base_url}}/api/auth/register
Body: { "email": "test@test.com", "password": "123456", "name": "Test" }
```

**2. O hacer login si ya existe:**
```
POST {{base_url}}/api/auth/login
Body: { "email": "test@test.com", "password": "123456" }
```

**3. Copiar el `access_token` de la respuesta y guardarlo en la variable `{{token}}`**

### Configurar Token Automático en Postman

En la pestaña **Tests** del request de login/register, agrega:
```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.session.access_token);
}
```

Esto guardará automáticamente el token después de cada login.
