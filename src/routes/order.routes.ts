import { Router } from "express";
import {
    checkoutController,
    getOrderByIdController,
    getMyOrdersController,
    updateOrderStatusController,
} from "../controllers/order.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { validateCheckoutData, validateUUIDParam } from "../middlewares/validation.middleware.js";

const router = Router();

/**
 * Rutas de órdenes
 * 
 * SEGURIDAD:
 * - Todas las rutas requieren autenticación
 * - Las rutas de admin requieren rol admin
 * - Todos los IDs se validan como UUID
 */

// ==================== RUTAS DE USUARIO ====================

// POST /api/orders/checkout - Iniciar checkout
// Requiere: autenticación + datos de checkout válidos
router.post(
    "/checkout",
    authMiddleware,
    validateCheckoutData,
    checkoutController
);

// GET /api/orders/my-orders - Obtener mis órdenes
// Requiere: autenticación
router.get(
    "/my-orders",
    authMiddleware,
    getMyOrdersController
);

// GET /api/orders/:id - Obtener una orden específica
// Requiere: autenticación + ser dueño de la orden (o admin)
router.get(
    "/:id",
    authMiddleware,
    validateUUIDParam("id"),
    getOrderByIdController
);

// ==================== RUTAS DE ADMIN ====================

// PATCH /api/orders/:id/status - Actualizar estado de orden
// Requiere: autenticación + rol admin
router.patch(
    "/:id/status",
    authMiddleware,
    requireRole("admin"),
    validateUUIDParam("id"),
    updateOrderStatusController
);

export default router;
