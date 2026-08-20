import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { placeOrder, getEffectivePrice, type ShippingDetails } from "../services/orderService";
import type { PaymentMethod } from "../types/order";
import { toast } from "react-hot-toast";
import "./checkout.css";
import { createPaymentIntent } from "../services/paymentService";

const Checkout: React.FC = () => {
    const { cart, subtotal, loadCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
        name: user?.name || "",
        phone: "",
        address: "",
        city: "",
    });

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
    const [submitting, setSubmitting] = useState(false);
    const [placedOrder, setPlacedOrder] = useState<{ id: number; total_amount: number } | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setShippingDetails((prev) => ({ ...prev, [name]: value }));
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!shippingDetails.name.trim()) {
            toast.error("Please enter your full name");
            return;
        }
        if (!shippingDetails.phone.trim()) {
            toast.error("Please enter your phone number");
            return;
        }
        if (!shippingDetails.address.trim()) {
            toast.error("Please enter your delivery address");
            return;
        }
        if (!shippingDetails.city.trim()) {
            toast.error("Please enter your city");
            return;
        }

        setSubmitting(true);
        try {
            const { order } = await placeOrder({
                shippingDetails,
                paymentMethod,
                cartItems: cart,
            });
            if (paymentMethod === "stripe") {
                const clientSecret = await createPaymentIntent(order.id);
                // Pass clientSecret to Stripe Elements or store it for payment confirmation
                console.log("clientSecret:", clientSecret);
                // e.g. navigate to a payment page with the secret
                navigate("/payment", { state: { clientSecret, orderId: order.id } });
                return;
            }
            toast.success("Order placed successfully!");
            setPlacedOrder({ id: order.id, total_amount: order.total_amount });
            // Reload cart so global state clears
            await loadCart();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to place order. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (placedOrder) {
        return (
            <div className="page-checkout">
                <div className="checkout-success-card">
                    <div className="success-icon-wrapper">
                        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                    <h2>Thank You for Your Order!</h2>
                    <p>Your order has been placed successfully and is being prepared.</p>

                    <div className="order-badge-info">
                        Order ID: #{placedOrder.id} &bull; Total Paid: ₹{placedOrder.total_amount.toFixed(2)}
                    </div>

                    <div className="success-actions">
                        <Link to="/orders" className="btn-primary-orders">
                            View My Orders
                        </Link>
                        <Link to="/products" className="btn-secondary-products">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="page-checkout">
                <div className="checkout-section-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
                    <h2>Your Cart is Empty</h2>
                    <p style={{ color: "#64748b", margin: "1rem 0 1.5rem 0" }}>
                        You don't have any items in your cart to checkout.
                    </p>
                    <Link to="/products" className="btn-primary-orders" style={{ display: "inline-block" }}>
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-checkout">
            <div className="checkout-header">
                <h1>
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    Checkout & Payment
                </h1>
                <p>Complete your delivery details below to finalize your order.</p>
            </div>

            <form onSubmit={handlePlaceOrder} className="checkout-grid">
                {/* Left Column: Shipping & Payment */}
                <div className="checkout-left-col">
                    <div className="checkout-section-card">
                        <h3 className="checkout-section-title">
                            <span>1. Shipping Information</span>
                        </h3>

                        <div className="checkout-form-row">
                            <div className="checkout-form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Enter your full name"
                                    value={shippingDetails.name}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="checkout-form-group">
                                <label>Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    placeholder="e.g. +91 9876543210"
                                    value={shippingDetails.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="checkout-form-group">
                            <label>Delivery Address *</label>
                            <textarea
                                name="address"
                                required
                                rows={3}
                                placeholder="House/Flat No., Street Name, Area"
                                value={shippingDetails.address}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="checkout-form-group">
                            <label>City / Town *</label>
                            <input
                                type="text"
                                name="city"
                                required
                                placeholder="e.g. Mumbai, Delhi, Ahmedabad"
                                value={shippingDetails.city}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="checkout-section-card">
                        <h3 className="checkout-section-title">
                            <span>2. Payment Method</span>
                        </h3>

                        <div className="payment-options">
                            <label
                                className={`payment-option-card ${paymentMethod === "cod" ? "selected" : ""}`}
                                onClick={() => setPaymentMethod("cod")}
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    value="cod"
                                    checked={paymentMethod === "cod"}
                                    onChange={() => setPaymentMethod("cod")}
                                />
                                <div className="payment-option-info">
                                    <h4>Cash on Delivery (COD)</h4>
                                    <p>Pay with cash or UPI upon delivery at your doorstep.</p>
                                </div>
                            </label>

                            <label
                                className={`payment-option-card ${paymentMethod === "stripe" ? "selected" : ""}`}
                                onClick={() => setPaymentMethod("stripe")}
                            >
                                <input
                                    type="radio"
                                    name="payment"
                                    value="stripe"
                                    checked={paymentMethod === "stripe"}
                                    onChange={() => setPaymentMethod("stripe")}
                                />
                                <div className="payment-option-info">
                                    <h4>Online Card / Instant Payment (Mock)</h4>
                                    <p>Simulate online credit/debit card checkout.</p>
                                    <div className="stripe-badge-box">
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Stripe Integration Ready: Switch to live Stripe Checkout seamlessly in future!
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="checkout-right-col">
                    <div className="checkout-section-card checkout-summary-card">
                        <h3 className="checkout-section-title">Order Summary</h3>

                        <div className="checkout-summary-items">
                            {cart.map((item) => {
                                const unitPrice = getEffectivePrice(item);
                                const itemTotal = unitPrice * item.quantity;

                                return (
                                    <div key={item.id} className="checkout-summary-item">
                                        {item.products?.image_url ? (
                                            <img
                                                src={item.products.image_url}
                                                alt={item.products.name}
                                                className="checkout-summary-item-img"
                                            />
                                        ) : (
                                            <div className="checkout-summary-item-img" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                📦
                                            </div>
                                        )}
                                        <div className="checkout-summary-item-details">
                                            <h4 className="checkout-summary-item-name">{item.products?.name || "Product"}</h4>
                                            <span className="checkout-summary-item-price">
                                                ₹{unitPrice.toFixed(2)} &times; {item.quantity}
                                            </span>
                                        </div>
                                        <div className="checkout-summary-item-total">
                                            ₹{itemTotal.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="checkout-totals">
                            <div className="checkout-total-row">
                                <span>Items Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="checkout-total-row">
                                <span>Shipping Fee</span>
                                <span style={{ color: "#16a34a", fontWeight: 600 }}>FREE</span>
                            </div>
                            <div className="checkout-total-row grand-total">
                                <span>Total Payable</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-place-order"
                            disabled={submitting}
                        >
                            {submitting ? "Placing Order..." : "Confirm & Place Order"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Checkout;
