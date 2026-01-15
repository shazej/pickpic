import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type UserRole = 'admin' | 'super_admin' | 'seller' | 'buyer';

export async function currentUser() {
    const session = await auth();
    return session?.user;
}

export async function requireRole(requiredRole: UserRole | UserRole[]) {
    const user = await currentUser();

    if (!user) {
        redirect("/login");
    }

    const userRoles = (user as any).roles as string[] | undefined;

    if (!userRoles || userRoles.length === 0) {
        redirect("/unauthorized"); // Or some error page
    }

    const rolesToCheck = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // Super admin bypass or explicit match
    const hasRole = userRoles.some(role =>
        rolesToCheck.includes(role as UserRole) || role === 'super_admin'
    );

    if (!hasRole) {
        redirect("/admin/unauthorized"); // Distinct admin error page
    }

    return user;
}

export async function requireAdmin() {
    return requireRole(['admin', 'super_admin']);
}

export async function requireSuperAdmin() {
    return requireRole('super_admin');
}
