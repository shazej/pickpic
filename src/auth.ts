import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { MSSQLAdapter } from "./lib/auth-adapter";

export const {
    handlers,
    auth,
    signIn,
    signOut
} = NextAuth({
    adapter: MSSQLAdapter(),
    session: { strategy: "database" },
    ...authConfig,
    callbacks: {
        async session({ session, user }) {
            if (session.user && user) {
                session.user.id = user.id;
                (session.user as any).roles = (user as any).roles;
            }
            return session;
        },
    },
});
