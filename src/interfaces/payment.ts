// Interface para pagos con Stripe
// Guarda la información de cada transacción

export interface Payment {
    id?: string;
    orderId: string;
    userId: string;

    // Monto (Stripe usa centavos: $10.00 = 1000)
    amount: number;
    currency: string;

    // Estado del pago
    status: "pending" | "succeeded" | "failed" | "canceled" | "refunded";

    // IDs de Stripe (importantes para consultas y reembolsos)
    stripePaymentIntentId: string;
    stripeCustomerId?: string;
    stripeChargeId?: string;

    // Información de la tarjeta (solo últimos 4 dígitos, nunca el número completo)
    cardLast4?: string;
    cardBrand?: string;

    // Reembolsos
    refundedAmount?: number;
    stripeRefundId?: string;

    // Metadatos
    receiptUrl?: string;
    failureReason?: string;

    createdAt?: Date;
    updatedAt?: Date;
}

// Tipo para crear un PaymentIntent en Stripe
export interface CreatePaymentIntentInput {
    orderId: string;
    userId: string;
    amount: number;        // En centavos
    currency?: string;     // Default: "usd"
    metadata?: Record<string, string>;
}

// Respuesta de Stripe al crear PaymentIntent
export interface PaymentIntentResponse {
    clientSecret: string;  // Se envía al frontend para completar el pago
    paymentIntentId: string;
}
