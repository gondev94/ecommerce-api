import type { Request, Response } from "express";
import type Stripe from "stripe";
import {
    verifyWebhookSignature,
    getPaymentIntent,
    createRefund,
} from "../services/stripe.service.js";
import {
    updatePaymentStatus,
    getPaymentByOrderId,
    getPaymentsByUserId,
    markPaymentRefunded,
    isPaymentAlreadyProcessed,
} from "../services/payment.service.js";
import { updateOrderStatus, updatePaymentStatus as updateOrderPaymentStatus } from "../services/order.service.js";
import { isValidUUID } from "../middlewares/validation.middleware.js";

/**
 * SEGURIDAD en webhooks de Stripe:
 * 
 * 1. SIEMPRE verificar la firma del webhook
 * 2. Usar el raw body (no parseado como JSON)
 * 3. Responder rápidamente (< 5 segundos)
 * 4. Ser idempotente (procesar el mismo evento dos veces no causa problemas)
 * 5. No confiar en los datos del webhook para lógica crítica sin verificar
 */

// ==================== WEBHOOK ====================

/**
 * Procesar webhook de Stripe
 * IMPORTANTE: Esta ruta NO debe usar el middleware de JSON parsing normal
 *             Necesita el raw body para verificar la firma
 */
export const stripeWebhookController = async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
        console.error("Webhook sin firma");
        return res.status(400).json({ error: "Falta firma de webhook" });
    }

    let event: Stripe.Event;

    try {
        // SEGURIDAD: Verificar firma antes de procesar
        // req.body debe ser el raw body (Buffer), no JSON parseado
        event = verifyWebhookSignature(req.body, signature);
    } catch (error) {
        console.error("Firma de webhook inválida:", error);
        return res.status(400).json({ error: "Firma inválida" });
    }

    // Procesar el evento según su tipo
    try {
        switch (event.type) {
            case "payment_intent.succeeded":
                await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
                break;

            case "payment_intent.payment_failed":
                await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
                break;

            case "charge.refunded":
                await handleRefund(event.data.object as Stripe.Charge);
                break;

            default:
                // Eventos no manejados - solo loggear
                console.log(`Evento no manejado: ${event.type}`);
        }

        // Siempre responder 200 para que Stripe no reintente
        return res.status(200).json({ received: true });
    } catch (error) {
        console.error("Error procesando webhook:", error);
        // Responder 500 para que Stripe reintente
        return res.status(500).json({ error: "Error procesando webhook" });
    }
};

/**
 * Manejar pago exitoso
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const { id: paymentIntentId, metadata } = paymentIntent;
    const orderId = metadata?.orderId;

    if (!orderId) {
        console.error("PaymentIntent sin orderId en metadata");
        return;
    }

    // IDEMPOTENCIA: Verificar si ya procesamos este pago
    const alreadyProcessed = await isPaymentAlreadyProcessed(paymentIntentId);
    if (alreadyProcessed) {
        console.log(`Pago ${paymentIntentId} ya procesado, ignorando`);
        return;
    }

    // Obtener información del cargo para detalles de tarjeta
    const charge = paymentIntent.latest_charge as Stripe.Charge | null;
    const cardDetails = charge?.payment_method_details?.card;
    const stripeChargeId = typeof charge === "string" ? charge : charge?.id;

    // Actualizar el pago en nuestra DB
    await updatePaymentStatus(paymentIntentId, "succeeded", {
        ...(stripeChargeId && { stripeChargeId }),
        ...(cardDetails?.last4 && { cardLast4: cardDetails.last4 }),
        ...(cardDetails?.brand && { cardBrand: cardDetails.brand }),
        ...(charge?.receipt_url && { receiptUrl: charge.receipt_url }),
    });

    // Actualizar la orden
    await updateOrderPaymentStatus(orderId, "paid", paymentIntentId);
    await updateOrderStatus(orderId, "confirmed");

    console.log(`Pago exitoso para orden ${orderId}`);
}

/**
 * Manejar pago fallido
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const { id: paymentIntentId, metadata, last_payment_error } = paymentIntent;
    const orderId = metadata?.orderId;

    if (!orderId) {
        console.error("PaymentIntent sin orderId en metadata");
        return;
    }

    // Actualizar el pago como fallido
    await updatePaymentStatus(paymentIntentId, "failed", {
        failureReason: last_payment_error?.message || "Pago rechazado",
    });

    // Actualizar la orden
    await updateOrderPaymentStatus(orderId, "failed");

    console.log(`Pago fallido para orden ${orderId}: ${last_payment_error?.message}`);
}

/**
 * Manejar reembolso
 */
