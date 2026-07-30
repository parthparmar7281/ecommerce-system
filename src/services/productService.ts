import { supabase } from "../lib/supabase-client";

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

// Upload Product Image to Supabase Storage 'product-images' bucket
export const uploadProductImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
            cacheControl: "604800",
            upsert: false,
        });

    if (uploadError) {
        throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
};

// Create Product
export const createProduct = async (product: Product) => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            data: null,
            error: { message: "User not authenticated" },
        };
    }

    return await supabase.from("products").insert({
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        offer_price: product.offer_price !== undefined ? product.offer_price : null,
        image_url: product.image_url || null,
        created_by: user.id,
    });
};

export interface ProductFilters {
    search?: string;
    status?: string;
    sortBy?: string;
    createdBy?: string;
    page?: number;
    pageSize?: number;
}

// Get All Products
export const getProducts = async (filters?: ProductFilters) => {
    let query = supabase.from("products").select("*", { count: "exact" });

    if (filters?.createdBy) {
        query = query.eq("created_by", filters.createdBy);
    }

    if (filters?.search) {
        // SQL-like case-insensitive search on name or description using or/ilike
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.status === "in-stock") {
        query = query.gt("quantity", 10);
    } else if (filters?.status === "low-stock") {
        query = query.gt("quantity", 0).lte("quantity", 10);
    } else if (filters?.status === "out-of-stock") {
        query = query.eq("quantity", 0);
    }

    if (filters?.sortBy) {
        const [field, direction] = filters.sortBy.split("-");
        const orderField = field === "qty" ? "quantity" : field;
        query = query.order(orderField, { ascending: direction === "asc" });
    } else {
        query = query.order("id", { ascending: true });
    }

    if (filters?.page && filters?.pageSize) {
        const from = (filters.page - 1) * filters.pageSize;
        const to = from + filters.pageSize - 1;
        query = query.range(from, to);
    }

    return await query;
};

// Get Product By Id
export const getProductById = async (id: number) => {
    return await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
};

// Update Product
export const updateProduct = async (
    id: number,
    product: Product
) => {
    return await supabase
        .from("products")
        .update({
            name: product.name,
            description: product.description,
            price: product.price,
            quantity: product.quantity,
            offer_price: product.offer_price !== undefined ? product.offer_price : null,
            image_url: product.image_url !== undefined ? product.image_url : null,
        })
        .eq("id", id);
};

// Delete Product
export const deleteProduct = async (id: number) => {
    return await supabase
        .from("products")
        .delete()
        .eq("id", id);
};