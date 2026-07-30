import { supabase } from "../lib/supabase-client";

export const signUp = async (
    name: string,
    email: string,
    password: string,
    role: string,
    phone: string,
    city: string
) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        return { data, error };
    }

    if (data.user) {

        // Find role id from database, or fallback to standard IDs if query returns empty (e.g., due to RLS or missing rows)
        let roleId: number | null = null;
        const { data: roleData } = await supabase
            .from("roles")
            .select("id")
            .eq("name", role)
            .maybeSingle();

        if (roleData) {
            roleId = roleData.id;
        } else {
            const fallbackRoles: Record<string, number> = {
                admin: 1,
                seller: 2,
                buyer: 3,
            };
            roleId = fallbackRoles[role.toLowerCase()] || null;
        }

        // Insert profile
        const { error: insertError } = await supabase
            .from("users")
            .insert({
                id: data.user.id,
                name,
                email,
                role_id: roleId,
                phone,
                city,
            });

        if (insertError) {
            return { data: null, error: insertError };
        }
    }

    return { data, error: null };
};
export const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
        email,
        password,
    });
};

export const signOut = async () => {
    return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
    return await supabase.auth.getUser();
};

export const getProfile = async () => {
    const { data: authData, error: authError } =
        await supabase.auth.getUser();

    if (authError || !authData.user) {
        return { data: null, error: authError };
    }

    const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

    return { data, error };
};

