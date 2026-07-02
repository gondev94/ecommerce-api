import { Router } from "express";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from "../controllers/user.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { validateUUIDParam } from "../middlewares/validation.middleware.js";

const router = Router();

/**
 * Rutas de usuarios
 * TODAS requieren autenticación y rol de admin
 */

// GET /api/users - Listar todos los usuarios (solo admin)
router.get("/", 
    authMiddleware, 
    requireRole("admin"), 
    getAllUsers
);

// GET /api/users/:id - Obtener usuario por ID (solo admin)
router.get("/:id", 
    authMiddleware, 
    requireRole("admin"),
    validateUUIDParam("id"),
    getUserById
);

// POST /api/users - Crear usuario (solo admin)
router.post("/", 
    authMiddleware, 
    requireRole("admin"), 
    createUser
);

// PUT /api/users/:id - Actualizar usuario (solo admin)
router.put("/:id", 
    authMiddleware, 
    requireRole("admin"),
    validateUUIDParam("id"),
    updateUser
);

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete("/:id", 
    authMiddleware, 
    requireRole("admin"),
    validateUUIDParam("id"),
    deleteUser
);

export default router;
