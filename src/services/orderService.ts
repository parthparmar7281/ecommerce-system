import { supabase } from "../lib/supabase-client";
import type { Cart } from "../types/cart";
import type { Order, OrderStatus, PaymentMethod } from "../types/order";

export interface ShippingDetails {
    name: string;
    phone: string;
    address: string;
    city: string;
}

export const getEffectivePrice = (item: Cart): number => {
    const originalPrice = Number(item.products?.price || 0);
    const globalDiscount = item.products?.offer_price ? Number(item.products.offer_price) : null;

    const durationHours = item.offer_duration_hours;
    const activatedAt = item.offer_activated_at;
    const offerExpiresAt = activatedAt && durationHours
        ? new Date(new Date(activatedAt).getTime() + durationHours * 60 * 60 * 1000)
        : null;
    const isOfferExpired = offerExpiresAt ? offerExpiresAt.getTime() < Date.now() : false;
    const buyerDiscount = !isOfferExpired && item.discount_price ? Number(item.discount_price) : null;

    let unitPrice = originalPrice;
    if (globalDiscount !== null && globalDiscount < unitPrice) {
        unitPrice = globalDiscount;
    }
    if (buyerDiscount !== null && buyerDiscount < unitPrice) {
        unitPrice = buyerDiscount;
    }

    return unitPrice;
};

export const placeOrder = async ({
    shippingDetails,
    paymentMethod,
    cartItems,
}: {
    shippingDetails: ShippingDetails;
    paymentMethod: PaymentMethod;
    cartItems: Cart[];
}) => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    if (!cartItems || cartItems.length === 0) {
        throw new Error("Cart is empty");
    }

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => {
        return sum + getEffectivePrice(item) * item.quantity;
    }, 0);

    // 1. Insert order record
    const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
            buyer_id: user.id,
            total_amount: totalAmount,
            status: "pending",
            payment_status: paymentMethod === "cod" ? "pending" : "paid",
            payment_method: paymentMethod,
            shipping_name: shippingDetails.name,
            shipping_phone: shippingDetails.phone,
            shipping_address: shippingDetails.address,
            shipping_city: shippingDetails.city,
        })
        .select()
        .single();

    if (orderError) throw orderError;

    // 2. Insert order items
    const orderItemsToInsert = cartItems.map((item) => {
        const effectivePrice = getEffectivePrice(item);
        return {
            order_id: orderData.id,
            product_id: item.products?.id || item.product_id,
            buyer_id: user.id,
            seller_id: item.products?.created_by || null,
            product_name: item.products?.name || "Product",
            unit_price: effectivePrice,
            quantity: item.quantity,
            subtotal: effectivePrice * item.quantity,
        };
    });

    const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsToInsert);

    if (itemsError) throw itemsError;

    // 3. Clear buyer's cart
    await supabase.from("cart").delete().eq("buyer_id", user.id);

    return { order: orderData as Order };
};

// Fetch orders for current Buyer
export const getBuyerOrders = async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not logged in");
    }

    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (
                id,
                order_id,
                product_id,
                seller_id,
                product_name,
                unit_price,
                quantity,
                subtotal,
                product:products!product_id (
                    image_url
                )
            )
        `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

    return { data: data as Order[] | null, error };
};

// Fetch orders for current Seller
export const getSellerOrderItems = async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not logged in");
    }

    const { data, error } = await supabase
        .from("order_items")
        .select(`
            id,
            order_id,
            product_id,
            seller_id,
            product_name,
            unit_price,
            quantity,
            subtotal,
            created_at,
            order:orders!order_id (
                id,
                buyer_id,
                status,
                payment_status,
                payment_method,
                shipping_name,
                shipping_phone,
                shipping_address,
                shipping_city,
                created_at,
                buyer:users!buyer_id (
                    name,
                    email
                )
            ),
            product:products!product_id (
                image_url
            )
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

    return { data, error };
};

// Update order status (for seller/admin)
export const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)
        .select()
        .single();

    return { data, error };
};
