import { Schema, model } from "mongoose";
import type { Product } from "./product.js";

const productSchema = new Schema<Product>({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    category: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },    
},
    { timestamps: true, versionKey: false }
);

export const ProductModel = model<Product>("Product", productSchema);