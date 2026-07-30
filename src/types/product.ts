export interface Product {
    id?: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
    created_by?: string;
    created_at?: string;
    offer_price?: number | null;
    image_url?: string | null;
}