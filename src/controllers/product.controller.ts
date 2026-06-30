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


// ==================== PRODUCT ====================

export const getProductByNameController = async (req: Request, res: Response) => {
    const { name } = req.params;
    if (!name) {
        return res.status(400).json({ error: "El nombre del producto es requerido" });
    }
    try {
        const product = await getProductByName(name as string);
        return res.status(200).json({ message: "Producto obtenido correctamente", data: product });
    } catch (error) {
        return res.status(500).json({ error: error});
    }
}

export const getProductsController = async (_req: Request, res: Response) => {
    const { data, error } = await getSupabaseAdmin().from("products").select("*");
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ message: "Productos obtenidos correctamente", data });
}

export const getProductByIdController = async (req: Request, res: Response) => { 
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: "El ID del producto es requerido" });
    }
    try {
        const product = await getProductById(id as string);
        return res.status(200).json({ message: "Producto obtenido correctamente", data: product });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export const createProductController = async (req: Request, res: Response) => {
    const { name, price, stock, description, imageUrl, category } = req.body;
    
    if (!name || !price || !stock || !description || !imageUrl || !category) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    try {
        const existingProduct = await getProductByName(name);
        if (existingProduct) {
            return res.status(400).json({ error: "El nombre del producto ya existe" });
        }

        const product = await createProduct({ name, price, stock, description, imageUrl, category });
        return res.status(201).json({ message: "Producto creado correctamente", product });
    } catch (error: any) {
        return res.status(500).json({ error: `Error al crear el producto: ${error.message}` });
    }
}

export const updateProductController = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, price, stock, description, imageUrl, category } = req.body;
    if (!name || !price || !stock || !description || !imageUrl || !category) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
    }
    try {
        const product = await updateProduct(id as string, { name, price, stock, description, imageUrl, category });
        return res.status(200).json({ message: "Producto actualizado correctamente", data: product})
    } catch (error) {
        return res.status(500).json({ error: `Error al actualizar el producto: ${(error as Error).message}` });
    }
}

export const deleteProductController = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: "El ID del producto es requerido" });
    }
    try {
        const product = await deleteProduct(id as string);
        return res.status(200).json({ message: "Producto eliminado correctamente", data: product });
    } catch (error) {
        return res.status(500).json({ error: `Error al eliminar el producto: ${(error as Error).message}` });
    }
}

export const getProductsByCategoryController = async (req: Request, res: Response) => {
    const { category } = req.params;
    if (!category) {
        return res.status(400).json({ error: "La categoría es requerida" });
    }
    try {
        const products = await getProductsByCategory(category as string);
        return res.status(200).json({ message: "Productos obtenidos correctamente", data: products });
    } catch (error) {
        return res.status(500).json({ error: `Error al obtener los productos por categoría: ${(error as Error).message}` });
    }
}

export const getProductsByPriceLowToHighController = async (req: Request, res: Response) => { 
    try {
        const products = await getProductsByPriceLowToHigh();
        return res.status(200).json({ message: "Productos obtenidos correctamente", data: products });
    } catch (error) {
        return res.status(500).json({ error: `Error al obtener los productos por precio de menor a mayor: ${(error as Error).message}` });
    }
}

export const getProductsByPriceHighToLowController = async (req: Request, res: Response) => {
    try {
        const products = await getProductsByPriceHighToLow();
        return res.status(200).json({ message: "Productos obtenidos correctamente", data: products });
    } catch (error) {
        return res.status(500).json({ error: `Error al obtener los productos por precio de mayor a menor: ${(error as Error).message}` });
    }
}
