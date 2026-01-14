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
    trustHost: true,
    ...authConfig,
    providers: [
        ...authConfig.providers,
        Credentials({
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const result = await query(`
          SELECT u.id, u.email, u.password_hash, u.display_name as name,
                 (SELECT STRING_AGG(r.name, ',') FROM auth.Roles r JOIN auth.UserRoles ur ON r.id = ur.role_id WHERE ur.user_id = u.id) as roles
          FROM auth.Users u WHERE u.email = @email
        `, [{ name: 'email', value: credentials.email, type: sql.NVarChar }]);

                const user = result.recordset[0];
                if (!user || !user.password_hash) {
                    console.log(`[Auth] Login failed for ${credentials.email}: user not found or no password hash.`);
                    return null;
                }

                const roles = user.roles ? user.roles.split(',') : [];

                let passwordHash = user.password_hash;
                if (Buffer.isBuffer(passwordHash)) {
                    passwordHash = passwordHash.toString('utf-8');
                }

                const isValid = await bcrypt.compare(credentials.password as string, passwordHash);
                if (!isValid) {
                    console.log(`[Auth] Login failed for ${credentials.email}: invalid password.`);
                    return null;
                }

                console.log(`[Auth] Login success for ${user.email} (ID: ${user.id})`);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    roles: roles
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.roles = (user as any).roles;
                console.log(`[Auth] JWT created for user ${user.id}`);
            }

            // Fetch Subscription Status on every JWT check (in Node environment)
            // Note: This relies on auth.ts only running in Node. Middleware uses auth.config.ts.
            if (token.id) {
                try {
                    const subRes = await query(
                        `SELECT status FROM billing.Subscriptions WHERE user_id = @userId AND status = 'active'`,
                        [{ name: 'userId', value: token.id }]
                    );
                    token.subscription = subRes.recordset.length > 0 ? 'active' : 'free';
                } catch (e) {
                    console.error("Failed to fetch subscription", e);
                    token.subscription = 'free';
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as any).roles = token.roles as string[];
                (session.user as any).subscription = token.subscription || 'free';
            }
            return session;
        }
    }
});
