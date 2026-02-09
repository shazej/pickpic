import { auth } from "@/auth";

/**
 * Bridge function to maintain compatibility with legacy code
 */
export async function getSession() {
    return await auth();
}

/**
 * These are now handled by Auth.js but kept as empty exports to avoid breaking imports
 */
export async function login(userData: any) {
    console.warn("Legacy login called. Use Auth.js signIn instead.");
}

export async function logout() {
    console.warn("Legacy logout called. Use Auth.js signOut instead.");
}

export async function updateSession(request: any) {
    // No-op in Auth.js database strategy (handled by adapter)
}

export const SESSION_COOKIE_NAME = 'authjs.session-token';
