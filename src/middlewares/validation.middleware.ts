import type { Request, Response, NextFunction } from "express";

/**
 * SEGURIDAD: Validación y sanitización de inputs
 * 
 * Protección contra:
 * - SQL Injection: Supabase ya usa prepared statements, pero validamos UUIDs
 * - XSS: Sanitizamos strings
 * - Datos malformados: Validamos tipos y formatos
 */

// Expresión regular para validar UUID v4
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Expresión regular para validar email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida que un string sea un UUID válido
 * Previene inyección de SQL a través de IDs maliciosos
 */
export const isValidUUID = (id: string): boolean => {
    if (typeof id !== "string") return false;
    return UUID_REGEX.test(id);
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
    if (typeof email !== "string") return false;
    return EMAIL_REGEX.test(email);
};

/**
 * Sanitiza un string removiendo caracteres peligrosos
 * Previene XSS y algunos tipos de inyección
 */
export const sanitizeString = (str: string): string => {
    if (typeof str !== "string") return "";
    return str
        .trim()
        .replace(/[<>]/g, "")  // Remueve < > para prevenir HTML/XSS básico
        .substring(0, 1000);    // Limita longitud
};

/**
 * Middleware para validar que el ID en params sea un UUID válido
 */
export const validateUUIDParam = (paramName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const id = req.params[paramName];

        if (!id || typeof id !== "string" || !isValidUUID(id)) {
            return res.status(400).json({
                error: "Parámetro inválido",
                message: `El parámetro ${paramName} debe ser un UUID válido`,
            });
        }

        next();
    };
};

/**
 * Middleware para validar datos de checkout/orden
 */
export const validateCheckoutData = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { shippingAddressId, paymentMethod } = req.body;

    const errors: string[] = [];

    // Validar shippingAddressId
    if (!shippingAddressId) {
        errors.push("La dirección de envío es requerida");
    } else if (!isValidUUID(shippingAddressId)) {
        errors.push("La dirección de envío no es válida");
    }

    // Validar paymentMethod
    const validPaymentMethods = ["card", "stripe"];
    if (!paymentMethod) {
        errors.push("El método de pago es requerido");
    } else if (!validPaymentMethods.includes(paymentMethod)) {
        errors.push("Método de pago no válido");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Datos inválidos",
            messages: errors,
        });
    }

    next();
};

/**
 * Middleware para validar datos de producto
 */
export const validateProductData = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { name, price, stock, description, category } = req.body;

    const errors: string[] = [];

    // Validar name
    if (!name || typeof name !== "string" || name.trim().length < 2) {
        errors.push("El nombre debe tener al menos 2 caracteres");
    }

    // Validar price
    if (price === undefined || typeof price !== "number" || price < 0) {
        errors.push("El precio debe ser un número positivo");
    }

    // Validar stock
    if (stock !== undefined && (typeof stock !== "number" || stock < 0 || !Number.isInteger(stock))) {
        errors.push("El stock debe ser un número entero positivo");
    }

    // Sanitizar strings
    if (name) req.body.name = sanitizeString(name);
    if (description) req.body.description = sanitizeString(description);
    if (category) req.body.category = sanitizeString(category);

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Datos inválidos",
            messages: errors,
        });
    }

    next();
};

/**
 * Middleware para validar cantidad en carrito
 */
export const validateCartItemData = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { productId, quantity } = req.body;

    const errors: string[] = [];

    // Validar productId
    if (!productId) {
        errors.push("El ID del producto es requerido");
    } else if (!isValidUUID(productId)) {
        errors.push("El ID del producto no es válido");
    }

    // Validar quantity
    if (quantity === undefined) {
        errors.push("La cantidad es requerida");
    } else if (typeof quantity !== "number" || quantity < 1 || !Number.isInteger(quantity)) {
        errors.push("La cantidad debe ser un número entero mayor a 0");
    } else if (quantity > 100) {
        errors.push("La cantidad máxima por producto es 100");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Datos inválidos",
            messages: errors,
        });
    }

    next();
};

/**
 * Middleware para validar datos de dirección
 */
export const validateAddressData = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { addressLine1, city, state, postalCode, country, phone } = req.body;

    const errors: string[] = [];

    if (!addressLine1 || addressLine1.trim().length < 5) {
        errors.push("La dirección debe tener al menos 5 caracteres");
    }
    if (!city || city.trim().length < 2) {
        errors.push("La ciudad es requerida");
    }
    if (!state || state.trim().length < 2) {
        errors.push("El estado/provincia es requerido");
    }
    if (!postalCode || postalCode.trim().length < 3) {
        errors.push("El código postal es requerido");
    }
    if (!country || country.trim().length < 2) {
        errors.push("El país es requerido");
    }
    if (!phone || phone.trim().length < 8) {
        errors.push("El teléfono debe tener al menos 8 caracteres");
    }

    // Sanitizar todos los strings
    if (addressLine1) req.body.addressLine1 = sanitizeString(addressLine1);
    if (req.body.addressLine2) req.body.addressLine2 = sanitizeString(req.body.addressLine2);
    if (city) req.body.city = sanitizeString(city);
    if (state) req.body.state = sanitizeString(state);
    if (postalCode) req.body.postalCode = sanitizeString(postalCode);
    if (country) req.body.country = sanitizeString(country);
    if (phone) req.body.phone = sanitizeString(phone);

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Datos inválidos",
            messages: errors,
        });
    }

    next();
};

/**
 * Middleware genérico para validar que el body no esté vacío
 */
export const validateBodyNotEmpty = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: "Datos requeridos",
            message: "El cuerpo de la petición no puede estar vacío",
        });
    }

    next();
};
