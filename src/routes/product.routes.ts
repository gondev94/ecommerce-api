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

const router = Router();

// Product routes
router.get("/", getProductsController);
router.get("/:id", getProductByIdController);
router.post("/", createProductController);
router.put("/:id", updateProductController);
router.delete("/:id", deleteProductController);
router.get("/category/:category", getProductsByCategoryController);
router.get("/price-low-to-high", getProductsByPriceLowToHighController);
router.get("/price-high-to-low", getProductsByPriceHighToLowController);

export default router;