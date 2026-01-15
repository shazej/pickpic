// tests/unit/rbac.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
    query: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { requireRole, requireAdmin, requireSuperAdmin, currentUser } from '@/lib/auth-checks';

describe('RBAC Authorization Helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('currentUser', () => {
        it('should return null when no session exists', async () => {
            vi.mocked(auth).mockResolvedValue(null);

            const user = await currentUser();

            expect(user).toBeNull();
        });

        it('should return user when session exists', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'admin@example.com',
                    role: 'ADMIN',
                },
            };
            vi.mocked(auth).mockResolvedValue(mockSession as any);

            const user = await currentUser();

            expect(user).toEqual(mockSession.user);
        });
    });

    describe('requireRole', () => {
        it('should throw error when user is not authenticated', async () => {
            vi.mocked(auth).mockResolvedValue(null);

            await expect(requireRole('ADMIN')).rejects.toThrow('Unauthorized');
        });

        it('should throw error when user does not have required role', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'buyer@example.com',
                    role: 'BUYER',
                },
            };
            vi.mocked(auth).mockResolvedValue(mockSession as any);

            await expect(requireRole('ADMIN')).rejects.toThrow('Forbidden: Insufficient permissions');
        });

        it('should return user when user has exact required role', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'admin@example.com',
                    role: 'ADMIN',
                },
            };
            vi.mocked(auth).mockResolvedValue(mockSession as any);

            const user = await requireRole('ADMIN');

            expect(user).toEqual(mockSession.user);
        });

        it('should return user when user is SUPER_ADMIN (has all permissions)', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'superadmin@example.com',
                    role: 'SUPER_ADMIN',
                },
            };
            vi.mocked(auth).mockResolvedValue(mockSession as any);

            const user = await requireRole('ADMIN');

            expect(user).toEqual(mockSession.user);
        });
    });

    describe('requireAdmin', () => {
        it('should throw error when user is not authenticated', async () => {
            vi.mocked(auth).mockResolvedValue(null);

            await expect(requireAdmin()).rejects.toThrow('Unauthorized');
        });

        it('should throw error when user is BUYER', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'buyer@example.com',
                    role: 'BUYER',
                },
            };
            vi.mocked(auth).mockResolvedValue(mockSession as any);

            await expect(requireAdmin()).rejects.toThrow('Forbidden: Insufficient permissions');
        });

        it('should throw error when user is SELLER', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'seller@example.com',
                    role: 'SELLER',
                },
            };
            vi.mocked(auth).mockResolvedValue(mockSession as any);

            await expect(requireAdmin()).rejects.toThrow('Forbidden: Insufficient permissions');
        });

        it('should return user when user is ADMIN', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'admin@example.com',
                    role: 'ADMIN',
                },
            };
            vi.mocked(auth).mockResolvedValue(mockSession as any);

            const user = await requireAdmin();

            expect(user).toEqual(mockSession.user);
        });

        it('should return user when user is SUPER_ADMIN', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'superadmin@example.com',
                    role: 'SUPER_ADMIN',
                },
            };
            vi.mocked(auth).mockResolvedValue(mockSession as any);

            const user = await requireAdmin();

            expect(user).toEqual(mockSession.user);
        });
    });

    describe('requireSuperAdmin', () => {
        it('should throw error when user is not authenticated', async () => {
            vi.mocked(auth).mockResolvedValue(null);

            await expect(requireSuperAdmin()).rejects.toThrow('Unauthorized');
        });

        it('should throw error when user is ADMIN', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'admin@example.com',
                    role: 'ADMIN',
                },
            };
            vi.mocked(auth).mockResolvedValue(mockSession as any);

            await expect(requireSuperAdmin()).rejects.toThrow('Forbidden: Insufficient permissions');
        });

        it('should return user when user is SUPER_ADMIN', async () => {
            const mockSession = {
                user: {
                    id: 'user-123',
                    email: 'superadmin@example.com',
                    role: 'SUPER_ADMIN',
                },
            };
            vi.mocked(auth).mockResolvedValue(mockSession as any);

            const user = await requireSuperAdmin();

            expect(user).toEqual(mockSession.user);
        });
    });
});
