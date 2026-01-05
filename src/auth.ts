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
                if (!user || !user.password_hash) return null;

                const roles = user.roles ? user.roles.split(',') : [];

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
                    roles: roles
                };
            },
        }),
    ],
});
