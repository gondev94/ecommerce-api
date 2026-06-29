import { Router } from "express";
import {
    createCartController,
    getCartByIdController,
    getCartByUserIdController,
    deleteCartController,
    addItemController,
    getCartItemsController,
    updateItemQuantityController,
    removeItemController,
    clearCartController
} from "../controllers/cart.controller.js";

const router = Router();

// Cart routes
router.post("/", createCartController);
router.get("/:id", getCartByIdController);
router.get("/user/:userId", getCartByUserIdController);
router.delete("/:id", deleteCartController);

// Cart items routes
router.post("/:cartId/items", addItemController);
router.get("/:cartId/items", getCartItemsController);
router.patch("/items/:itemId", updateItemQuantityController);
router.delete("/items/:itemId", removeItemController);
router.delete("/:cartId/clear", clearCartController);

export default router;
