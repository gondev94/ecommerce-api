import { Router } from "express";
import {
    registerController,
    loginController,
    logoutController,
    getMeController,
    refreshTokenController,
    changePasswordController
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * Rutas de autenticación
 * 
 * Públicas:
 * - POST /register - Registrar usuario
 * - POST /login - Iniciar sesión
 * - POST /refresh - Refrescar token
 * 
 * Protegidas (requieren token):
 * - POST /logout - Cerrar sesión
 * - GET /me - Obtener mi perfil
 * - POST /change-password - Cambiar contraseña
 */

// ==================== RUTAS PÚBLICAS ====================

// POST /api/auth/register - Registrar nuevo usuario
router.post("/register", registerController);

// POST /api/auth/login - Iniciar sesión
router.post("/login", loginController);

// POST /api/auth/refresh - Refrescar token de acceso
router.post("/refresh", refreshTokenController);

// ==================== RUTAS PROTEGIDAS ====================

// POST /api/auth/logout - Cerrar sesión
router.post("/logout", authMiddleware, logoutController);

// GET /api/auth/me - Obtener perfil del usuario autenticado
router.get("/me", authMiddleware, getMeController);

// POST /api/auth/change-password - Cambiar contraseña
router.post("/change-password", authMiddleware, changePasswordController);

export default router;
