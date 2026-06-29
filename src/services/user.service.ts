import { getSupabaseAdmin } from "./supabase.service.js";
import type { TablesInsert, TablesUpdate } from "../types/database.types.js";

export const getUsers = async () => {
    const { data, error } = await getSupabaseAdmin().from("users").select("*");
    if (error) throw error;
    return `Lista de usuarios ${data}`;
};

export const createUser = async (userData: TablesInsert<"users">) => {
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .insert(userData)
        .select();
    if (error) throw error;
    return `Usuario ${userData.name} creado correctamente`;
};

export const updateUser = async (userId: number, userData: TablesUpdate<"users">) => { 
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .update(userData)
        .eq("id", userId)
        .select();
    if (error) throw error;
    return `Usuario ${data} actualizado correctamente`;
}

export const deleteUser = async (userId: number) => {
    const { error } = await getSupabaseAdmin()
        .from("users")
        .delete()
        .eq("id", userId);
    if (error) throw error;
    return `Usuario ${userId} eliminado correctamente`;
};

export const getUserById = async (userId: number) => {
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
    if (error) throw error;
    return `Usuario ${data} encontrado correctamente`;
};