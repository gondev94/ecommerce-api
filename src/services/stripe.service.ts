import Stripe from "stripe";

/**
 * SEGURIDAD: Configuración de Stripe
 * 
 * - La API key NUNCA debe estar hardcodeada
 * - Usar variables de entorno
 * - La secret key solo se usa en el servidor, nunca en el frontend
 */

// Verificar que la API key esté configurada
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    console.warn("⚠️  STRIPE_SECRET_KEY no está configurada - los pagos no funcionarán");
}

// Inicializar cliente de Stripe solo si hay API key
let stripe: Stripe | null = null;

if (STRIPE_SECRET_KEY) {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: "2026-06-24.dahlia",
    });
}

// Helper para verificar que Stripe está configurado
function getStripe(): Stripe {
    if (!stripe) {
        throw new Error("Stripe no está configurado. Añade STRIPE_SECRET_KEY a las variables de entorno.");
    }
    return stripe;
}

/**
 * Crear un PaymentIntent
 * Este es el primer paso del flujo de pago
 * 
 * @param amount - Monto en centavos (ej: $10.00 = 1000)
 * @param currency - Moneda (default: usd)
 * @param metadata - Información adicional (orderId, userId)
 */
export const createPaymentIntent = async (params: {
    amount: number;
    currency?: string;
    orderId: string;
    userId: string;
    customerEmail?: string;
}) => {
    try {
        // Validar monto mínimo (Stripe requiere al menos 50 centavos)
        if (params.amount < 50) {
            throw new Error("El monto mínimo es 50 centavos");
        }

        const paymentIntent = await getStripe().paymentIntents.create({
            amount: params.amount,
            currency: params.currency || "usd",
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                orderId: params.orderId,
                userId: params.userId,
            },
            ...(params.customerEmail && { receipt_email: params.customerEmail }),
        });

        return {
            clientSecret: paymentIntent.client_secret,  // Enviar al frontend
            paymentIntentId: paymentIntent.id,
        };
    } catch (error) {
        console.error("Error creando PaymentIntent:", error);
        throw error;
    }
};

/**
 * Obtener un PaymentIntent existente
 * Útil para verificar el estado de un pago
 */
export const getPaymentIntent = async (paymentIntentId: string) => {
    try {
        const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
        return paymentIntent;
    } catch (error) {
        console.error("Error obteniendo PaymentIntent:", error);
        throw error;
    }
};

/**
 * Cancelar un PaymentIntent
 * Solo se puede cancelar si no ha sido completado
 */
export const cancelPaymentIntent = async (paymentIntentId: string) => {
    try {
        const paymentIntent = await getStripe().paymentIntents.cancel(paymentIntentId);
        return paymentIntent;
    } catch (error) {
        console.error("Error cancelando PaymentIntent:", error);
        throw error;
    }
};

/**
 * Crear un reembolso
 * 
 * @param paymentIntentId - ID del PaymentIntent original
 * @param amount - Monto a reembolsar en centavos (opcional, si no se especifica reembolsa todo)
 */
export const createRefund = async (
    paymentIntentId: string,
    amount?: number,
    reason?: "duplicate" | "fraudulent" | "requested_by_customer"
) => {
    try {
        const refund = await getStripe().refunds.create({
            payment_intent: paymentIntentId,
            reason: reason || "requested_by_customer",
            ...(amount !== undefined && { amount }),
        });

        return refund;
    } catch (error) {
        console.error("Error creando reembolso:", error);
        throw error;
    }
};

/**
 * SEGURIDAD: Verificar firma de webhook
 * 
 * Los webhooks de Stripe vienen firmados para garantizar autenticidad
 * NUNCA procesar un webhook sin verificar la firma
 */
export const verifyWebhookSignature = (
    payload: string | Buffer,
    signature: string
): Stripe.Event => {
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("STRIPE_WEBHOOK_SECRET no está configurada");
    }

    try {
        // Stripe verifica que el payload no haya sido manipulado
        const event = getStripe().webhooks.constructEvent(
            payload,
            signature,
            WEBHOOK_SECRET
        );

        return event;
    } catch (error) {
        console.error("Error verificando webhook:", error);
        throw new Error("Firma de webhook inválida");
    }
};

/**
 * Crear o recuperar un cliente de Stripe
 * Útil para guardar métodos de pago del usuario
 */
export const createOrGetCustomer = async (params: {
    email: string;
    userId: string;
    name?: string;
}) => {
    try {
        // Buscar si el cliente ya existe
        const existingCustomers = await getStripe().customers.list({
            email: params.email,
            limit: 1,
        });

        if (existingCustomers.data.length > 0) {
            return existingCustomers.data[0];
        }

        // Crear nuevo cliente
        const customer = await getStripe().customers.create({
            email: params.email,
            metadata: {
                userId: params.userId,
            },
            ...(params.name && { name: params.name }),
        });

        return customer;
    } catch (error) {
        console.error("Error con cliente de Stripe:", error);
        throw error;
    }
};

/**
 * Convertir precio a centavos
 * Stripe maneja todos los montos en la unidad más pequeña de la moneda
 */
export const toCents = (amount: number): number => {
    return Math.round(amount * 100);
};

/**
 * Convertir centavos a precio
 */
export const fromCents = (cents: number): number => {
    return cents / 100;
};

// Exportar el cliente de Stripe para uso avanzado si es necesario
export { stripe, getStripe };
