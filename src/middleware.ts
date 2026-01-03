
import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextRequest, NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

const roleRules = [
    { prefix: '/sell', roles: ['seller', 'admin', 'super_admin'] },
    { prefix: '/super-admin', roles: ['super_admin'] },
    { prefix: '/admin', roles: ['admin', 'super_admin'] },
];

const protectedRoutes = ['/account', '/sell', '/messages', '/admin', '/super-admin'];
const authRoutes = ['/login', '/register', '/forgot-password'];

export default auth(async (req) => {
    const path = req.nextUrl.pathname;
    const session = req.auth;
    const user = session?.user as any;

    const requiredRoles = roleRules.find(r => path.startsWith(r.prefix))?.roles;
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isAuthRoute = authRoutes.some(route => path.startsWith(route));

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !user) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Role-based Access Control
    if (requiredRoles && user) {
        const hasRole = user.roles && user.roles.some((role: string) => requiredRoles.includes(role));
        if (!hasRole) {
            const url = req.nextUrl.clone();
            url.pathname = '/account';
            return NextResponse.redirect(url);
        }
    }

    // Redirect authenticated users from auth routes
    if (isAuthRoute && user) {
        const url = req.nextUrl.clone();
        url.pathname = '/account';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
