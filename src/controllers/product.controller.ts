import type { Request, Response } from "express";
import {
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    getProductsByPriceLowToHigh,
    getProductsByPriceHighToLow,
    getProductByName,
} from "../services/product.service.js";
import { getSupabaseAdmin } from "../services/supabase.service.js";
import { isValidUUID, sanitizeString } from "../middlewares/validation.middleware.js";

/**
 * SEGURIDAD: 
 * - GET: Públicas
 * - POST/PUT/DELETE: Solo admin (configurado en routes)
 * - Errores sanitizados (no exponer detalles internos)
 */

// ==================== PÚBLICAS ====================

/**
 * Obtener todos los productos
 */
export const getProductsController = async (_req: Request, res: Response) => {
    try {
        const { data, error } = await getSupabaseAdmin()
            .from("products")
            .select("*")
            .order("created_at", { ascending: false });
            
        if (error) throw error;
        
        return res.status(200).json({ 
            message: "Productos obtenidos correctamente", 
            data 
        });
    } catch (error) {
        console.error("Error obteniendo productos:", error);
        return res.status(500).json({ error: "Error al obtener productos" });
    }
};

/**
 * Obtener producto por ID
 */
export const getProductByIdController = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        
        if (!id || typeof id !== "string" || !isValidUUID(id)) {
            return res.status(400).json({ error: "ID de producto inválido" });
        }

        const { data, error } = await getSupabaseAdmin()
            .from("products")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return res.status(404).json({ error: "Producto no encontrado" });
            }
            throw error;
        }

        return res.status(200).json({ 
            message: "Producto obtenido correctamente", 
            data 
        });
    } catch (error) {
        console.error("Error obteniendo producto:", error);
        return res.status(500).json({ error: "Error al obtener el producto" });
    }
};

/**
 * Obtener productos por categoría
 */
export const getProductsByCategoryController = async (req: Request, res: Response) => {
    try {
        const category: string = req.params.category as string;
        
        if (!category) {
            return res.status(400).json({ error: "La categoría es requerida" });
        }

        const sanitizedCategory = sanitizeString(category);
        const products = await getProductsByCategory(sanitizedCategory);
        
        return res.status(200).json({ 
            message: "Productos obtenidos correctamente", 
            data: products 
        });
    } catch (error) {
        console.error("Error obteniendo productos por categoría:", error);
        return res.status(500).json({ error: "Error al obtener productos" });
    }
};

/**
 * Obtener productos ordenados por precio (menor a mayor)
 */
export const getProductsByPriceLowToHighController = async (_req: Request, res: Response) => {
    try {
        const products = await getProductsByPriceLowToHigh();
        return res.status(200).json({ 
            message: "Productos obtenidos correctamente", 
            data: products 
        });
    } catch (error) {
        console.error("Error obteniendo productos:", error);
        return res.status(500).json({ error: "Error al obtener productos" });
    }
};

/**
 * Obtener productos ordenados por precio (mayor a menor)
 */
export const getProductsByPriceHighToLowController = async (_req: Request, res: Response) => {
    try {
        const products = await getProductsByPriceHighToLow();
        return res.status(200).json({ 
            message: "Productos obtenidos correctamente", 
            data: products 
        });
    } catch (error) {
        console.error("Error obteniendo productos:", error);
        return res.status(500).json({ error: "Error al obtener productos" });
    }
};

// ==================== PROTEGIDAS (Admin) ====================

/**
 * Crear producto (solo admin)
 */
export const createProductController = async (req: Request, res: Response) => {
    try {
        const { name, price, stock, description, imageUrl, category } = req.body;

        // El middleware validateProductData ya validó, pero double-check
        if (!name || price === undefined) {
            return res.status(400).json({ error: "Nombre y precio son requeridos" });
        }

        // Verificar si ya existe un producto con ese nombre
        const existingProduct = await getProductByName(name);
        if (existingProduct) {
            return res.status(409).json({ error: "Ya existe un producto con ese nombre" });
        }

        const product = await createProduct({ 
            name, 
            price, 
            stock: stock || 0, 
            description, 
            imageUrl, 
            category 
        });

        return res.status(201).json({ 
            message: "Producto creado correctamente", 
            data: product 
        });
    } catch (error) {
        console.error("Error creando producto:", error);
        return res.status(500).json({ error: "Error al crear el producto" });
    }
};

/**
 * Actualizar producto (solo admin)
 */
export const updateProductController = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { name, price, stock, description, imageUrl, category } = req.body;

        if (!id || typeof id !== "string" || !isValidUUID(id)) {
            return res.status(400).json({ error: "ID de producto inválido" });
        }

        const product = await updateProduct(id, { 
            name, 
            price, 
            stock, 
            description, 
            imageUrl, 
            category 
        });

        return res.status(200).json({ 
            message: "Producto actualizado correctamente", 
            data: product 
        });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === "PGRST116") {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        console.error("Error actualizando producto:", error);
        return res.status(500).json({ error: "Error al actualizar el producto" });
    }
};

/**
 * Eliminar producto (solo admin)
 */
export const deleteProductController = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        if (!id || typeof id !== "string" || !isValidUUID(id)) {
            return res.status(400).json({ error: "ID de producto inválido" });
        }

        await deleteProduct(id);

        return res.status(200).json({ 
            message: "Producto eliminado correctamente" 
        });
    } catch (error) {
        console.error("Error eliminando producto:", error);
        return res.status(500).json({ error: "Error al eliminar el producto" });
    }
};

/**
 * Obtener producto por nombre (interno)
 */
export const getProductByNameController = async (req: Request, res: Response) => {
    try {
        const { name } = req.params as { name: string };
        
        if (!name) {
            return res.status(400).json({ error: "El nombre del producto es requerido" });
        }

        const product = await getProductByName(sanitizeString(name));
        
        if (!product) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        return res.status(200).json({ 
            message: "Producto obtenido correctamente", 
            data: product 
        });
    } catch (error) {
        console.error("Error obteniendo producto:", error);
        return res.status(500).json({ error: "Error al obtener el producto" });
    }
};
