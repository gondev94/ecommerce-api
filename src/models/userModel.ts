import { Schema, model } from "mongoose";
import type { User } from "./user.js";

const userSchema = new Schema<User>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
},
    { timestamps: true, versionKey: false }
);

export const UserModel = model<User>("User", userSchema);