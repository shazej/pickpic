"use client";

import { useEffect, useState } from "react";
import {
    Search,
    MoreHorizontal,
    ShieldBan,
    CheckCircle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming exist
import { Input } from "@/components/ui/input"; // Assuming exist
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { toast } = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({ page: page.toString(), q: search });
            const res = await fetch(`/api/admin/users?${query}`);
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Failed to load users" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchUsers();
        }, 300); // Debounce search
        return () => clearTimeout(timeout);
    }, [search, page]);

    const handleAction = async (userId: string, action: 'ban' | 'unban') => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action })
            });
            if (res.ok) {
                toast({ title: `User ${action === 'ban' ? 'banned' : 'unbanned'} successfully` });
                fetchUsers(); // Refresh
            } else {
                throw new Error('Action failed');
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Action failed" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search users..."
                            className="pl-8 w-[250px]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase">
                            <tr>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Roles</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Joined</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center pt-10 pb-10">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex flex-col">
                                                <span>{user.display_name || 'No Name'}</span>
                                                <span className="text-xs text-gray-500">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.roles ? (
                                                <div className="flex gap-1">
                                                    {user.roles.split(',').map((r: string) => (
                                                        <span key={r} className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs">
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_active ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                    Banned
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {user.is_active ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleAction(user.id, 'ban')}
                                                >
                                                    <ShieldBan className="h-4 w-4 mr-1" />
                                                    Ban
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleAction(user.id, 'unban')}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Unban
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls could fit here */}
            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                >
                    Previous
                </Button>
                <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
