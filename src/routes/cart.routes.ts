import { Router } from "express";
import {
    createCartController,
    getMyCartController,
    deleteMyCartController,
    addItemController,
    getCartItemsController,
    updateItemQuantityController,
    removeItemController,
    clearCartController
} from "../controllers/cart.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateUUIDParam, validateCartItemData } from "../middlewares/validation.middleware.js";

const router = Router();

/**
 * Rutas del carrito
 * TODAS requieren autenticación
 * El usuario solo puede acceder a SU propio carrito
 */

// ==================== CARRITO ====================

// POST /api/cart - Crear carrito para el usuario autenticado
router.post("/", 
    authMiddleware, 
    createCartController
);

// GET /api/cart/me - Obtener MI carrito
router.get("/me", 
    authMiddleware, 
    getMyCartController
);

// DELETE /api/cart/me - Eliminar MI carrito
router.delete("/me", 
    authMiddleware, 
    deleteMyCartController
);

// ==================== ITEMS DEL CARRITO ====================

// POST /api/cart/items - Agregar item a MI carrito
router.post("/items", 
    authMiddleware,
    validateCartItemData,
    addItemController
);

// GET /api/cart/items - Obtener items de MI carrito
router.get("/items", 
    authMiddleware, 
    getCartItemsController
);

// PATCH /api/cart/items/:itemId - Actualizar cantidad de un item
router.patch("/items/:itemId", 
    authMiddleware,
    validateUUIDParam("itemId"),
    updateItemQuantityController
);

// DELETE /api/cart/items/:itemId - Eliminar item del carrito
router.delete("/items/:itemId", 
    authMiddleware,
    validateUUIDParam("itemId"),
    removeItemController
);

// DELETE /api/cart/clear - Vaciar MI carrito
router.delete("/clear", 
    authMiddleware, 
    clearCartController
);

export default router;
