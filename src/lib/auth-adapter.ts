import { Adapter, AdapterUser, AdapterAccount, AdapterSession } from "@auth/core/adapters";
import { query, sql } from "./db";
import { v4 as uuidv4 } from 'uuid';
import { encrypt_token } from "./encryption";

export function MSSQLAdapter(): Adapter {
    return {
        async createUser(user: Omit<AdapterUser, "id">) {
            const id = uuidv4();
            await query(`
        INSERT INTO auth.Users (id, email, display_name, is_active, language)
        VALUES (@id, @email, @name, 1, 'en')
      `, [
                { name: 'id', value: id, type: sql.UniqueIdentifier },
                { name: 'email', value: user.email, type: sql.NVarChar },
                { name: 'name', value: user.name || null, type: sql.NVarChar }
            ]);
            return { ...user, id } as AdapterUser;
        },

        async getUser(id: string) {
            const result = await query(`
        SELECT u.id, u.email, u.display_name as name, u.is_active, u.language,
               (SELECT STRING_AGG(r.name, ',') FROM auth.Roles r JOIN auth.UserRoles ur ON r.id = ur.role_id WHERE ur.user_id = u.id) as roles
        FROM auth.Users u WHERE u.id = @id
      `, [
                { name: 'id', value: id, type: sql.UniqueIdentifier }
            ]);
            if (result.recordset.length === 0) return null;
            const user = result.recordset[0];
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                emailVerified: null,
                roles: user.roles ? user.roles.split(',') : [],
            } as any;
        },

        async getUserByEmail(email: string) {
            const result = await query(`
        SELECT id, email, display_name as name
        FROM auth.Users WHERE email = @email
      `, [
                { name: 'email', value: email, type: sql.NVarChar }
            ]);
            if (result.recordset.length === 0) return null;
            const user = result.recordset[0];
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                emailVerified: null,
            } as AdapterUser;
        },

        async getUserByAccount({ provider, providerAccountId }) {
            const result = await query(`
        SELECT u.id, u.email, u.display_name as name
        FROM auth.Users u
        JOIN auth.oauth_accounts oa ON u.id = oa.user_id
        WHERE oa.provider = @provider AND oa.provider_account_id = @providerAccountId
      `, [
                { name: 'provider', value: provider, type: sql.NVarChar },
                { name: 'providerAccountId', value: providerAccountId, type: sql.NVarChar }
            ]);
            if (result.recordset.length === 0) return null;
            const user = result.recordset[0];
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                emailVerified: null,
            } as AdapterUser;
        },

        async updateUser(user: Partial<AdapterUser> & { id: string }) {
            // Basic update for name/email
            if (user.name) {
                await query(`UPDATE auth.Users SET display_name = @name WHERE id = @id`, [
                    { name: 'id', value: user.id, type: sql.UniqueIdentifier },
                    { name: 'name', value: user.name, type: sql.NVarChar }
                ]);
            }
            return user as AdapterUser;
        },

        async linkAccount(account: AdapterAccount) {
            await query(`
        INSERT INTO auth.oauth_accounts (user_id, provider, provider_account_id, access_token_encrypted, refresh_token_encrypted, token_expires_at)
        VALUES (@userId, @provider, @providerAccountId, @accessToken, @refreshToken, @expiresAt)
      `, [
                { name: 'userId', value: account.userId, type: sql.UniqueIdentifier },
                { name: 'provider', value: account.provider, type: sql.NVarChar },
                { name: 'providerAccountId', value: account.providerAccountId, type: sql.NVarChar },
                { name: 'accessToken', value: encrypt_token(account.access_token) || null, type: sql.NVarChar },
                { name: 'refreshToken', value: encrypt_token(account.refresh_token) || null, type: sql.NVarChar },
                { name: 'expiresAt', value: account.expires_at ? new Date(account.expires_at * 1000) : null, type: sql.DateTime2 }
            ]);
        },

        async createSession({ sessionToken, userId, expires }) {
            console.log("ADAPTER - createSession", { userId, sessionToken });
            await query(`
        INSERT INTO auth.sessions (user_id, session_token, expires_at)
        VALUES (@userId, @sessionToken, @expires)
      `, [
                { name: 'userId', value: userId, type: sql.UniqueIdentifier },
                { name: 'sessionToken', value: sessionToken, type: sql.NVarChar },
                { name: 'expires', value: expires, type: sql.DateTime2 }
            ]);
            return { sessionToken, userId, expires } as AdapterSession;
        },

        async getSessionAndUser(sessionToken: string) {
            console.log("ADAPTER - getSessionAndUser", { sessionToken });
            const sessionResult = await query(`
        SELECT user_id as userId, session_token as sessionToken, expires_at as expires
        FROM auth.sessions WHERE session_token = @sessionToken AND (revoked_at IS NULL OR revoked_at > SYSDATETIME())
      `, [
                { name: 'sessionToken', value: sessionToken, type: sql.NVarChar }
            ]);

            if (sessionResult.recordset.length === 0) {
                console.log("ADAPTER - getSessionAndUser - NO SESSION FOUND");
                return null;
            }
            const session = sessionResult.recordset[0];

            const userResult = await query(`
        SELECT u.id, u.email, u.display_name as name,
               (SELECT STRING_AGG(r.name, ',') FROM auth.Roles r JOIN auth.UserRoles ur ON r.id = ur.role_id WHERE ur.user_id = u.id) as roles
        FROM auth.Users u WHERE u.id = @id
      `, [
                { name: 'id', value: session.userId, type: sql.UniqueIdentifier }
            ]);

            if (userResult.recordset.length === 0) {
                console.log("ADAPTER - getSessionAndUser - NO USER FOUND");
                return null;
            }
            const user = userResult.recordset[0];
            console.log("ADAPTER - getSessionAndUser - SUCCESS", { user: user.email, roles: user.roles });

            return {
                session: {
                    sessionToken: session.sessionToken,
                    userId: session.userId,
                    expires: session.expires,
                },
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    emailVerified: null,
                    roles: user.roles ? user.roles.split(',') : [],
                } as any
            };
        },

        async updateSession(session: Partial<AdapterSession> & { sessionToken: string }) {
            if (session.expires) {
                await query(`UPDATE auth.sessions SET expires_at = @expires WHERE session_token = @sessionToken`, [
                    { name: 'sessionToken', value: session.sessionToken, type: sql.NVarChar },
                    { name: 'expires', value: session.expires, type: sql.DateTime2 }
                ]);
            }
            return null;
        },

        async deleteSession(sessionToken: string) {
            await query(`DELETE FROM auth.sessions WHERE session_token = @sessionToken`, [
                { name: 'sessionToken', value: sessionToken, type: sql.NVarChar }
            ]);
        },
    };
}