async function handleRefund(charge: Stripe.Charge) {
    const paymentIntentId = charge.payment_intent as string;
    const refunds = charge.refunds?.data;

    if (!paymentIntentId || !refunds || refunds.length === 0) {
        return;
    }

    const latestRefund = refunds[0];
    if (!latestRefund) {
        return;
    }
    
    const refundedAmount = charge.amount_refunded;

    // Actualizar el pago como reembolsado
    await markPaymentRefunded(paymentIntentId, {
        refundedAmount: refundedAmount,
        stripeRefundId: latestRefund.id,
    });

    console.log(`Reembolso procesado: ${refundedAmount} centavos`);
}

// ==================== USER ENDPOINTS ====================

/**
 * Obtener historial de pagos del usuario
 */
export const getMyPaymentsController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        const payments = await getPaymentsByUserId(req.user.id);

        return res.status(200).json({
            message: "Pagos obtenidos correctamente",
            data: payments,
        });
    } catch (error) {
        console.error("Error obteniendo pagos:", error);
        return res.status(500).json({ error: "Error al obtener los pagos" });
    }
};

/**
 * Obtener estado de pago de una orden
 */
export const getPaymentStatusController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        const orderId = req.params.orderId;

        if (!orderId || typeof orderId !== "string" || !isValidUUID(orderId)) {
            return res.status(400).json({ error: "ID de orden inválido" });
        }

        const payment = await getPaymentByOrderId(orderId);

        if (!payment) {
            return res.status(404).json({ error: "Pago no encontrado" });
        }

        // Verificar que el pago pertenece al usuario
        if (payment.user_id !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ error: "No tiene permiso para ver este pago" });
        }

        return res.status(200).json({
            message: "Estado de pago obtenido",
            data: {
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                cardLast4: payment.card_last4,
                cardBrand: payment.card_brand,
                receiptUrl: payment.receipt_url,
            },
        });
    } catch (error) {
        console.error("Error obteniendo estado de pago:", error);
        return res.status(500).json({ error: "Error al obtener el estado del pago" });
    }
};

// ==================== ADMIN ENDPOINTS ====================

/**
 * Crear reembolso (solo admin)
 */
export const createRefundController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id || req.user.role !== "admin") {
            return res.status(403).json({ error: "Solo administradores pueden crear reembolsos" });
        }

        const orderId = req.params.orderId;
        const { amount, reason } = req.body;

        if (!orderId || typeof orderId !== "string" || !isValidUUID(orderId)) {
            return res.status(400).json({ error: "ID de orden inválido" });
        }

        // Obtener el pago de la orden
        const payment = await getPaymentByOrderId(orderId);

        if (!payment) {
            return res.status(404).json({ error: "Pago no encontrado" });
        }

        if (payment.status !== "succeeded") {
            return res.status(400).json({ error: "Solo se pueden reembolsar pagos exitosos" });
        }

        // Crear reembolso en Stripe
        const refund = await createRefund(
            payment.stripe_payment_intent_id,
            amount,  // undefined = reembolso completo
            reason as "duplicate" | "fraudulent" | "requested_by_customer" | undefined
        );

        return res.status(200).json({
            message: "Reembolso creado correctamente",
            data: {
                refundId: refund.id,
                amount: refund.amount,
                status: refund.status,
            },
        });
    } catch (error) {
        console.error("Error creando reembolso:", error);
        return res.status(500).json({ error: "Error al crear el reembolso" });
    }
};
