export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string;
    city: string;
    permissions?: string[];
}
