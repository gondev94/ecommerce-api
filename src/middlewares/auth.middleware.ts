import type { Request, Response, NextFunction } from "express";
import { getSupabaseAdmin } from "../services/supabase.service.js";

// Extender el tipo Request para incluir el usuario autenticado
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
                role?: string;
            };
        }
    }
}

/**
 * Middleware de autenticación
 * Valida el token JWT de Supabase y extrae la información del usuario
 * 
 * Seguridad:
 * - Verifica que el token exista
 * - Valida el token con Supabase (no lo decodificamos manualmente)
 * - Extrae el usuario del token validado
 */
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. Extraer el token del header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "No autorizado",
                message: "Token de autenticación no proporcionado",
            });
        }

        // 2. Obtener solo el token (quitar "Bearer ")
        const token = authHeader.substring(7);

        if (!token || token.trim() === "") {
            return res.status(401).json({
                error: "No autorizado",
                message: "Token inválido",
            });
        }

        // 3. Validar el token con Supabase
        // Supabase verifica la firma y expiración del JWT
        const { data: { user }, error } = await getSupabaseAdmin()
            .auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: "No autorizado",
                message: "Token inválido o expirado",
            });
        }

        // 4. Adjuntar el usuario al request para uso posterior
        req.user = {
            id: user.id,
            ...(user.email && { email: user.email }),
            role: user.user_metadata?.role || "user",
        };

        // 5. Continuar al siguiente middleware/controller
        next();
    } catch (error) {
        console.error("Error en autenticación:", error);
        return res.status(500).json({
            error: "Error interno",
            message: "Error al validar autenticación",
        });
    }
};

/**
 * Middleware para verificar roles específicos
 * Usar después de authMiddleware
 * 
 * Ejemplo: router.get("/admin", authMiddleware, requireRole("admin"), controller)
 */
export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: "No autorizado",
                message: "Debe iniciar sesión",
            });
        }

        const userRole = req.user.role || "user";

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: "Prohibido",
                message: "No tiene permisos para acceder a este recurso",
            });
        }

        next();
    };
};

/**
 * Middleware opcional de autenticación
 * No bloquea si no hay token, pero si hay token válido, adjunta el usuario
 * Útil para rutas que funcionan diferente para usuarios autenticados
 */
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);

            if (token && token.trim() !== "") {
                const { data: { user } } = await getSupabaseAdmin()
                    .auth.getUser(token);

                if (user) {
                    req.user = {
                        id: user.id,
                        ...(user.email && { email: user.email }),
                        role: user.user_metadata?.role || "user",
                    };
                }
            }
        }

        next();
    } catch {
        // Si hay error, simplemente continuamos sin usuario
        next();
    }
};
