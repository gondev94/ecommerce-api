import type { Payment } from "../interfaces/payment.js";
import type { TablesUpdate } from "../types/database.types.js";
import { getSupabaseAdmin } from "./supabase.service.js";

/**
 * Service para gestionar pagos en la base de datos
 * Trabaja en conjunto con stripe.service.ts
 */

// ==================== CREATE ====================

/**
 * Crear un registro de pago inicial (estado: pending)
 * Se crea cuando se genera el PaymentIntent
 */
export const createPayment = async (paymentData: {
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    stripePaymentIntentId: string;
}) => {
    const { data, error } = await getSupabaseAdmin()
        .from("payments")
        .insert({
            order_id: paymentData.orderId,
            user_id: paymentData.userId,
            amount: paymentData.amount,
            currency: paymentData.currency,
            stripe_payment_intent_id: paymentData.stripePaymentIntentId,
            status: "pending",
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ==================== READ ====================

/**
 * Obtener un pago por su ID
 */
export const getPaymentById = async (paymentId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Obtener pago por PaymentIntent ID de Stripe
 * Útil para procesar webhooks
 */
export const getPaymentByStripeId = async (stripePaymentIntentId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("payments")
        .select("*")
        .eq("stripe_payment_intent_id", stripePaymentIntentId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Obtener pago de una orden específica
 */
export const getPaymentByOrderId = async (orderId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
    return data;
};

/**
 * Obtener historial de pagos de un usuario
 */
export const getPaymentsByUserId = async (userId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("payments")
        .select("*, orders(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
};

// ==================== UPDATE ====================

/**
 * Actualizar estado del pago cuando Stripe confirma
 * Se llama desde el webhook
 */
export const updatePaymentStatus = async (
    stripePaymentIntentId: string,
    status: Payment["status"],
    additionalData?: {
        stripeChargeId?: string;
        cardLast4?: string;
        cardBrand?: string;
        receiptUrl?: string;
        failureReason?: string;
    }
) => {
    const updateData: TablesUpdate<"payments"> = {
        status,
        updated_at: new Date().toISOString(),
        ...(additionalData?.stripeChargeId && { stripe_charge_id: additionalData.stripeChargeId }),
        ...(additionalData?.cardLast4 && { card_last4: additionalData.cardLast4 }),
        ...(additionalData?.cardBrand && { card_brand: additionalData.cardBrand }),
        ...(additionalData?.receiptUrl && { receipt_url: additionalData.receiptUrl }),
        ...(additionalData?.failureReason && { failure_reason: additionalData.failureReason }),
    };

    const { data, error } = await getSupabaseAdmin()
        .from("payments")
        .update(updateData)
        .eq("stripe_payment_intent_id", stripePaymentIntentId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Marcar un pago como reembolsado
 */
export const markPaymentRefunded = async (
    stripePaymentIntentId: string,
    refundData: {
        refundedAmount: number;
        stripeRefundId: string;
    }
) => {
    const { data, error } = await getSupabaseAdmin()
        .from("payments")
        .update({
            status: "refunded",
            refunded_amount: refundData.refundedAmount,
            stripe_refund_id: refundData.stripeRefundId,
            updated_at: new Date().toISOString(),
        })
        .eq("stripe_payment_intent_id", stripePaymentIntentId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ==================== HELPERS ====================

/**
 * Verificar si un pago ya fue procesado
 * Evita procesar el mismo webhook dos veces
 */
export const isPaymentAlreadyProcessed = async (
    stripePaymentIntentId: string
): Promise<boolean> => {
    const payment = await getPaymentByStripeId(stripePaymentIntentId);
    return payment?.status === "succeeded";
};
