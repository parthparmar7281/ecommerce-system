import { supabase } from "../lib/supabase-client";
import type { Cart } from "../types/cart";

export const addToCart = async (
    productId: number,
    quantity: number = 1
) => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not logged in");
    }

    // Check if product already exists in cart
    const { data: existingItem, error: fetchError } = await supabase
        .from("cart")
        .select("*")
        .eq("buyer_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingItem) {
        // Increase quantity
        const { data, error } = await supabase
            .from("cart")
            .update({
                quantity: existingItem.quantity + quantity,
            })
            .eq("id", existingItem.id)
            .select()
            .single();

        return { data, error };
    }

    // Insert new cart item
    const { data, error } = await supabase
        .from("cart")
        .insert({
            buyer_id: user.id,
            product_id: productId,
            quantity,
        })
        .select()
        .single();

    return { data, error };
};


export const getCart = async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not logged in");
    }

    const { data, error } = await supabase
        .from("cart")
        .select(
            `
            id,
            buyer_id,
            product_id,
            quantity,
            created_at,
            discount_price,
            offer_duration_hours,
            offer_activated_at,
            products (
                id,
                name,
                description,
                price,
                offer_price,
                image_url,
                created_by

            )
            `
        )
        .eq("buyer_id", user.id);

    const formattedData = data
        ? data.map((item: any) => ({
            ...item,
            products: Array.isArray(item.products)
                ? item.products[0]
                : item.products,
        }))
        : [];

    return { data: formattedData as Cart[], error };
};


export const updateCartQuantity = async (
    cartId: number,
    quantity: number
) => {
    const { data, error } = await supabase
        .from("cart")
        .update({
            quantity,
        })
        .eq("id", cartId)
        .select(
            `
            id,
            buyer_id,
            product_id,
            quantity,
            created_at,
            discount_price,
            offer_duration_hours,
            offer_activated_at,
            products (
                id,
                name,
                description,
                price,
                offer_price,
                image_url
                            )
            `
        )
        .single();

    const formattedData = data
        ? {
            ...data,
            products: Array.isArray(data.products)
                ? data.products[0]
                : data.products,
        }
        : null;

    return { data: formattedData as Cart | null, error };
};

export const removeCartItem = async (cartId: number) => {
    const { error } = await supabase
        .from("cart")
        .delete()
        .eq("id", cartId);

    return { error };
};


export const clearCart = async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not logged in");
    }

    const { error } = await supabase
        .from("cart")
        .delete()
        .eq("buyer_id", user.id);

    return { error };
};

export interface SellerCartItem {
    id: number;
    buyer_id: string;
    product_id: number;
    quantity: number;
    created_at: string;
    discount_price?: number | null;
    offer_duration_hours?: number | null;
    offer_activated_at?: string | null;
    product: {
        id: number;
        name: string;
        price?: number;
        description?: string;
        offer_price?: number;
    } | null;
    buyer: {
        id: string;
        name: string;
        email: string;
        phone?: string;
        city?: string;
    } | null;
}

export const getSellerCart = async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: "User not logged in" };
    }

    const { data, error } = await supabase
        .from("cart")
        .select(`
            id,
            quantity,
            created_at,
            discount_price,
            offer_duration_hours,
            offer_activated_at,
            buyer:users!cart_buyer_id_fkey1 (
                id,
                name,
                email,phone
            ),
            product:products!cart_product_id_fkey!inner (
                id,
                name,
                price,
                offer_price,
                created_by
            )
        `)
        .eq("product.created_by", user.id);

    return { data, error };
};

export const applyCartDiscount = async (
    cartId: number,
    discountPrice: number | null,
    offerDurationHours?: number | null
) => {
    return await supabase
        .from("cart")
        .update({
            discount_price: discountPrice,
            offer_duration_hours: offerDurationHours !== undefined ? offerDurationHours : null,
            offer_activated_at: null,
        })
        .eq("id", cartId)
        .select()
        .single();
};

export const activateCartOffer = async (cartId: number) => {
    return await supabase
        .from("cart")
        .update({
            offer_activated_at: new Date().toISOString(),
        })
        .eq("id", cartId)
        .select()
        .single();
};