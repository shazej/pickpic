// tests/unit/seller-approval.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth-checks', () => ({
    requireAdmin: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
    query: vi.fn(),
    sql: {
        NVarChar: 'NVarChar',
        UniqueIdentifier: 'UniqueIdentifier',
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

import { requireAdmin } from '@/lib/auth-checks';
import { query } from '@/lib/db';
import { getSellers, updateSellerStatus } from '@/app/admin/sellers/actions';

describe('Seller Approval Workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSellers', () => {
        it('should require admin authentication', async () => {
            vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

            await expect(getSellers('PENDING')).rejects.toThrow('Unauthorized');
            expect(requireAdmin).toHaveBeenCalledTimes(1);
        });

        it('should fetch pending sellers', async () => {
            const mockUser = { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' };
            vi.mocked(requireAdmin).mockResolvedValue(mockUser as any);

            const mockSellers = [
                {
                    id: 'seller-1',
                    user_id: 'user-1',
                    store_name: 'Test Store 1',
                    status: 'PENDING',
                    created_at: new Date('2024-01-01'),
                    email: 'seller1@example.com',
                },
                {
                    id: 'seller-2',
                    user_id: 'user-2',
                    store_name: 'Test Store 2',
                    status: 'PENDING',
                    created_at: new Date('2024-01-02'),
                    email: 'seller2@example.com',
                },
            ];

            vi.mocked(query).mockResolvedValue({ recordset: mockSellers } as any);

            const result = await getSellers('PENDING');

            expect(result).toEqual(mockSellers);
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE sp.status = @status'),
                expect.arrayContaining([
                    expect.objectContaining({ name: 'status', value: 'PENDING' }),
                ])
            );
        });

        it('should fetch approved sellers', async () => {
            const mockUser = { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' };
            vi.mocked(requireAdmin).mockResolvedValue(mockUser as any);

            const mockSellers = [
                {
                    id: 'seller-3',
                    user_id: 'user-3',
                    store_name: 'Approved Store',
                    status: 'APPROVED',
                    created_at: new Date('2024-01-01'),
                    email: 'approved@example.com',
                },
            ];

            vi.mocked(query).mockResolvedValue({ recordset: mockSellers } as any);

            const result = await getSellers('APPROVED');

            expect(result).toEqual(mockSellers);
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE sp.status = @status'),
                expect.arrayContaining([
                    expect.objectContaining({ name: 'status', value: 'APPROVED' }),
                ])
            );
        });

        it('should fetch rejected sellers', async () => {
            const mockUser = { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' };
            vi.mocked(requireAdmin).mockResolvedValue(mockUser as any);

            const mockSellers = [
                {
                    id: 'seller-4',
                    user_id: 'user-4',
                    store_name: 'Rejected Store',
                    status: 'REJECTED',
                    reject_reason: 'Incomplete documentation',
                    created_at: new Date('2024-01-01'),
                    email: 'rejected@example.com',
                },
            ];

            vi.mocked(query).mockResolvedValue({ recordset: mockSellers } as any);

            const result = await getSellers('REJECTED');

            expect(result).toEqual(mockSellers);
        });
    });

    describe('updateSellerStatus', () => {
        it('should require admin authentication', async () => {
            vi.mocked(requireAdmin).mockRejectedValue(new Error('Unauthorized'));

            await expect(
                updateSellerStatus('seller-1', 'APPROVED')
            ).rejects.toThrow('Unauthorized');

            expect(requireAdmin).toHaveBeenCalledTimes(1);
        });

        it('should approve a seller without rejection reason', async () => {
            const mockUser = { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' };
            vi.mocked(requireAdmin).mockResolvedValue(mockUser as any);

            vi.mocked(query).mockResolvedValue({ rowsAffected: [1] } as any);

            const result = await updateSellerStatus('seller-1', 'APPROVED');

            expect(result).toEqual({ success: true });
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE marketplace.SellerProfiles'),
                expect.arrayContaining([
                    expect.objectContaining({ name: 'status', value: 'APPROVED' }),
                    expect.objectContaining({ name: 'reason', value: null }),
                    expect.objectContaining({ name: 'adminId', value: 'admin-123' }),
                    expect.objectContaining({ name: 'id', value: 'seller-1' }),
                ])
            );
        });

        it('should reject a seller with rejection reason', async () => {
            const mockUser = { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' };
            vi.mocked(requireAdmin).mockResolvedValue(mockUser as any);

            vi.mocked(query).mockResolvedValue({ rowsAffected: [1] } as any);

            const rejectReason = 'Incomplete business documentation';
            const result = await updateSellerStatus('seller-2', 'REJECTED', rejectReason);

            expect(result).toEqual({ success: true });
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE marketplace.SellerProfiles'),
                expect.arrayContaining([
                    expect.objectContaining({ name: 'status', value: 'REJECTED' }),
                    expect.objectContaining({ name: 'reason', value: rejectReason }),
                    expect.objectContaining({ name: 'adminId', value: 'admin-123' }),
                    expect.objectContaining({ name: 'id', value: 'seller-2' }),
                ])
            );
        });

        it('should track who reviewed the seller', async () => {
            const mockUser = { id: 'super-admin-456', email: 'super@example.com', role: 'SUPER_ADMIN' };
            vi.mocked(requireAdmin).mockResolvedValue(mockUser as any);

            vi.mocked(query).mockResolvedValue({ rowsAffected: [1] } as any);

            await updateSellerStatus('seller-3', 'APPROVED');

            expect(query).toHaveBeenCalledWith(
                expect.anything(),
                expect.arrayContaining([
                    expect.objectContaining({ name: 'adminId', value: 'super-admin-456' }),
                ])
            );
        });

        it('should return error object on database failure', async () => {
            const mockUser = { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' };
            vi.mocked(requireAdmin).mockResolvedValue(mockUser as any);

            vi.mocked(query).mockRejectedValue(new Error('Database connection failed'));

            const result = await updateSellerStatus('seller-4', 'APPROVED');

            expect(result).toEqual({ success: false, error: 'Database error' });
        });
    });

    describe('Seller Approval Business Logic', () => {
        it('should handle approval workflow correctly', async () => {
            const mockUser = { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' };
            vi.mocked(requireAdmin).mockResolvedValue(mockUser as any);

            // Mock successful update
            vi.mocked(query).mockResolvedValue({ rowsAffected: [1] } as any);

            // Approve seller
            const result = await updateSellerStatus('seller-1', 'APPROVED');

            expect(result.success).toBe(true);

            // Verify status was updated to APPROVED
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('status = @status'),
                expect.arrayContaining([
                    expect.objectContaining({ name: 'status', value: 'APPROVED' }),
                ])
            );

            // Verify reviewed_at timestamp is set
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('reviewed_at = SYSDATETIME()'),
                expect.anything()
            );
        });

        it('should handle rejection workflow with reason', async () => {
            const mockUser = { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' };
            vi.mocked(requireAdmin).mockResolvedValue(mockUser as any);

            vi.mocked(query).mockResolvedValue({ rowsAffected: [1] } as any);

            const rejectReason = 'Seller does not meet minimum requirements';
            const result = await updateSellerStatus('seller-2', 'REJECTED', rejectReason);

            expect(result.success).toBe(true);

            // Verify status was updated to REJECTED
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('status = @status'),
                expect.arrayContaining([
                    expect.objectContaining({ name: 'status', value: 'REJECTED' }),
                ])
            );

            // Verify rejection reason was stored
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('reject_reason = @reason'),
                expect.arrayContaining([
                    expect.objectContaining({ name: 'reason', value: rejectReason }),
                ])
            );
        });
    });
});
