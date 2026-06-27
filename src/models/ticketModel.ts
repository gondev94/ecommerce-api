import { Schema, model, Types } from "mongoose";
import type { Ticket } from "./ticket.js";


const ticketSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true },
    ticketId: { type: String, required: true },
    cartId: { type: Types.ObjectId, ref: "Cart", required: true },
    products: [{
        productId: { type: Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    status: {
        type: String, enum: ["pending", "paid", "cancelled"],
        default: "pending"
    },
    paymentMethod: {
        type: String, enum: ["credit card", "stripe", "cash", "debit card", "paypal", "bank transfer"],
        default: "credit card"
    },
    paymentStatus: {
        type: String, enum: ["pending", "paid", "failed"],
        default: "pending"
    },
}, { timestamps: true, versionKey: false });

export const TicketModel = model<Ticket>("Ticket", ticketSchema);