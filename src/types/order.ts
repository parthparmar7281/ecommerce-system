export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'cod' | 'stripe';

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number | null;
    seller_id?: string | null;
    product_name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
    created_at?: string;
    product?: {
        image_url?: string | null;
        name?: string;
    } | null;
}

export interface Order {
    id: number;
    buyer_id: string;
    total_amount: number;
    status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod;
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city: string;
    stripe_session_id?: string | null;
    created_at: string;
    order_items?: OrderItem[];
    buyer?: {
        name: string;
        email: string;
    } | null;
}
