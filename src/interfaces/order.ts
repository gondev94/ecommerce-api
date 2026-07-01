export interface OrderItem {
    id?: number;
    orderId: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Order {
    id?: string;
    userId: string;

    //montos
    subtotal: number; // Suma de items
    shippingCost: number; // Costo de envío
    discount: number; // Descuento aplicado
    total: number; // subtotal + shipping - discount

    //estados
    status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
    paymentStatus: "pending" | "paid" | "failed";

    //pago
    paymentMethod?: string;
    paymentId?: string;

    //envío
    shippingAddressId?: string;
    trackingNumber?: string;

    //items

    items?: OrderItem[];

    createdAt?: Date;
    updatedAt?: Date;
    


}

