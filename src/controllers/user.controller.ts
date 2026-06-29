import type { Request, Response } from "express"
import { getSupabaseAdmin } from "../services/supabase.service.js"

export const getAllUsers = async (_req: Request, res: Response) => {
    const { data, error } = await getSupabaseAdmin().from("users").select("*")
    if (error) {
        return res.status(500).json({ error: error.message })
    }

    return res.json(data)
}

export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "El ID del usuario es requerido" });
    }
    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .select("*")
        .eq("id", id as string)
        .single()

    if (error) {
        return res.status(404).json({ error: "Usuario no encontrado" })
    }

    return res.json(data)
}

export const createUser = async (req: Request, res: Response) => {
    const { email, name, password, role } = req.body

    if (!email || !name) {
        return res.status(400).json({ error: "Email y nombre son requeridos" })
    }

    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .insert({ email, name, password, role })
        .select()
        .single()

    if (error) {
        return res.status(500).json({ error: error.message })
    }

    return res.status(201).json(data)
}

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params
    const { email, name, password, role } = req.body

    if (!email || !name || !password || !role) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const { data, error } = await getSupabaseAdmin()
        .from("users")
        .update({ email, name, password, role })
        .eq("id", id as string)
        .select()
        .single()

    if (error) {
        return res.status(500).json({ error: error.message })
    }

    return res.json(data)
}

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params
    if (!id) {
        return res.status(400).json({ error: "El ID del usuario es requerido" });
    }
    const { error } = await getSupabaseAdmin()
        .from("users")
        .delete()
        .eq("id", id as string)

    if (error) {
        return res.status(500).json({ error: error.message })
    }

    return res.json({ message: "Usuario eliminado correctamente" })
}
