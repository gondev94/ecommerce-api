import type { Types } from "mongoose";

export interface Cart {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    products: {
        productId: Types.ObjectId;
        quantity: number;
        price: number;
        total: number;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}