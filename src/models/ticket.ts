import type { Types } from "mongoose";
interface TicketProduct {
    productId: Types.ObjectId;
    quantity: number;
    price: number;
    total: number;
}
export interface Ticket {
    userId: Types.ObjectId;
    ticketId: string;
    cartId: Types.ObjectId;
    products: TicketProduct[];
    totalAmount: number;
    status: "pending" | "paid" | "cancelled";
    paymentStatus: "pending" | "paid" | "failed";
    paymentMethod?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
