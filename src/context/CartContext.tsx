import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Cart } from "../types/cart";
import {
    getCart,
    addToCart as apiAddToCart,
    updateCartQuantity as apiUpdateCartQuantity,
    removeCartItem as apiRemoveCartItem,
    clearCart as apiClearCart,
    activateCartOffer
} from "../services/cartService";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";

interface CartContextType {
    cart: Cart[];
    loading: boolean;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
    loadCart: () => Promise<void>;
    addToCart: (productId: number, quantity?: number) => Promise<boolean>;
    updateQuantity: (cartId: number, quantity: number) => Promise<void>;
    removeItem: (cartId: number) => Promise<void>;
    clearAllCart: () => Promise<void>;
    totalCount: number;
    subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [cart, setCart] = useState<Cart[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

    const isBuyer = user?.role === "Buyer";

    const loadCart = useCallback(async () => {
        if (!user || user.role !== "Buyer") {
            setCart([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await getCart();
            if (error) {
                console.error("Failed to fetch cart:", error);
                return;
            }

            const cartItems = data || [];
            // Automatically activate any pending seller offers when loading cart
            const updatedItems = await Promise.all(
                cartItems.map(async (item) => {
                    if (item.discount_price && item.offer_duration_hours && !item.offer_activated_at) {
                        try {
                            const { data: activatedItem } = await activateCartOffer(item.id);
                            if (activatedItem) {
                                return {
                                    ...item,
                                    offer_activated_at: activatedItem.offer_activated_at,
                                };
                            }
                        } catch (err) {
                            console.error("Failed to activate offer", err);
                        }
                    }
                    return item;
                })
            );

            setCart(updatedItems);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (isBuyer) {
            loadCart();
        } else {
            setCart([]);
        }
    }, [isBuyer, loadCart]);

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);
    const toggleCart = () => setIsCartOpen((prev) => !prev);

    const addToCartHandler = async (productId: number, quantity: number = 1): Promise<boolean> => {
        if (!user) {
            toast.error("Please login to add items to cart");
            return false;
        }

        const { error } = await apiAddToCart(productId, quantity);

        if (error) {
            toast.error(error.message || "Failed to add product to cart");
            return false;
        }

        toast.success("Product added to cart!");
        await loadCart();
        setIsCartOpen(true);
        return true;
    };

    const updateQuantityHandler = async (cartId: number, quantity: number) => {
        if (quantity < 1) return;

        const { data, error } = await apiUpdateCartQuantity(cartId, quantity);

        if (error) {
            toast.error(error.message || "Failed to update quantity");
            return;
        }

        setCart((prev) => prev.map((c) => (c.id === cartId && data ? (data as Cart) : c)));
    };

    const removeItemHandler = async (cartId: number) => {
        const { error } = await apiRemoveCartItem(cartId);

        if (error) {
            toast.error(error.message || "Failed to remove item");
            return;
        }

        toast.success("Item removed from cart");
        setCart((prev) => prev.filter((c) => c.id !== cartId));
    };

    const clearAllCartHandler = async () => {
        const { error } = await apiClearCart();

        if (error) {
            toast.error(error.message || "Failed to clear cart");
            return;
        }

        toast.success("Cart cleared");
        setCart([]);
    };

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const subtotal = cart.reduce((sum, item) => {
        const originalPrice = Number(item.products?.price || 0);
        const globalDiscount = item.products?.offer_price ? Number(item.products.offer_price) : null;

        const durationHours = item.offer_duration_hours;
        const activatedAt = item.offer_activated_at;
        const offerExpiresAt = activatedAt && durationHours
            ? new Date(new Date(activatedAt).getTime() + durationHours * 60 * 60 * 1000)
            : null;
        const isOfferExpired = offerExpiresAt ? offerExpiresAt.getTime() < Date.now() : false;

        const buyerDiscount = !isOfferExpired && item.discount_price ? Number(item.discount_price) : null;

        let activePrice = originalPrice;
        if (globalDiscount !== null && globalDiscount < activePrice) {
            activePrice = globalDiscount;
        }
        if (buyerDiscount !== null && buyerDiscount < activePrice) {
            activePrice = buyerDiscount;
        }

        return sum + (activePrice * item.quantity);
    }, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                loading,
                isCartOpen,
                openCart,
                closeCart,
                toggleCart,
                loadCart,
                addToCart: addToCartHandler,
                updateQuantity: updateQuantityHandler,
                removeItem: removeItemHandler,
                clearAllCart: clearAllCartHandler,
                totalCount,
                subtotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
