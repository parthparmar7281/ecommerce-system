import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Cart as CartType } from "../types/cart";
import { getSellerCart, type SellerCartItem, applyCartDiscount } from "../services/cartService";
import CartItem from "../components/CartItem";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { toast } from "react-hot-toast";
import "./cart.css";

const Cart = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        cart,
        loading: cartLoading,
        updateQuantity: handleUpdateQuantity,
        removeItem: handleRemove,
        clearAllCart: handleClearCart,
        subtotal: total
    } = useCart();

    const [sellerCart, setSellerCart] = useState<SellerCartItem[]>([]);
    const [sellerLoading, setSellerLoading] = useState(false);
    const [selectedBuyerCart, setSelectedBuyerCart] = useState<{ buyer: any; items: SellerCartItem[] } | null>(null);
    const [discountValues, setDiscountValues] = useState<Record<number, string>>({});
    const [expirySelections, setExpirySelections] = useState<Record<number, string>>({});

    const handleApplyDiscount = async (cartId: number, originalPrice: number) => {
        const discountStr = discountValues[cartId];
        if (!discountStr) return;

        const discountPrice = Number(discountStr);
        if (Number.isNaN(discountPrice) || discountPrice <= 0 || discountPrice >= originalPrice) {
            toast.error(`Please enter a valid discount price (greater than 0 and less than original price of ₹${originalPrice})`);
            return;
        }

        const duration = expirySelections[cartId] || "";
        let durationHours: number | null = null;
        if (duration && duration !== "none") {
            durationHours = Number(duration);
        }

        const { error } = await applyCartDiscount(cartId, discountPrice, durationHours);
        if (error) {
            toast.error("Error applying discount: " + error.message);
            return;
        }

        toast.success("Discount offer applied successfully!");

        // Update local states
        setSellerCart((prev) =>
            prev.map((item) => (item.id === cartId ? { ...item, discount_price: discountPrice, offer_duration_hours: durationHours, offer_activated_at: null } : item))
        );

        setSelectedBuyerCart((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                items: prev.items.map((item) => (item.id === cartId ? { ...item, discount_price: discountPrice, offer_duration_hours: durationHours, offer_activated_at: null } : item))
            };
        });
    };

    const handleRemoveDiscount = async (cartId: number) => {
        const { error } = await applyCartDiscount(cartId, null, null);
        if (error) {
            toast.error("Error removing discount: " + error.message);
            return;
        }

        toast.success("Discount offer removed!");

        setSellerCart((prev) =>
            prev.map((item) => (item.id === cartId ? { ...item, discount_price: null, offer_duration_hours: null, offer_activated_at: null } : item))
        );

        setSelectedBuyerCart((prev) => {
            if (!prev) return null;
            return {
                ...prev,
                items: prev.items.map((item) => (item.id === cartId ? { ...item, discount_price: null, offer_duration_hours: null, offer_activated_at: null } : item))
            };
        });

        setDiscountValues((prev) => {
            const copy = { ...prev };
            delete copy[cartId];
            return copy;
        });

        setExpirySelections((prev) => {
            const copy = { ...prev };
            delete copy[cartId];
            return copy;
        });
    };
    const isSeller = user?.role === "Seller";

    useEffect(() => {
        if (isSeller) {
            loadSellerCart();
        }
    }, [isSeller]);

    const loadSellerCart = async () => {
        setSellerLoading(true);
        try {
            const { data, error } = await getSellerCart();
            if (error) {
                console.error(error);
                return;
            }
            setSellerCart(data || []);
        } finally {
            setSellerLoading(false);
        }
    };

    if (isSeller) {
        // Group items by buyer
        const buyerMap: Record<string, { buyer: any; items: SellerCartItem[] }> = {};

        sellerCart.forEach((item) => {
            const bId = item.buyer?.id;
            if (!bId) return;
            if (!buyerMap[bId]) {
                buyerMap[bId] = {
                    buyer: item.buyer,
                    items: [],
                };
            }
            buyerMap[bId].items.push(item);
        });

        const buyersList = Object.values(buyerMap);
        console.log("Buyers List:", buyersList);

        return (
            <>
                <div className="page-cart page-seller-cart">
                    <h1 className="seller-section-title">Interested Customers</h1>

                    {sellerLoading && <p>Loading...</p>}

                    {!sellerLoading && buyersList.length === 0 && (
                        <p className="empty-message">No customers have added your products to their carts yet.</p>
                    )}

                    {!sellerLoading && buyersList.length > 0 && (
                        <div className="seller-buyer-grid">
                            {buyersList.map(({ buyer, items }) => {
                                const buyerTotalQty = items.reduce((sum, item) => sum + item.quantity, 0);
                                const buyerTotalVal = items.reduce((sum, item) => {
                                    const originalPrice = Number(item.product?.price || 0);
                                    const globalDiscount = item.product?.offer_price ? Number(item.product.offer_price) : null;
                                    const durationHours = item.offer_duration_hours;
                                    const activatedAt = item.offer_activated_at;
                                    const offerExpiresAt = activatedAt && durationHours
                                        ? new Date(new Date(activatedAt).getTime() + durationHours * 60 * 60 * 1000)
                                        : null;
                                    const isExpired = offerExpiresAt ? offerExpiresAt.getTime() < Date.now() : false;
                                    const buyerDiscount = !isExpired && item.discount_price ? Number(item.discount_price) : null;

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
                                    <div key={buyer.id} className="seller-buyer-card">
                                        <div className="buyer-card-avatar">
                                            {buyer.name ? buyer.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2) : "U"}
                                        </div>
                                        <h3 className="buyer-card-name">{buyer.name}</h3>
                                        <p className="buyer-card-email">{buyer.email}</p>
                                        {buyer.phone && <p className="buyer-card-phone">📞 {buyer.phone}</p>}

                                        <div className="buyer-card-stats">
                                            <div className="buyer-card-stat">
                                                <span>Products</span>
                                                <strong>{items.length}</strong>
                                            </div>
                                            <div className="buyer-card-stat">
                                                <span>Total Qty</span>
                                                <strong>{buyerTotalQty}</strong>
                                            </div>
                                            <div className="buyer-card-stat">
                                                <span>Total Value</span>
                                                <strong>₹{buyerTotalVal.toFixed(2)}</strong>
                                            </div>
                                        </div>

                                        <button
                                            className="btn-view-products"
                                            onClick={() => setSelectedBuyerCart({ buyer, items })}
                                        >
                                            View Cart Activity
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedBuyerCart && (
                    <div className="modal-overlay" onClick={() => setSelectedBuyerCart(null)}>
                        <div className="modal-container seller-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="seller-modal-header">
                                <h3>Products Added by {selectedBuyerCart.buyer.name}</h3>
                                <button className="btn-close-modal" onClick={() => setSelectedBuyerCart(null)}>&times;</button>
                            </div>
                            <div className="seller-modal-body">
                                <div className="seller-modal-products">
                                    {selectedBuyerCart.items.map((item) => {
                                        const originalPrice = Number(item.product?.price || 0);
                                        const globalDiscount = item.product?.offer_price ? Number(item.product.offer_price) : null;

                                        const durationHours = item.offer_duration_hours;
                                        const activatedAt = item.offer_activated_at;
                                        const offerExpiresAt = activatedAt && durationHours
                                            ? new Date(new Date(activatedAt).getTime() + durationHours * 60 * 60 * 1000)
                                            : null;
                                        const isExpired = offerExpiresAt ? offerExpiresAt.getTime() < Date.now() : false;
                                        const buyerDiscount = !isExpired && item.discount_price ? Number(item.discount_price) : null;

                                        let activePrice = originalPrice;
                                        if (globalDiscount !== null && globalDiscount < activePrice) {
                                            activePrice = globalDiscount;
                                        }
                                        if (buyerDiscount !== null && buyerDiscount < activePrice) {
                                            activePrice = buyerDiscount;
                                        }

                                        return (
                                            <div key={item.id} className="modal-product-row seller-discount-row">
                                                <div className="modal-product-main">
                                                    <span className="modal-product-name">{item.product?.name}</span>
                                                    <span className="modal-product-price">
                                                        Original: ₹{originalPrice.toFixed(2)} &times; {item.quantity}
                                                    </span>
                                                    {item.discount_price !== null && (
                                                        <span className={`seller-discount-applied-badge ${isExpired ? 'expired' : ''}`}>
                                                            Direct Offer: ₹{Number(item.discount_price).toFixed(2)} {isExpired ? '(Expired)' : ''}
                                                        </span>
                                                    )}
                                                    {globalDiscount !== null && (
                                                        <span className="seller-global-offer-badge">
                                                            Global Offer: ₹{globalDiscount.toFixed(2)}
                                                        </span>
                                                    )}
                                                    {item.discount_price !== null && durationHours && (
                                                        activatedAt ? (
                                                            isExpired ? (
                                                                <span className="seller-expires-badge expired">
                                                                    ⏳ Expired
                                                                </span>
                                                            ) : (
                                                                <span className="seller-expires-badge active">
                                                                    ⏳ Active (Expires: {offerExpiresAt?.toLocaleString()})
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="seller-expires-badge pending">
                                                                ⏳ Pending activation (Starts when buyer logs in)
                                                            </span>
                                                        )
                                                    )}
                                                    {item.discount_price !== null && !durationHours && (
                                                        <span className="seller-expires-badge persistent">
                                                            Persistent (No Time Limit)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="modal-product-discount-actions">
                                                    <div className="discount-input-container">
                                                        <input
                                                            type="number"
                                                            placeholder="Offer price"
                                                            value={discountValues[item.id] || ""}
                                                            onChange={(e) => setDiscountValues({
                                                                ...discountValues,
                                                                [item.id]: e.target.value
                                                            })}
                                                            min={1}
                                                            max={originalPrice - 1}
                                                        />
                                                        <select
                                                            className="discount-expiry-select"
                                                            value={expirySelections[item.id] || "none"}
                                                            onChange={(e) => setExpirySelections({
                                                                ...expirySelections,
                                                                [item.id]: e.target.value
                                                            })}
                                                        >
                                                            <option value="none">No Time Limit</option>
                                                            <option value="0.0333">2 Minutes (Test)</option>
                                                            <option value="1">1 Hour</option>
                                                            <option value="3">3 Hours</option>
                                                            <option value="12">12 Hours</option>
                                                            <option value="24">24 Hours</option>
                                                        </select>
                                                        <button
                                                            className="btn-offer-discount"
                                                            onClick={() => handleApplyDiscount(item.id, originalPrice)}
                                                        >
                                                            Apply Offer
                                                        </button>
                                                        {buyerDiscount !== null && (
                                                            <button
                                                                className="btn-clear-discount"
                                                                onClick={() => handleRemoveDiscount(item.id)}
                                                                title="Clear discount"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="modal-product-subtotal">
                                                        Subtotal: <strong>₹{(activePrice * item.quantity).toFixed(2)}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="seller-modal-summary">
                                    <span>Total Value:</span>
                                    <strong>
                                        ₹{selectedBuyerCart.items.reduce((sum, item) => {
                                            const originalPrice = Number(item.product?.price || 0);
                                            const globalDiscount = item.product?.offer_price ? Number(item.product.offer_price) : null;

                                            const durationHours = item.offer_duration_hours;
                                            const activatedAt = item.offer_activated_at;
                                            const offerExpiresAt = activatedAt && durationHours
                                                ? new Date(new Date(activatedAt).getTime() + durationHours * 60 * 60 * 1000)
                                                : null;
                                            const isExpired = offerExpiresAt ? offerExpiresAt.getTime() < Date.now() : false;
                                            const buyerDiscount = !isExpired && item.discount_price ? Number(item.discount_price) : null;

                                            let activePrice = originalPrice;
                                            if (globalDiscount !== null && globalDiscount < activePrice) {
                                                activePrice = globalDiscount;
                                            }
                                            if (buyerDiscount !== null && buyerDiscount < activePrice) {
                                                activePrice = buyerDiscount;
                                            }
                                            return sum + (activePrice * item.quantity);
                                        }, 0).toFixed(2)}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    const totalSum = cart.reduce((sum, item) => {
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
        <div className="page-cart">
            <h1>My Cart</h1>

            {cartLoading && <p>Loading...</p>}

            {!cartLoading && cart.length === 0 && <p>Your cart is empty.</p>}

            <div className="cart-items">
                {cart.map((item) => (
                    <CartItem
                        key={item.id}
                        item={item}
                        onUpdateQuantity={(qty) => handleUpdateQuantity(item.id, qty)}
                        onRemove={() => handleRemove(item.id)}
                    />
                ))}
            </div>

            {cart.length > 0 && (
                <div className="cart-summary">
                    <div>
                        <strong>Total:</strong> ₹{totalSum.toFixed(2)}
                    </div>
                    <div className="cart-actions" style={{ display: "flex", gap: "1rem" }}>
                        <button onClick={handleClearCart}>Clear Cart</button>
                        <button
                            onClick={() => navigate("/checkout")}
                            style={{
                                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                color: "#ffffff",
                                fontWeight: 600,
                                padding: "0.75rem 1.5rem",
                                borderRadius: "8px",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
