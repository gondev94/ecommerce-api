import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "../routes/auth.routes.js";
import userRoutes from "../routes/user.routes.js";
import productRoutes from "../routes/product.routes.js";
import cartRoutes from "../routes/cart.routes.js";
import orderRoutes from "../routes/order.routes.js";
import paymentRoutes from "../routes/payment.routes.js";

const app = express();

// ==================== SEGURIDAD ====================

// Helmet: Añade headers de seguridad HTTP
app.use(helmet());

// CORS: Configurar orígenes permitidos
const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(",") 
    : ["http://localhost:7771"];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (mobile apps, Postman, etc) en desarrollo
        if (!origin && process.env.NODE_ENV !== "production") {
            return callback(null, true);
        }
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("No permitido por CORS"));
        }
    },
    credentials: true,
}));

// ==================== RATE LIMITING ====================

// Rate limiter general: 100 requests por 15 minutos por IP
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: { error: "Demasiadas solicitudes, intenta de nuevo más tarde" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter estricto para auth/pagos: 10 requests por 15 minutos
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "Demasiados intentos, espera 15 minutos" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar rate limiter general a todas las rutas
app.use(generalLimiter);

// Aplicar rate limiter estricto a rutas sensibles
app.use("/api/auth/login", strictLimiter);
app.use("/api/auth/register", strictLimiter);
app.use("/api/orders/checkout", strictLimiter);
app.use("/api/payments/refund", strictLimiter);

// ==================== WEBHOOK DE STRIPE ====================
// IMPORTANTE: El webhook de Stripe necesita el raw body ANTES de express.json()
// Por eso se configura aquí, antes del middleware de JSON
app.use(
    "/api/payments/webhook",
    express.raw({ type: "application/json" })
);

// ==================== PARSING ====================

// JSON parser para el resto de rutas
app.use(express.json({ limit: "10kb" }));  // Limitar tamaño para prevenir ataques

// ==================== RUTAS ====================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Error interno del servidor" });
});

// ==================== SERVER ====================

const rawPort = process.env.PORT;
const PORT = rawPort ? Number(rawPort) : 7771;

if (Number.isNaN(PORT)) {
    throw new Error("PORT is not a number");
}

export function startServer() {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
}