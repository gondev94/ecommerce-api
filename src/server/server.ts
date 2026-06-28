import express from "express";
import userRoutes from "../routes/user.routes.js";

const app = express();

app.use(express.json());

// Rutas
app.use("/api/users", userRoutes);

const rawPort = process.env.PORT;
const PORT = rawPort ? Number(rawPort) : 7771;

if (Number.isNaN(PORT)) {
    throw new Error("PORT is not a number");
}

export function startServer() {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
}