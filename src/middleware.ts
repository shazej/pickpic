
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/auth';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { decrypt } from '@/lib/auth';

// Define protected routes and their required roles
const roleRules = [
    { prefix: '/sell', roles: ['seller', 'admin'] },
    { prefix: '/admin', roles: ['admin'] },
];

const protectedRoutes = ['/account', '/sell', '/messages', '/admin'];
const authRoutes = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Check if path matches any role rule
    const requiredRoles = roleRules.find(r => path.startsWith(r.prefix))?.roles;
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    const isAuthRoute = authRoutes.some(route => path.startsWith(route));

    // Update Session Cookie Expiry if present
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    let user: any = null;

    if (sessionCookie) {
        try {
            const parsed = await decrypt(sessionCookie);
            if (parsed && parsed.user) {
                user = parsed.user;
                await updateSession(request);
            }
        } catch (e) {
            // Invalid session
        }
    }

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.search // Keep query params if needed
        return NextResponse.redirect(url);
    }

    // Role-based Access Control
    if (requiredRoles && user) {
        const hasRole = user.roles && user.roles.some((role: string) => requiredRoles.includes(role));
        if (!hasRole) {
            // Redirect to account or 403 page
            const url = request.nextUrl.clone();
            url.pathname = '/account';
            return NextResponse.redirect(url);
        }
    }

    // Redirect authenticated users from auth routes (login/register)
    if (isAuthRoute && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/account';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
