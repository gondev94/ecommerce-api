import type { Request, Response } from "express";
import {
    createCart,
    getCartByUserId,
    deleteCart,
    addItemToCart,
    getCartItems,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCart
} from "../services/cart.service.js";
import { isValidUUID } from "../middlewares/validation.middleware.js";

/**
 * SEGURIDAD: Todos los controllers del carrito usan req.user.id
 * El usuario solo puede acceder a SU propio carrito
 * No se aceptan userIds desde el body o params
 */

// ==================== CARRITO ====================

/**
 * Crear carrito para el usuario autenticado
 */
export const createCartController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        const cart = await createCart(req.user.id);
        return res.status(201).json({
            message: "Carrito creado correctamente",
            data: cart
        });
    } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        if (err.code === "23505") {
            return res.status(409).json({ error: "Ya tienes un carrito activo" });
        }
        console.error("Error creando carrito:", error);
        return res.status(500).json({ error: "Error al crear el carrito" });
    }
};

/**
 * Obtener MI carrito (del usuario autenticado)
 */
export const getMyCartController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        const cart = await getCartByUserId(req.user.id);
        return res.status(200).json({
            message: "Carrito obtenido correctamente",
            data: cart
        });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === "PGRST116") {
            return res.status(404).json({ error: "No tienes un carrito. Crea uno primero." });
        }
        console.error("Error obteniendo carrito:", error);
        return res.status(500).json({ error: "Error al obtener el carrito" });
    }
};

/**
 * Eliminar MI carrito
 */
export const deleteMyCartController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        // Primero obtener el carrito del usuario para verificar que existe
        const cart = await getCartByUserId(req.user.id);
        
        await deleteCart(cart.id);
        return res.status(200).json({ message: "Carrito eliminado correctamente" });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === "PGRST116") {
            return res.status(404).json({ error: "No tienes un carrito para eliminar" });
        }
        console.error("Error eliminando carrito:", error);
        return res.status(500).json({ error: "Error al eliminar el carrito" });
    }
};

// ==================== ITEMS DEL CARRITO ====================

/**
 * Agregar item a MI carrito
 */
export const addItemController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        const { productId, quantity } = req.body;

        // Obtener el carrito del usuario
        const cart = await getCartByUserId(req.user.id);

        const item = await addItemToCart({
            cart_id: cart.id,
            product_id: productId,
            quantity
        });

        return res.status(201).json({
            message: "Item agregado al carrito",
            data: item
        });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === "PGRST116") {
            return res.status(404).json({ error: "No tienes un carrito. Crea uno primero." });
        }
        if (err.code === "23503") {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        console.error("Error agregando item:", error);
        return res.status(500).json({ error: "Error al agregar item al carrito" });
    }
};

/**
 * Obtener items de MI carrito
 */
export const getCartItemsController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        // Obtener el carrito del usuario
        const cart = await getCartByUserId(req.user.id);
        const items = await getCartItems(cart.id);

        return res.status(200).json({
            message: "Items obtenidos correctamente",
            data: items
        });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === "PGRST116") {
            return res.status(404).json({ error: "No tienes un carrito" });
        }
        console.error("Error obteniendo items:", error);
        return res.status(500).json({ error: "Error al obtener items del carrito" });
    }
};

/**
 * Actualizar cantidad de un item
 * SEGURIDAD: Verificamos que el item pertenece al carrito del usuario
 */
export const updateItemQuantityController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        const itemId = req.params.itemId;
        const { quantity } = req.body;

        if (!itemId || typeof itemId !== "string" || !isValidUUID(itemId)) {
            return res.status(400).json({ error: "ID de item inválido" });
        }

        if (quantity === undefined || typeof quantity !== "number" || quantity < 1) {
            return res.status(400).json({ error: "La cantidad debe ser un número mayor a 0" });
        }

        // Obtener el carrito del usuario para verificar ownership
        const cart = await getCartByUserId(req.user.id);
        const cartItems = await getCartItems(cart.id);
        
        // Verificar que el item pertenece al carrito del usuario
        const itemBelongsToUser = cartItems.some(item => item.id === itemId);
        if (!itemBelongsToUser) {
            return res.status(403).json({ error: "No tienes permiso para modificar este item" });
        }

        const item = await updateCartItemQuantity(itemId, quantity);
        return res.status(200).json({
            message: "Cantidad actualizada",
            data: item
        });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === "PGRST116") {
            return res.status(404).json({ error: "Item no encontrado" });
        }
        console.error("Error actualizando item:", error);
        return res.status(500).json({ error: "Error al actualizar item" });
    }
};

/**
 * Eliminar item del carrito
 * SEGURIDAD: Verificamos que el item pertenece al carrito del usuario
 */
export const removeItemController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        const itemId = req.params.itemId;

        if (!itemId || typeof itemId !== "string" || !isValidUUID(itemId)) {
            return res.status(400).json({ error: "ID de item inválido" });
        }

        // Obtener el carrito del usuario para verificar ownership
        const cart = await getCartByUserId(req.user.id);
        const cartItems = await getCartItems(cart.id);
        
        // Verificar que el item pertenece al carrito del usuario
        const itemBelongsToUser = cartItems.some(item => item.id === itemId);
        if (!itemBelongsToUser) {
            return res.status(403).json({ error: "No tienes permiso para eliminar este item" });
        }

        await removeItemFromCart(itemId);
        return res.status(200).json({ message: "Item eliminado correctamente" });
    } catch (error) {
        console.error("Error eliminando item:", error);
        return res.status(500).json({ error: "Error al eliminar item" });
    }
};

/**
 * Vaciar MI carrito
 */
export const clearCartController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: "No autorizado" });
        }

        // Obtener el carrito del usuario
        const cart = await getCartByUserId(req.user.id);
        
        await clearCart(cart.id);
        return res.status(200).json({ message: "Carrito vaciado correctamente" });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === "PGRST116") {
            return res.status(404).json({ error: "No tienes un carrito" });
        }
        console.error("Error vaciando carrito:", error);
        return res.status(500).json({ error: "Error al vaciar carrito" });
    }
};
