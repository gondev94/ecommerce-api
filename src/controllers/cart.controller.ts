import type { Request, Response } from "express";
import {
    createCart,
    getCartById,
    getCartByUserId,
    deleteCart,
    addItemToCart,
    getCartItems,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCart
} from "../services/cart.service.js";

// ==================== CART ====================

export const createCartController = async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "userId es requerido" });
    }
    try {
        const cart = await createCart(userId);
        return res.status(201).json(cart);
    } catch (error: any) {
        if (error.code === "23505") {
            return res.status(409).json({ error: "El usuario ya tiene un carrito" });
        }
        return res.status(500).json({ error: error.message || "Error al crear el carrito" });
    }
};

export const getCartByIdController = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "El ID del carrito es requerido" });
    }

    try {
        const cart = await getCartById(id);
        return res.json(cart);
    } catch (error: any) {
        if (error.code === "PGRST116") {
            return res.status(404).json({ error: "Carrito no encontrado" });
        }
        return res.status(500).json({ error: error.message || "Error al obtener el carrito" });
    }
};

export const getCartByUserIdController = async (req: Request<{ userId: string }>, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: "El ID del usuario es requerido" });
    }

    try {
        const cart = await getCartByUserId(userId);
        return res.json(cart);
    } catch (error: any) {
        if (error.code === "PGRST116") {
            return res.status(404).json({ error: "Carrito no encontrado para este usuario" });
        }
        return res.status(500).json({ error: error.message || "Error al obtener el carrito" });
    }
};

export const deleteCartController = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "El ID del carrito es requerido" });
    }

    try {
        await deleteCart(id);
        return res.json({ message: "Carrito eliminado correctamente" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || "Error al eliminar el carrito" });
    }
};

// ==================== CART ITEMS ====================

export const addItemController = async (req: Request<{ cartId: string }>, res: Response) => {
    const { cartId } = req.params;
    const { productId, quantity } = req.body;

    if (!cartId) {
        return res.status(400).json({ error: "El ID del carrito es requerido" });
    }

    if (!productId || quantity === undefined) {
        return res.status(400).json({ error: "productId y quantity son requeridos" });
    }

    if (quantity < 1) {
        return res.status(400).json({ error: "La cantidad debe ser al menos 1" });
    }

    try {
        const item = await addItemToCart({
            cart_id: cartId,
            product_id: productId,
            quantity
        });
        return res.status(201).json(item);
    } catch (error: any) {
        if (error.code === "23503") {
            return res.status(404).json({ error: "Carrito o producto no encontrado" });
        }
        return res.status(500).json({ error: error.message || "Error al agregar item" });
    }
};

export const getCartItemsController = async (req: Request<{ cartId: string }>, res: Response) => {
    const { cartId } = req.params;

    if (!cartId) {
        return res.status(400).json({ error: "El ID del carrito es requerido" });
    }

    try {
        const items = await getCartItems(cartId);
        return res.json(items);
    } catch (error: any) {
        return res.status(500).json({ error: error.message || "Error al obtener items" });
    }
};

export const updateItemQuantityController = async (req: Request<{ itemId: string }>, res: Response) => {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!itemId) {
        return res.status(400).json({ error: "El ID del item es requerido" });
    }

    if (quantity === undefined) {
        return res.status(400).json({ error: "quantity es requerido" });
    }

    if (quantity < 1) {
        return res.status(400).json({ error: "La cantidad debe ser al menos 1" });
    }

    try {
        const item = await updateCartItemQuantity(itemId, quantity);
        return res.json(item);
    } catch (error: any) {
        if (error.code === "PGRST116") {
            return res.status(404).json({ error: "Item no encontrado" });
        }
        return res.status(500).json({ error: error.message || "Error al actualizar item" });
    }
};

export const removeItemController = async (req: Request<{ itemId: string }>, res: Response) => {
    const { itemId } = req.params;

    if (!itemId) {
        return res.status(400).json({ error: "El ID del item es requerido" });
    }

    try {
        await removeItemFromCart(itemId);
        return res.json({ message: "Item eliminado correctamente" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || "Error al eliminar item" });
    }
};

export const clearCartController = async (req: Request<{ cartId: string }>, res: Response) => {
    const { cartId } = req.params;

    if (!cartId) {
        return res.status(400).json({ error: "El ID del carrito es requerido" });
    }

    try {
        await clearCart(cartId);
        return res.json({ message: "Carrito vaciado correctamente" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || "Error al vaciar carrito" });
    }
};
