import { getSupabaseAdmin } from "./supabase.service.js";

// ==================== CART ====================

export const createCart = async (userId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart")
        .insert({ user_id: userId })
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const getCartById = async (cartId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart")
        .select("*, cart_items(*, products(*))")
        .eq("id", cartId)
        .single();
    if (error) throw error;
    
    // Calcular el total del carrito
    const items = data?.cart_items || [];
    const total = items.reduce((sum: number, item: any) => {
        const price = item.products?.price || 0;
        return sum + (price * item.quantity);
    }, 0);
    
    return { ...data, total };
};

export const getCartByUserId = async (userId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart")
        .select("*, cart_items(*, products(*))")
        .eq("user_id", userId)
        .single();
    if (error) throw error;
    
    // Calcular el total del carrito
    const items = data?.cart_items || [];
    const total = items.reduce((sum: number, item: any) => {
        const price = item.products?.price || 0;
        return sum + (price * item.quantity);
    }, 0);
    
    return { ...data, total };
};

export const deleteCart = async (cartId: string) => {
    const { error } = await getSupabaseAdmin()
        .from("cart")
        .delete()
        .eq("id", cartId);
    if (error) throw error;
    return `Carrito ${cartId} eliminado correctamente`;
};

// ==================== CART ITEMS ====================

export const addItemToCart = async (itemData: {
    cart_id: string;
    product_id: string;
    quantity: number;
}) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart_items")
        .insert(itemData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const getCartItems = async (cartId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart_items")
        .select("*")
        .eq("cart_id", cartId);
    if (error) throw error;
    return data;
};

export const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const removeItemFromCart = async (itemId: string) => {
    const { error } = await getSupabaseAdmin()
        .from("cart_items")
        .delete()
        .eq("id", itemId);
    if (error) throw error;
    return `Carrito items ${itemId} eliminados correctamente`;
};

export const clearCart = async (cartId: string) => {
    const { error } = await getSupabaseAdmin()
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId);
    if (error) throw error;
    return `Carrito items ${cartId} eliminados correctamente`;
};