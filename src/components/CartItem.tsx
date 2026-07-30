import type { Cart as CartType } from "../types/cart";
import { useState, useEffect } from "react";

interface CartItemProps {
    item: CartType;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
}

const CartItem = ({ item, onUpdateQuantity, onRemove }: CartItemProps) => {
    const [quantity, setQuantity] = useState<number>(item.quantity);

    useEffect(() => {
        setQuantity(item.quantity);
    }, [item.quantity]);

    const product = item.products;

    const handleDecrease = () => {
        const next = Math.max(1, quantity - 1);
        setQuantity(next);
        onUpdateQuantity(next);
    };

    const handleIncrease = () => {
        const next = quantity + 1;
        setQuantity(next);
        onUpdateQuantity(next);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value || 0);
        if (Number.isNaN(val)) return;
        setQuantity(val);
    };

    const handleBlur = () => {
        const next = Math.max(1, quantity);
        setQuantity(next);
        onUpdateQuantity(next);
    };

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
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

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
        <div className="cart-item">
            {product?.image_url && (
                <div className="cart-item-img-container">
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="cart-item-img"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            )}
            <div className="cart-item-info">
                <div className="cart-item-title">{product?.name}</div>
                <div className="cart-item-price-row">
                    {hasDiscount ? (
                        <div className="cart-item-discount-container">
                            <span className="cart-item-discount-price">₹{activePrice.toFixed(2)}</span>
                            <span className="cart-item-original-price">₹{originalPrice.toFixed(2)}</span>
                            <span className="cart-item-discount-badge">
                                {buyerDiscount !== null && buyerDiscount <= (globalDiscount ?? originalPrice)
                                    ? "Special Offer!"
                                    : "Sale!"}
                            </span>
                            {buyerDiscount !== null && timeLeft && timeLeft !== "Expired" && (
                                <span className={`cart-item-expiry-countdown ${timeLeft.includes("h ") ? "" : "urgent"}`}>
                                    ⏳ {timeLeft}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="cart-item-price">₹{originalPrice.toFixed(2)}</span>
                    )}
                </div>
            </div>

            <div className="cart-item-controls">
                <button onClick={handleDecrease} aria-label="Decrease quantity">-</button>
                <input type="number" value={quantity} onChange={handleChange} onBlur={handleBlur} min={1} />
                <button onClick={handleIncrease} aria-label="Increase quantity">+</button>
            </div>

            <div className="cart-item-actions">
                <button onClick={onRemove}>Remove</button>
            </div>
        </div>
    );
};

export default CartItem;
