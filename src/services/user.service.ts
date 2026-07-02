import { getSupabaseAdmin } from "./supabase.service.js";
import type { TablesInsert, TablesUpdate } from "../types/database.types.js";
import { v4 as uuidv4 } from "uuid";

/**
 * SEGURIDAD: Campos seguros para exponer en la API
 * NUNCA incluir 'password' en las queries
 */
const SAFE_USER_FIELDS = "id, email, name, role, created_at";

/**
 * Obtener todos los usuarios (sin password)
 */
export const getUsers = async () => {
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .select(SAFE_USER_FIELDS)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
};

/**
 * Obtener usuario por ID (sin password)
 */
export const getUserById = async (userId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .select(SAFE_USER_FIELDS)
        .eq("id", userId)
        .single();
    if (error) throw error;
    return data;
};

/**
 * Crear usuario
 * NOTA: En producción, el registro debería hacerse via Supabase Auth
 * Esta función es solo para admin crear usuarios manualmente
 */
export const createUser = async (userData: TablesInsert<"users">) => {
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .insert({
            id: uuidv4(),
            ...userData
        })
        .select(SAFE_USER_FIELDS)
        .single();
    if (error) throw error;
    return data;
};

/**
 * Actualizar usuario (sin exponer password)
 */
export const updateUser = async (userId: string, userData: TablesUpdate<"users">) => {
    // No permitir actualizar el password por esta vía
    const { password, ...safeData } = userData as TablesUpdate<"users"> & { password?: string };
    
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .update(safeData)
        .eq("id", userId)
        .select(SAFE_USER_FIELDS)
        .single();
    if (error) throw error;
    return data;
};

/**
 * Eliminar usuario
 */
export const deleteUser = async (userId: string) => {
    const { error } = await getSupabaseAdmin()
        .from("users")
        .delete()
        .eq("id", userId);
    if (error) throw error;
    return { deleted: true, userId };
};

/**
 * Verificar si un usuario existe
 */
export const userExists = async (userId: string): Promise<boolean> => {
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
    if (error) throw error;
    return data !== null;
};

/**
 * Obtener usuario por email (sin password)
 */
export const getUserByEmail = async (email: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .select(SAFE_USER_FIELDS)
        .eq("email", email)
        .maybeSingle();
    if (error) throw error;
    return data;
};
