import { getSupabaseAdmin } from "./supabase.service.js";

// ==================== CART ====================

export const createCart = async (userId: number) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart")
        .insert({ user_id: userId })
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const getCartById = async (cartId: number) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart")
        .select("*")
        .eq("id", cartId)
        .single();
    if (error) throw error;
    return data;
};

export const getCartByUserId = async (userId: number) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart")
        .select("*, cart_items(*)")
        .eq("user_id", userId)
        .single();
    if (error) throw error;
    return data;
};

export const deleteCart = async (cartId: number) => {
    const { error } = await getSupabaseAdmin()
        .from("cart")
        .delete()
        .eq("id", cartId);
    if (error) throw error;
};

// ==================== CART ITEMS ====================

export const addItemToCart = async (itemData: {
    cart_id: number;
    product_id: number;
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

export const getCartItems = async (cartId: number) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart_items")
        .select("*")
        .eq("cart_id", cartId);
    if (error) throw error;
    return data;
};

export const updateCartItemQuantity = async (itemId: number, quantity: number) => {
    const { data, error } = await getSupabaseAdmin()
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const removeItemFromCart = async (itemId: number) => {
    const { error } = await getSupabaseAdmin()
        .from("cart_items")
        .delete()
        .eq("id", itemId);
    if (error) throw error;
};

export const clearCart = async (cartId: number) => {
    const { error } = await getSupabaseAdmin()
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId);
    if (error) throw error;
};