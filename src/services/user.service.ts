import { getSupabaseAdmin } from "./supabase.service.js";

export const getUsers = async () => {
    const { data, error } = await getSupabaseAdmin().from("users").select("*");
    if (error) throw error;
    return data;
};

export const createUser = async (userData: { email: string; name: string }) => {
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .insert(userData)
        .select();
    if (error) throw error;
    return data;
};

export const updateUser = async (userId: string, userData: { email: string; name: string }) => { 
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .update(userData)
        .eq("id", userId)
        .select();
    if (error) throw error;
    return data;
}

export const deleteUser = async (userId: string) => {
    const { error } = await getSupabaseAdmin()
        .from("users")
        .delete()
        .eq("id", userId);
    if (error) throw error;
};

export const getUserById = async (userId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
    if (error) throw error;
    return data;
};