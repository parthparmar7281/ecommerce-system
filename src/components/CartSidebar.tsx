import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import type { Cart as CartType } from "../types/cart";
import "./CartSidebar.css";

const CartSidebarItem: React.FC<{ item: CartType }> = ({ item }) => {
    const { updateQuantity, removeItem } = useCart();
    const product = item.products;

    const durationHours = item.offer_duration_hours;
    const activatedAt = item.offer_activated_at;

    const offerExpiresAt = activatedAt && durationHours
        ? new Date(new Date(activatedAt).getTime() + durationHours * 60 * 60 * 1000)
        : null;

    const [isExpired, setIsExpired] = useState<boolean>(
        offerExpiresAt ? offerExpiresAt.getTime() < Date.now() : false
    );
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        if (!offerExpiresAt) {
            setIsExpired(false);
            setTimeLeft("");
            return;
        }

        const checkExpiration = () => {
            const now = Date.now();
            const diff = offerExpiresAt.getTime() - now;
            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft("Expired");
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60 * 60)) / 1000) % 60;

            const hStr = hours > 0 ? `${hours}h ` : "";
            const mStr = minutes > 0 || hours > 0 ? `${minutes}m ` : "";
            const sStr = `${seconds}s`;

            setTimeLeft(`${hStr}${mStr}${sStr} left`);
            setIsExpired(false);
        };

        checkExpiration();
        const interval = setInterval(checkExpiration, 1000);
        return () => clearInterval(interval);
    }, [item.offer_activated_at, item.offer_duration_hours]);

    const originalPrice = Number(product?.price || 0);
    const globalDiscount = product?.offer_price ? Number(product.offer_price) : null;
    const buyerDiscount = !isExpired && item.discount_price ? Number(item.discount_price) : null;

    let activePrice = originalPrice;
    let hasDiscount = false;

    if (globalDiscount !== null && globalDiscount < activePrice) {
        activePrice = globalDiscount;
        hasDiscount = true;
    }
    if (buyerDiscount !== null && buyerDiscount < activePrice) {
        activePrice = buyerDiscount;
        hasDiscount = true;
    }

    return (
        <div className="sidebar-cart-item">
            <div className="sidebar-item-img-container">
                {product?.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="sidebar-item-img"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                )}
            </div>

            <div className="sidebar-item-details">
                <h5 className="sidebar-item-name">{product?.name || "Product"}</h5>

                <div className="sidebar-item-price-box">
                    <span className="sidebar-item-active-price">₹{(activePrice * item.quantity).toFixed(2)}</span>
                    {hasDiscount && (
                        <span className="sidebar-item-original-price">₹{(originalPrice * item.quantity).toFixed(2)}</span>
                    )}
                    {buyerDiscount !== null && (
                        <span className="sidebar-item-tag special">Direct Offer</span>
                    )}
                    {buyerDiscount === null && globalDiscount !== null && (
                        <span className="sidebar-item-tag">Sale</span>
                    )}
                </div>

                {buyerDiscount !== null && timeLeft && timeLeft !== "Expired" && (
                    <div className={`sidebar-item-expiry ${!timeLeft.includes("h ") ? "urgent" : ""}`}>
                        ⏳ {timeLeft}
                    </div>
                )}

                <div className="sidebar-item-bottom-row">
                    <div className="sidebar-qty-controls">
                        <button
                            className="sidebar-qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                        >
                            -
                        </button>
                        <span className="sidebar-qty-num">{item.quantity}</span>
                        <button
                            className="sidebar-qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                        >
                            +
                        </button>
                    </div>

                    <button
                        className="sidebar-remove-btn"
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

const CartSidebar: React.FC = () => {
    const { cart, isCartOpen, closeCart, totalCount, subtotal } = useCart();
    const navigate = useNavigate();


    const handleViewCart = () => {
        closeCart();
        navigate("/cart");
    };

    const handleCheckout = () => {
        closeCart();
        navigate("/checkout");
    };

    return (
        <>
            <div
                className={`cart-sidebar-backdrop ${isCartOpen ? "open" : ""}`}
                onClick={closeCart}
            />

            <aside className={`cart-sidebar-drawer ${isCartOpen ? "open" : ""}`} aria-label="Shopping Cart Drawer">
                <div className="cart-sidebar-header">
                    <div className="cart-sidebar-added-banner">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Added to Cart</span>
                    </div>

                    <div className="cart-sidebar-top-row">
                        <div className="cart-sidebar-title-group">
                            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                            </svg>
                            <h3 className="cart-sidebar-title">Shopping Cart</h3>
                            <span className="cart-sidebar-item-badge">{totalCount}</span>
                        </div>

                        <button
                            className="cart-sidebar-close-btn"
                            onClick={closeCart}
                            aria-label="Close cart sidebar"
                        >
                            &times;
                        </button>
                    </div>

                </div>

                <div className="cart-sidebar-body">
                    {cart.length === 0 ? (
                        <div className="cart-sidebar-empty">
                            <div className="cart-sidebar-empty-icon">
                                <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                            </div>
                            <h4>Your Cart is Empty</h4>
                            <p>Discover products and add them to your cart to see them here.</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <CartSidebarItem key={item.id} item={item} />
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-sidebar-footer">
                        <div className="cart-sidebar-summary-row">
                            <span className="cart-sidebar-summary-label">Subtotal ({totalCount} {totalCount === 1 ? 'item' : 'items'}):</span>
                            <span className="cart-sidebar-summary-subtotal">₹{subtotal.toFixed(2)}</span>
                        </div>

                        <button className="btn-amazon-checkout" onClick={handleCheckout}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25V10.5a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 10.5v8.25a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                            Proceed to Checkout
                        </button>

                        <button className="btn-amazon-view-cart" onClick={handleViewCart}>
                            View Cart Page
                        </button>

                        <div className="cart-sidebar-security-badge">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0112 2.714z" />
                            </svg>
                            <span>100% Safe & Secure Transaction</span>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default CartSidebar;
