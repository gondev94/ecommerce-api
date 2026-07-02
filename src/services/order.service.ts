import type { Order, OrderItem } from "../interfaces/order.js";
import type { TablesInsert, TablesUpdate } from "../types/database.types.js";
import { getSupabaseAdmin } from "./supabase.service.js";
import { getCartByUserId, clearCart } from "./cart.service.js";
import { checkStock, decreaseStock, restoreStock } from "./product.service.js";


// Crear una orden nueva
// Recibe: userId (quién compra), montos, dirección de envío y método de pago
export const createOrder = async (orderData: {
    userId: string;
    subtotal: number;
    shippingCost?: number;
    discount?: number;
    total: number;
    shippingAddressId?: string;
    paymentMethod?: string;
}) => {
    const insertData: TablesInsert<"orders"> = {
        user_id: orderData.userId,
        subtotal: orderData.subtotal,
        shipping_cost: orderData.shippingCost || 0,
        discount: orderData.discount || 0,
        total: orderData.total,
        status: "pending",
        payment_status: "pending",
        ...(orderData.shippingAddressId && { shipping_address_id: orderData.shippingAddressId }),
        ...(orderData.paymentMethod && { payment_method: orderData.paymentMethod }),
    };
    const { data, error } = await getSupabaseAdmin()
        .from("orders")
        .insert(insertData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Obtener una orden por ID
// Incluye los items de la orden y los datos del producto
export const getOrderById = async (orderId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("orders")
        .select("*, order_items(*, products(*))")  // Trae items + info del producto
        .eq("id", orderId)
        .single();
    if (error) throw error;
    return data;
};

// Obtener todas las órdenes de un usuario (historial de compras)
// Ordenadas por fecha, más recientes primero
export const getOrdersByUserId = async (userId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
};

// Actualizar datos generales de una orden
export const updateOrder = async (orderId: string, orderData: {
    subtotal?: number;
    shippingCost?: number;
    discount?: number;
    total?: number;
    trackingNumber?: string | null;
}) => {
    const updateData: TablesUpdate<"orders"> = {
        updated_at: new Date().toISOString(),
        ...(orderData.subtotal !== undefined && { subtotal: orderData.subtotal }),
        ...(orderData.shippingCost !== undefined && { shipping_cost: orderData.shippingCost }),
        ...(orderData.discount !== undefined && { discount: orderData.discount }),
        ...(orderData.total !== undefined && { total: orderData.total }),
        ...(orderData.trackingNumber !== undefined && { tracking_number: orderData.trackingNumber }),
    };
    const { data, error } = await getSupabaseAdmin()
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Actualizar estado del pedido (pending → confirmed → shipped → delivered)
export const updateOrderStatus = async (
    orderId: string,
    status: Order["status"]
) => {
    const updateData: TablesUpdate<"orders"> = { 
        status, 
        updated_at: new Date().toISOString() 
    };
    const { data, error } = await getSupabaseAdmin()
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// Actualizar estado del pago (cuando Stripe confirma el pago)
export const updatePaymentStatus = async (
    orderId: string,
    paymentStatus: Order["paymentStatus"],
    paymentId?: string
) => {
    const updateData: TablesUpdate<"orders"> = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
        ...(paymentId && { payment_id: paymentId }),
    };
    const { data, error } = await getSupabaseAdmin()
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const deleteOrder = async (orderId: string) => {
    const { data, error } = await getSupabaseAdmin()
        .from("orders")
        .delete()
        .eq("id", orderId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ==================== ORDER ITEMS ====================

// Agregar un item a una orden
// Guarda el nombre y precio del producto en ese momento (snapshot)
// Así si el producto cambia de precio después, el historial se mantiene correcto
export const addOrderItem = async (itemData: {
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
}) => {
    const insertData: TablesInsert<"order_items"> = {
        order_id: itemData.orderId,
        product_id: itemData.productId,
        product_name: itemData.productName,
        quantity: itemData.quantity,
        unit_price: itemData.unitPrice,
        total: itemData.quantity * itemData.unitPrice,
    };
    const { data, error } = await getSupabaseAdmin()
        .from("order_items")
        .insert(insertData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// ==================== CHECKOUT ====================

/**
 * Función principal: Convierte el carrito en una orden
 * 
 * SEGURIDAD:
 * - Verifica stock disponible ANTES de crear la orden
 * - Descuenta stock al crear la orden
 * - Si algo falla, restaura el stock
 */
export const createOrderFromCart = async (
    userId: string,
    shippingAddressId: string,
    paymentMethod: string
) => {
    // 1. Obtener el carrito del usuario con sus items
    const cart = await getCartByUserId(userId);

    if (!cart.cart_items || cart.cart_items.length === 0) {
        throw new Error("El carrito está vacío");
    }

    // 2. SEGURIDAD: Verificar stock disponible para TODOS los items
    const stockErrors: string[] = [];
    for (const item of cart.cart_items) {
        const hasStock = await checkStock(item.product_id, item.quantity);
        if (!hasStock) {
            stockErrors.push(`Stock insuficiente para "${item.products.name}"`);
        }
    }

    if (stockErrors.length > 0) {
        throw new Error(`No se puede completar la orden: ${stockErrors.join(", ")}`);
    }

    // 3. Calcular montos
    const subtotal = cart.total;
    const shippingCost = 0;
    const discount = 0;
    const total = subtotal + shippingCost - discount;

    // 4. Crear la orden en estado "pending"
    const order = await createOrder({
        userId,
        subtotal,
        shippingCost,
        discount,
        total,
        shippingAddressId,
        paymentMethod,
    });

    // 5. Descontar stock y crear order items
    // Si algo falla, intentamos restaurar el stock
    const processedItems: { productId: string; quantity: number }[] = [];
    
    try {
        for (const item of cart.cart_items) {
            // Descontar stock
            await decreaseStock(item.product_id, item.quantity);
            processedItems.push({ 
                productId: item.product_id, 
                quantity: item.quantity 
            });

            // Crear order item
            await addOrderItem({
                orderId: order.id,
                productId: item.product_id,
                productName: item.products.name,
                quantity: item.quantity,
                unitPrice: item.products.price,
            });
        }
    } catch (error) {
        // Si algo falla, restaurar el stock de los items ya procesados
        console.error("Error en checkout, restaurando stock:", error);
        for (const processed of processedItems) {
            try {
                await restoreStock(processed.productId, processed.quantity);
            } catch (restoreError) {
                console.error("Error restaurando stock:", restoreError);
            }
        }
        throw error;
    }

    // 6. Vaciar el carrito
    await clearCart(cart.id);

    // 7. Retornar la orden creada
    return order;
};

/**
 * Cancelar una orden y restaurar el stock
 */
export const cancelOrder = async (orderId: string) => {
    // Obtener la orden con sus items
    const order = await getOrderById(orderId);
    
    if (!order) {
        throw new Error("Orden no encontrada");
    }

    if (order.status === "delivered") {
        throw new Error("No se puede cancelar una orden ya entregada");
    }

    if (order.status === "cancelled") {
        throw new Error("La orden ya está cancelada");
    }

    // Restaurar stock de cada item
    if (order.order_items) {
        for (const item of order.order_items) {
            if (item.product_id) {
                await restoreStock(item.product_id, item.quantity);
            }
        }
    }

    // Actualizar estado de la orden
    return updateOrderStatus(orderId, "cancelled");
};