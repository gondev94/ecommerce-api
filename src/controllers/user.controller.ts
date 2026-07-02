import type { Request, Response } from "express";
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from "../services/user.service.js";
import { isValidUUID } from "../middlewares/validation.middleware.js";

/**
 * SEGURIDAD: Todos los endpoints de usuarios requieren rol admin
 * (configurado en routes)
 * El service ya excluye el campo password de todas las respuestas
 */

/**
 * Obtener todos los usuarios
 */
export const getAllUsers = async (_req: Request, res: Response) => {
    try {
        const users = await getUsers();
        return res.status(200).json({
            message: "Usuarios obtenidos correctamente",
            data: users
        });
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        return res.status(500).json({ error: "Error al obtener usuarios" });
    }
};

/**
 * Obtener usuario por ID
 */
export const getUserByIdController = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        if (!id || typeof id !== "string" || !isValidUUID(id)) {
            return res.status(400).json({ error: "ID de usuario inválido" });
        }

        const user = await getUserById(id);
        return res.status(200).json({
            message: "Usuario obtenido correctamente",
            data: user
        });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === "PGRST116") {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        console.error("Error obteniendo usuario:", error);
        return res.status(500).json({ error: "Error al obtener usuario" });
    }
};

// Alias para mantener compatibilidad con las rutas
export { getUserByIdController as getUserById };

/**
 * Crear usuario (solo admin)
 * NOTA: role es un array de strings en la DB
 */
export const createUserController = async (req: Request, res: Response) => {
    try {
        const { email, name, role } = req.body;

        if (!email || !name) {
            return res.status(400).json({ error: "Email y nombre son requeridos" });
        }

        // Validar formato de email básico
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: "Formato de email inválido" });
        }

        // Validar roles permitidos (role puede ser string o array)
        const validRoles = ["user", "admin"];
        let roleArray: string[] = ["user"]; // Default
        
        if (role) {
            roleArray = Array.isArray(role) ? role : [role];
            const invalidRoles = roleArray.filter(r => !validRoles.includes(r));
            if (invalidRoles.length > 0) {
                return res.status(400).json({ error: `Roles inválidos: ${invalidRoles.join(", ")}` });
            }
        }

        const user = await createUser({ email, name, role: roleArray });
        return res.status(201).json({
            message: "Usuario creado correctamente",
            data: user
        });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === "23505") {
            return res.status(409).json({ error: "El email ya está registrado" });
        }
        console.error("Error creando usuario:", error);
        return res.status(500).json({ error: "Error al crear usuario" });
    }
};

// Alias para mantener compatibilidad
export { createUserController as createUser };

/**
 * Actualizar usuario (solo admin)
 * NOTA: role es un array de strings en la DB
 */
export const updateUserController = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { email, name, role } = req.body;

        if (!id || typeof id !== "string" || !isValidUUID(id)) {
            return res.status(400).json({ error: "ID de usuario inválido" });
        }

        // Validar que al menos un campo se quiere actualizar
        if (!email && !name && !role) {
            return res.status(400).json({ error: "Debe proporcionar al menos un campo para actualizar" });
        }

        // Validar email si se proporciona
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: "Formato de email inválido" });
        }

        // Validar roles permitidos (role puede ser string o array)
        const validRoles = ["user", "admin"];
        let roleArray: string[] | undefined;
        
        if (role) {
            // Convertir a array si es string
            roleArray = Array.isArray(role) ? role : [role];
            
            // Validar que todos los roles sean válidos
            const invalidRoles = roleArray.filter(r => !validRoles.includes(r));
            if (invalidRoles.length > 0) {
                return res.status(400).json({ error: `Roles inválidos: ${invalidRoles.join(", ")}` });
            }
        }

        const updateData: { email?: string; name?: string; role?: string[] } = {};
        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (roleArray) updateData.role = roleArray;

        const user = await updateUser(id, updateData);
        return res.status(200).json({
            message: "Usuario actualizado correctamente",
            data: user
        });
    } catch (error: unknown) {
        const err = error as { code?: string };
        if (err.code === "PGRST116") {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        if (err.code === "23505") {
            return res.status(409).json({ error: "El email ya está en uso" });
        }
        console.error("Error actualizando usuario:", error);
        return res.status(500).json({ error: "Error al actualizar usuario" });
    }
};

// Alias para mantener compatibilidad
export { updateUserController as updateUser };

/**
 * Eliminar usuario (solo admin)
 */
export const deleteUserController = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        if (!id || typeof id !== "string" || !isValidUUID(id)) {
            return res.status(400).json({ error: "ID de usuario inválido" });
        }

        // Evitar que un admin se elimine a sí mismo
        if (req.user?.id === id) {
            return res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
        }

        await deleteUser(id);
        return res.status(200).json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error("Error eliminando usuario:", error);
        return res.status(500).json({ error: "Error al eliminar usuario" });
    }
};

// Alias para mantener compatibilidad
export { deleteUserController as deleteUser };
