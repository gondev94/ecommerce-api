import type { Request, Response } from "express";
import {
    createOrderFromCart,
    getOrderById,
    getOrdersByUserId,
    updateOrderStatus,
} from "../services/order.service.js";
import { createPaymentIntent, toCents } from "../services/stripe.service.js";
import { createPayment } from "../services/payment.service.js";
import { isValidUUID } from "../middlewares/validation.middleware.js";

/**
 * SEGURIDAD en controllers:
 * - Siempre validar que req.user exista (middleware debe haberse ejecutado)
 * - Validar que el usuario tenga permiso sobre el recurso
 * - No exponer errores internos al cliente
 * - Validar todos los inputs
 */

// ==================== CHECKOUT ====================

/**
 * Iniciar proceso de checkout
 * 1. Crea la orden desde el carrito
 * 2. Crea PaymentIntent en Stripe
 * 3. Retorna clientSecret para el frontend
 */
export const checkoutController = async (req: Request, res: Response) => {
    try {
        // 1. Verificar autenticación (el middleware ya validó, pero verificamos)
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        const userId = req.user.id;
        const { shippingAddressId, paymentMethod } = req.body;

        // 2. Validar inputs (el middleware ya validó, pero double-check)
        if (!shippingAddressId || !isValidUUID(shippingAddressId)) {
            return res.status(400).json({ error: "Dirección de envío inválida" });
        }

        // 3. Crear la orden desde el carrito
        const order = await createOrderFromCart(
            userId,
            shippingAddressId,
            paymentMethod || "card"
        );

        // 4. Crear PaymentIntent en Stripe
        const paymentIntent = await createPaymentIntent({
            amount: toCents(order.total),
            currency: "usd",
            orderId: order.id,
            userId: userId,
            ...(req.user.email && { customerEmail: req.user.email }),
        });

        // 5. Guardar registro de pago en DB
        await createPayment({
            orderId: order.id,
            userId: userId,
            amount: toCents(order.total),
            currency: "usd",
            stripePaymentIntentId: paymentIntent.paymentIntentId,
        });

        // 6. Retornar datos necesarios para el frontend
        return res.status(200).json({
            message: "Checkout iniciado correctamente",
            data: {
                orderId: order.id,
                clientSecret: paymentIntent.clientSecret,  // Para Stripe Elements
                total: order.total,
            },
        });
    } catch (error: unknown) {
        console.error("Error en checkout:", error);
        
        // No exponer detalles del error al cliente
        const message = error instanceof Error ? error.message : "Error en el proceso de checkout";
        
        // Si el carrito está vacío, retornar 400
        if (message.includes("carrito está vacío")) {
            return res.status(400).json({ error: message });
        }

        return res.status(500).json({ error: "Error en el proceso de checkout" });
    }
};

// ==================== READ ====================

/**
 * Obtener una orden por ID
 * SEGURIDAD: Verificar que la orden pertenece al usuario
 */
export const getOrderByIdController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        const id = req.params.id;

        // Validar UUID
        if (!id || typeof id !== "string" || !isValidUUID(id)) {
            return res.status(400).json({ error: "ID de orden inválido" });
        }

        const order = await getOrderById(id);

        if (!order) {
            return res.status(404).json({ error: "Orden no encontrada" });
        }

        // SEGURIDAD: Verificar que la orden pertenece al usuario
        // (excepto si es admin)
        if (order.user_id !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ error: "No tiene permiso para ver esta orden" });
        }

        return res.status(200).json({
            message: "Orden obtenida correctamente",
            data: order,
        });
    } catch (error) {
        console.error("Error obteniendo orden:", error);
        return res.status(500).json({ error: "Error al obtener la orden" });
    }
};

/**
 * Obtener historial de órdenes del usuario autenticado
 */
export const getMyOrdersController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        const orders = await getOrdersByUserId(req.user.id);

        return res.status(200).json({
            message: "Órdenes obtenidas correctamente",
            data: orders,
        });
    } catch (error) {
        console.error("Error obteniendo órdenes:", error);
        return res.status(500).json({ error: "Error al obtener las órdenes" });
    }
};

// ==================== UPDATE (Solo Admin) ====================

/**
 * Actualizar estado de una orden
 * Solo accesible por administradores
 */
export const updateOrderStatusController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        // Verificar rol admin (el middleware requireRole ya debería haber validado)
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Solo administradores pueden actualizar órdenes" });
        }

        const id = req.params.id;
        const { status } = req.body;

        // Validar UUID
        if (!id || typeof id !== "string" || !isValidUUID(id)) {
            return res.status(400).json({ error: "ID de orden inválido" });
        }

        // Validar status
        const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: "Estado inválido",
                validStatuses: validStatuses,
            });
        }

        const order = await updateOrderStatus(id, status);

        return res.status(200).json({
            message: "Estado de orden actualizado",
            data: order,
        });
    } catch (error) {
        console.error("Error actualizando orden:", error);
        return res.status(500).json({ error: "Error al actualizar la orden" });
    }
};
