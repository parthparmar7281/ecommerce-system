import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getBuyerOrders, getSellerOrderItems, updateOrderStatus } from "../services/orderService";
import type { Order, OrderStatus } from "../types/order";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import "./orders.css";

const Orders: React.FC = () => {
    const { user } = useAuth();
    const isSeller = user?.role === "Seller";

    const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
    const [sellerOrderItems, setSellerOrderItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, [isSeller]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            if (isSeller) {
                const { data, error } = await getSellerOrderItems();
                if (error) {
                    toast.error("Failed to load seller orders");
                    console.error(error);
                } else {
                    setSellerOrderItems(data || []);
                }
            } else {
                const { data, error } = await getBuyerOrders();
                if (error) {
                    toast.error("Failed to load orders");
                    console.error(error);
                } else {
                    setBuyerOrders(data || []);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
        const { error } = await updateOrderStatus(orderId, newStatus);
        if (error) {
            toast.error("Failed to update status: " + error.message);
            return;
        }

        toast.success(`Order #${orderId} status updated to ${newStatus}`);

        if (isSeller) {
            setSellerOrderItems((prev) =>
                prev.map((item) =>
                    item.order?.id === orderId
                        ? { ...item, order: { ...item.order, status: newStatus } }
                        : item
                )
            );
        } else {
            setBuyerOrders((prev) =>
                prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
            );
        }
    };

    if (loading) {
        return (
            <div className="page-orders">
                <div style={{ textAlign: "center", padding: "4rem" }}>
                    <h3>Loading Orders...</h3>
                </div>
            </div>
        );
    }

    if (isSeller) {
        // Group seller order items by order ID
        const orderMap: Record<number, { order: any; items: any[] }> = {};
        sellerOrderItems.forEach((item) => {
            if (!item.order) return;
            const oId = item.order.id;
            if (!orderMap[oId]) {
                orderMap[oId] = {
                    order: item.order,
                    items: [],
                };
            }
            orderMap[oId].items.push(item);
        });

        const groupedSellerOrders = Object.values(orderMap);

        return (
            <div className="page-orders">
                <div className="orders-header">
                    <h1>
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Customer Orders (Seller View)
                    </h1>
                    <p>Track customer purchases and update order delivery statuses.</p>
                </div>

                {groupedSellerOrders.length === 0 ? (
                    <div className="empty-orders-state">
                        <div className="empty-orders-icon">
                            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M12 2.25v6" />
                            </svg>
                        </div>
                        <h3>No Customer Orders Yet</h3>
                        <p>When buyers order your products, their orders will appear here.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {groupedSellerOrders.map(({ order, items }) => {
                            const orderTotal = items.reduce((sum: number, it: any) => sum + Number(it.subtotal || 0), 0);

                            return (
                                <div key={order.id} className="order-card">
                                    <div className="order-card-header">
                                        <div className="order-meta-group">
                                            <div className="order-meta-item">
                                                <span className="order-meta-label">Order Placed</span>
                                                <span className="order-meta-value">
                                                    {new Date(order.created_at).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </span>
                                            </div>
                                            <div className="order-meta-item">
                                                <span className="order-meta-label">Buyer Name</span>
                                                <span className="order-meta-value">{order.shipping_name || order.buyer?.name || "Customer"}</span>
                                            </div>
                                            <div className="order-meta-item">
                                                <span className="order-meta-label">Total Value</span>
                                                <span className="order-meta-value">₹{orderTotal.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <span className={`status-badge ${order.status}`}>{order.status}</span>
                                            <select
                                                className="seller-status-select"
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="order-card-body">
                                        <div className="order-items-list">
                                            {items.map((item: any) => (
                                                <div key={item.id} className="order-item-row">
                                                    {item.product?.image_url ? (
                                                        <img
                                                            src={item.product.image_url}
                                                            alt={item.product_name}
                                                            className="order-item-img"
                                                        />
                                                    ) : (
                                                        <div className="order-item-img" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            📦
                                                        </div>
                                                    )}
                                                    <div className="order-item-info">
                                                        <h4 className="order-item-name">{item.product_name}</h4>
                                                        <span className="order-item-price-qty">
                                                            Price: ₹{Number(item.unit_price).toFixed(2)} &times; Qty: {item.quantity}
                                                        </span>
                                                    </div>
                                                    <div className="order-item-subtotal">
                                                        ₹{Number(item.subtotal).toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="order-card-footer">
                                        <div className="shipping-address-summary">
                                            📍 <strong>Shipping Address:</strong> {order.shipping_address}, {order.shipping_city} (Phone: {order.shipping_phone})
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                            Payment: <strong style={{ textTransform: "uppercase" }}>{order.payment_method}</strong> ({order.payment_status})
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Buyer View
    return (
        <div className="page-orders">
            <div className="orders-header">
                <h1>
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    My Orders
                </h1>
                <p>Track your order status and view purchase history.</p>
            </div>

            {buyerOrders.length === 0 ? (
                <div className="empty-orders-state">
                    <div className="empty-orders-icon">
                        <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                        </svg>
                    </div>
                    <h3>You Have No Placed Orders Yet</h3>
                    <p>Once you purchase products, your order status will appear here.</p>
                    <Link to="/products" className="btn-primary-orders" style={{ display: "inline-block" }}>
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="orders-list">
                    {buyerOrders.map((order) => (
                        <div key={order.id} className="order-card">
                            <div className="order-card-header">
                                <div className="order-meta-group">
                                    <div className="order-meta-item">
                                        <span className="order-meta-label">Order ID</span>
                                        <span className="order-meta-value">#{order.id}</span>
                                    </div>
                                    <div className="order-meta-item">
                                        <span className="order-meta-label">Order Placed</span>
                                        <span className="order-meta-value">
                                            {new Date(order.created_at).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    <div className="order-meta-item">
                                        <span className="order-meta-label">Total Amount</span>
                                        <span className="order-meta-value">₹{Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className={`status-badge ${order.status}`}>
                                    {order.status}
                                </div>
                            </div>

                            <div className="order-card-body">
                                <div className="order-items-list">
                                    {order.order_items?.map((item) => (
                                        <div key={item.id} className="order-item-row">
                                            {item.product?.image_url ? (
                                                <img
                                                    src={item.product.image_url}
                                                    alt={item.product_name}
                                                    className="order-item-img"
                                                />
                                            ) : (
                                                <div className="order-item-img" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    📦
                                                </div>
                                            )}
                                            <div className="order-item-info">
                                                <h4 className="order-item-name">{item.product_name}</h4>
                                                <span className="order-item-price-qty">
                                                    Price: ₹{Number(item.unit_price).toFixed(2)} &times; Qty: {item.quantity}
                                                </span>
                                            </div>
                                            <div className="order-item-subtotal">
                                                ₹{Number(item.subtotal).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="order-card-footer">
                                <div className="shipping-address-summary">
                                    📍 <strong>Deliver to:</strong> {order.shipping_name}, {order.shipping_address}, {order.shipping_city} (Phone: {order.shipping_phone})
                                </div>
                                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                    Payment Method: <strong style={{ textTransform: "uppercase" }}>{order.payment_method}</strong> ({order.payment_status})
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
