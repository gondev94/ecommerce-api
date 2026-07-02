import { Router, raw } from "express";
import {
    stripeWebhookController,
    getMyPaymentsController,
    getPaymentStatusController,
    createRefundController,
} from "../controllers/payment.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { validateUUIDParam } from "../middlewares/validation.middleware.js";

const router = Router();

/**
 * Rutas de pagos
 * 
 * SEGURIDAD:
 * - El webhook usa raw body para verificar firma de Stripe
 * - Las demás rutas requieren autenticación
 * - Los reembolsos solo los puede hacer un admin
 */

// ==================== WEBHOOK DE STRIPE ====================

// POST /api/payments/webhook - Webhook de Stripe
// IMPORTANTE: Esta ruta NO debe usar express.json()
// Debe usar express.raw() para recibir el body sin parsear
// Se configura en app.ts antes del middleware de JSON
router.post(
    "/webhook",
    raw({ type: "application/json" }),  // Raw body para verificar firma
    stripeWebhookController
);

// ==================== RUTAS DE USUARIO ====================

// GET /api/payments/my-payments - Obtener mis pagos
// Requiere: autenticación
router.get(
    "/my-payments",
    authMiddleware,
    getMyPaymentsController
);

// GET /api/payments/order/:orderId - Estado de pago de una orden
// Requiere: autenticación + ser dueño de la orden
router.get(
    "/order/:orderId",
    authMiddleware,
    validateUUIDParam("orderId"),
    getPaymentStatusController
);

// ==================== RUTAS DE ADMIN ====================

// POST /api/payments/refund/:orderId - Crear reembolso
// Requiere: autenticación + rol admin
router.post(
    "/refund/:orderId",
    authMiddleware,
    requireRole("admin"),
    validateUUIDParam("orderId"),
    createRefundController
);

export default router;
