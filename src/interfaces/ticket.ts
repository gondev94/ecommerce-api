interface TicketProduct {
    productId: number;
    quantity: number;
    price: number;
    total: number;
}
export interface Ticket {
    userId: number;
    ticketId: number;
    cartId: number;
    products: TicketProduct[];
    totalAmount: number;
    status: "pending" | "paid" | "cancelled";
    paymentStatus: "pending" | "paid" | "failed";
    paymentMethod?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
