import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { MSSQLAdapter } from "./lib/auth-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query, sql } from "./lib/db";

export const {
    handlers,
    auth,
    signIn,
    signOut
} = NextAuth({
    adapter: MSSQLAdapter(),
    session: { strategy: "database" },
    ...authConfig,
    providers: [
        ...authConfig.providers,
        Credentials({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const result = await query(`
          SELECT id, email, password_hash, display_name as name
          FROM auth.Users WHERE email = @email
        `, [{ name: 'email', value: credentials.email, type: sql.NVarChar }]);

                const user = result.recordset[0];
                if (!user || !user.password_hash) return null;

                let passwordHash = user.password_hash;
                if (Buffer.isBuffer(passwordHash)) {
                    passwordHash = passwordHash.toString('utf-8');
                }

                const isValid = await bcrypt.compare(credentials.password as string, passwordHash);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            },
        }),
    ],
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
