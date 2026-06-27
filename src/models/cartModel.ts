import { Schema, model, Types } from "mongoose";
import type { Cart } from "./cart.js";

const cartSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true },
    products: [{
        productId: { type: Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true }
    }]
}, { timestamps: true, versionKey: false });


export const CartModel = model<Cart>("Cart", cartSchema);
