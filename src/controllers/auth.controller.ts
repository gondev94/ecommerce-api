import type { Request, Response } from "express";
import { getSupabaseAdmin } from "../services/supabase.service.js";

/**
 * Controladores de autenticación
 * Usa Supabase Auth para gestionar usuarios y tokens JWT
 */

// ==================== REGISTRO ====================

/**
 * Registrar nuevo usuario
 * POST /api/auth/register
 */
export const registerController = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        // Validaciones básicas
        if (!email || !password) {
            return res.status(400).json({
                error: "Email y contraseña son requeridos"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 6 caracteres"
            });
        }

        // Crear usuario en Supabase Auth
        const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirmar email en desarrollo
            user_metadata: {
                name: name || "",
                role: "user"
            }
        });

        if (error) {
            // Manejar errores comunes
            if (error.message.includes("already registered")) {
                return res.status(409).json({
                    error: "Este email ya está registrado"
                });
            }
            throw error;
        }

        // Generar token para el usuario recién creado
        const { data: sessionData, error: sessionError } = await getSupabaseAdmin()
            .auth.admin.generateLink({
                type: "magiclink",
                email,
            });

        // Hacer login automático después del registro
        const { data: loginData, error: loginError } = await getSupabaseAdmin()
            .auth.signInWithPassword({
                email,
                password
            });

        if (loginError) {
            // Usuario creado pero no pudo hacer login automático
            return res.status(201).json({
                message: "Usuario registrado. Por favor inicia sesión.",
                data: {
                    user: {
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata?.name
                    }
                }
            });
        }

        return res.status(201).json({
            message: "Usuario registrado correctamente",
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name,
                    role: data.user.user_metadata?.role || "user"
                },
                session: {
                    access_token: loginData.session?.access_token,
                    refresh_token: loginData.session?.refresh_token,
                    expires_in: loginData.session?.expires_in,
                    expires_at: loginData.session?.expires_at
                }
            }
        });

    } catch (error) {
        console.error("Error en registro:", error);
        return res.status(500).json({
            error: "Error al registrar usuario"
        });
    }
};

// ==================== LOGIN ====================

/**
 * Iniciar sesión
 * POST /api/auth/login
 */
export const loginController = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email y contraseña son requeridos"
            });
        }

        const { data, error } = await getSupabaseAdmin().auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({
                error: "Credenciales inválidas"
            });
        }

        return res.status(200).json({
            message: "Login exitoso",
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name,
                    role: data.user.user_metadata?.role || "user"
                },
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_in: data.session.expires_in,
                    expires_at: data.session.expires_at
                }
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).json({
            error: "Error al iniciar sesión"
        });
    }
};

// ==================== LOGOUT ====================

/**
 * Cerrar sesión
 * POST /api/auth/logout
 */
export const logoutController = async (req: Request, res: Response) => {
    try {
        // El token viene en el header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(200).json({
                message: "Sesión cerrada"
            });
        }

        // Supabase invalida el token del lado del servidor
        const { error } = await getSupabaseAdmin().auth.signOut();

        if (error) {
            console.error("Error en logout:", error);
        }

        return res.status(200).json({
            message: "Sesión cerrada correctamente"
        });

    } catch (error) {
        console.error("Error en logout:", error);
        return res.status(200).json({
            message: "Sesión cerrada"
        });
    }
};

// ==================== PERFIL ====================

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/me
 */
export const getMeController = async (req: Request, res: Response) => {
    try {
        // El middleware de auth ya validó el token y puso el usuario en req.user
        if (!req.user) {
            return res.status(401).json({
                error: "No autenticado"
            });
        }

        // Obtener datos completos del usuario
        const { data, error } = await getSupabaseAdmin()
            .auth.admin.getUserById(req.user.id);

        if (error || !data.user) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }

        return res.status(200).json({
            message: "Perfil obtenido",
            data: {
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name,
                role: data.user.user_metadata?.role || "user",
                created_at: data.user.created_at,
                last_sign_in_at: data.user.last_sign_in_at
            }
        });

    } catch (error) {
        console.error("Error obteniendo perfil:", error);
        return res.status(500).json({
            error: "Error al obtener perfil"
        });
    }
};

// ==================== REFRESH TOKEN ====================

/**
 * Refrescar token de acceso
 * POST /api/auth/refresh
 */
export const refreshTokenController = async (req: Request, res: Response) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({
                error: "Refresh token es requerido"
            });
        }

        const { data, error } = await getSupabaseAdmin().auth.refreshSession({
            refresh_token
        });

        if (error || !data.session) {
            return res.status(401).json({
                error: "Token inválido o expirado"
            });
        }

        return res.status(200).json({
            message: "Token refrescado",
            data: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in,
                expires_at: data.session.expires_at
            }
        });

    } catch (error) {
        console.error("Error refrescando token:", error);
        return res.status(500).json({
            error: "Error al refrescar token"
        });
    }
};

// ==================== CAMBIAR CONTRASEÑA ====================

/**
 * Cambiar contraseña del usuario autenticado
 * POST /api/auth/change-password
 */
export const changePasswordController = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: "No autenticado"
            });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: "Contraseña actual y nueva son requeridas"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: "La nueva contraseña debe tener al menos 6 caracteres"
            });
        }

        // Verificar contraseña actual haciendo login
        const { data: userData } = await getSupabaseAdmin()
            .auth.admin.getUserById(req.user.id);

        if (!userData.user?.email) {
            return res.status(400).json({
                error: "No se pudo verificar el usuario"
            });
        }

        const { error: verifyError } = await getSupabaseAdmin()
            .auth.signInWithPassword({
                email: userData.user.email,
                password: currentPassword
            });

        if (verifyError) {
            return res.status(401).json({
                error: "Contraseña actual incorrecta"
            });
        }

        // Actualizar contraseña
        const { error: updateError } = await getSupabaseAdmin()
            .auth.admin.updateUserById(req.user.id, {
                password: newPassword
            });

        if (updateError) {
            throw updateError;
        }

        return res.status(200).json({
            message: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        console.error("Error cambiando contraseña:", error);
        return res.status(500).json({
            error: "Error al cambiar contraseña"
        });
    }
};
