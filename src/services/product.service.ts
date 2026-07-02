import { getSupabaseAdmin } from "./supabase.service.js";
import type { TablesInsert, TablesUpdate } from "../types/database.types.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Obtener todos los productos
 */
export const getProducts = async () => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
};

/**
 * Obtener producto por ID
 */
export const getProductById = async (productId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
    if (error) throw error;
    return data;
};

/**
 * Crear producto
 */
export const createProduct = async (productData: TablesInsert<"products">) => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .insert({
            id: uuidv4(),
            ...productData
        })
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Actualizar producto
 */
export const updateProduct = async (
    productId: string,
    productData: TablesUpdate<"products">,
) => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .update({
            ...productData,
            updated_at: new Date().toISOString()
        })
        .eq("id", productId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Eliminar producto
 */
export const deleteProduct = async (productId: string) => {
    const { error } = await getSupabaseAdmin()
        .from("products")
        .delete()
        .eq("id", productId);
    if (error) throw error;
    return { deleted: true, productId };
};

/**
 * Obtener productos por categoría
 */
export const getProductsByCategory = async (category: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*")
        .eq("category", category)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
};

/**
 * Obtener productos ordenados por precio (menor a mayor)
 */
export const getProductsByPriceLowToHigh = async () => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*")
        .order("price", { ascending: true });
    if (error) throw error;
    return data;
};

/**
 * Obtener productos ordenados por precio (mayor a menor)
 */
export const getProductsByPriceHighToLow = async () => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*")
        .order("price", { ascending: false });
    if (error) throw error;
    return data;
};

/**
 * Obtener producto por nombre
 */
export const getProductByName = async (name: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*")
        .eq("name", name)
        .maybeSingle();
    if (error) throw error;
    return data;
};

/**
 * Verificar stock disponible
 */
export const checkStock = async (productId: string, quantity: number): Promise<boolean> => {
    const product = await getProductById(productId);
    return (product.stock ?? 0) >= quantity;
};

/**
 * Actualizar stock (restar cantidad)
 */
export const decreaseStock = async (productId: string, quantity: number) => {
    const product = await getProductById(productId);
    const newStock = (product.stock ?? 0) - quantity;
    
    if (newStock < 0) {
        throw new Error(`Stock insuficiente para el producto ${product.name}`);
    }
    
    return updateProduct(productId, { stock: newStock });
};

/**
 * Restaurar stock (cuando se cancela una orden)
 */
export const restoreStock = async (productId: string, quantity: number) => {
    const product = await getProductById(productId);
    const newStock = (product.stock ?? 0) + quantity;
    
    return updateProduct(productId, { stock: newStock });
};
