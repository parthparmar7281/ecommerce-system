import type { UserProfile } from "../types/user";
import type { Product } from "../types/product";

const ROLE_PERMISSIONS: Record<string, string[]> = {
    admin: ["products.view", "products.create", "products.update", "products.delete"],
    seller: ["products.view", "products.create", "products.update", "products.delete"],
    buyer: ["products.view"],
};

export const hasPermission = (user: UserProfile | null, permissionName: string): boolean => {
    if (!user) return false;

    // 1. Check if user has permissions fetched from the database
    if (user.permissions && user.permissions.length > 0) {
        return user.permissions.includes(permissionName);
    }

    // 2. Fall back to role-based permissions mapping
    const roleKey = user.role?.toLowerCase() || "";
    const permissions = ROLE_PERMISSIONS[roleKey] || [];
    return permissions.includes(permissionName);
};

export const canCreateProduct = (user: UserProfile | null): boolean => {
    return hasPermission(user, "products.create");
};

export const canEditProduct = (user: UserProfile | null, product: Product): boolean => {
    if (!user) return false;
    
    // Admin can do anything
    if (user.role?.toLowerCase() === "admin") return true;

    // Seller can update their own products
    return hasPermission(user, "products.update") && product.created_by === user.id;
};

export const canDeleteProduct = (user: UserProfile | null, product: Product): boolean => {
    if (!user) return false;

    // Admin can do anything
    if (user.role?.toLowerCase() === "admin") return true;

    // Seller can delete their own products
    return hasPermission(user, "products.delete") && product.created_by === user.id;
};
