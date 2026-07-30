import type { Product } from "./product";

export interface Cart {
    id: number;
    buyer_id: string;
    product_id: number;
    quantity: number;
    created_at: string;
    discount_price?: number;
    offer_duration_hours?: number | null;
    offer_activated_at?: string | null;
    products?: Product;
}