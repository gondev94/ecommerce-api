import { getSupabaseAdmin } from "./supabase.service.js";
import type { TablesInsert, TablesUpdate } from "../types/database.types.js";

export const getProducts = async () => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*");
    if (error) throw error;
    return `Lista de productos ${data.map((product) => product.name)}`;
};

export const getProductById = async (productId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
    if (error) throw error;
    return `Producto ${data} encontrado correctamente`;
};

export const createProduct = async (productData: TablesInsert<"products">) => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .insert(productData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const updateProduct = async (
    productId: string,
    productData: TablesUpdate<"products">,
) => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .update(productData)
        .eq("id", productId)
        .select();
    if (error) throw error;
    return `Producto ${data} actualizado correctamente`;
};

export const deleteProduct = async (productId: string) => {
    const { error } = await getSupabaseAdmin()
        .from("products")
        .delete()
        .eq("id", productId);
    if (error) throw error;
    return `Producto ${productId} eliminado correctamente`;
};

export const getProductsByCategory = async (category: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*")
        .eq("category", category);
    if (error) throw error;
    return `Productos de la categoria ${category} encontrados correctamente`;
};

export const getProductsByPriceLowToHigh = async () => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*")
        .order("price", { ascending: true });
    if (error) throw error;
    return `Productos ordenados de menor a mayor precio encontrados correctamente`;
}

export const getProductsByPriceHighToLow = async () => {
    const { data, error } = await getSupabaseAdmin()
        .from("products")
        .select("*")
        .order("price", { ascending: false });
    if (error) throw error;
    return `Productos ordenados de mayor a menor precio encontrados correctamente`;
}

