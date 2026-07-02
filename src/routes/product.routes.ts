import { Router } from "express";
import {
    getProductsController,
    getProductByIdController,
    createProductController,
    updateProductController,
    deleteProductController,
    getProductsByCategoryController,
    getProductsByPriceLowToHighController,
    getProductsByPriceHighToLowController,
} from "../controllers/product.controller.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { validateUUIDParam, validateProductData } from "../middlewares/validation.middleware.js";

const router = Router();

/**
 * Rutas de productos
 * - GET: Públicas (cualquiera puede ver productos)
 * - POST/PUT/DELETE: Solo admin
 */

// ==================== RUTAS PÚBLICAS ====================

// GET /api/products - Listar todos los productos
router.get("/", getProductsController);

// GET /api/products/category/:category - Productos por categoría
router.get("/category/:category", getProductsByCategoryController);

// GET /api/products/price-low-to-high - Ordenar por precio ascendente
router.get("/price-low-to-high", getProductsByPriceLowToHighController);

// GET /api/products/price-high-to-low - Ordenar por precio descendente
router.get("/price-high-to-low", getProductsByPriceHighToLowController);

// GET /api/products/:id - Obtener producto por ID
router.get("/:id", validateUUIDParam("id"), getProductByIdController);

// ==================== RUTAS PROTEGIDAS (Admin) ====================

// POST /api/products - Crear producto (solo admin)
router.post("/", 
    authMiddleware, 
    requireRole("admin"),
    validateProductData,
    createProductController
);

// PUT /api/products/:id - Actualizar producto (solo admin)
router.put("/:id", 
    authMiddleware, 
    requireRole("admin"),
    validateUUIDParam("id"),
    validateProductData,
    updateProductController
);

// DELETE /api/products/:id - Eliminar producto (solo admin)
router.delete("/:id", 
    authMiddleware, 
    requireRole("admin"),
    validateUUIDParam("id"),
    deleteProductController
);

export default router;