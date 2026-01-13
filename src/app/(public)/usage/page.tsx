
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function UsagePage() {
    let usage = [];
    let error = null;

    try {
        const result = await query(`
            SELECT TOP 50 id, user_id, feature_name, created_at
            FROM billing.usage_events
            ORDER BY created_at DESC
        `);
        usage = result.recordset;
    } catch (e: any) {
        error = e.message;
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-4">Token Usage Dashboard</h1>

            {error && <div className="bg-red-100 p-4 mb-4 text-red-800">Error: {error}</div>}

            <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {usage.map((row: any) => (
                            <tr key={row.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(row.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {row.feature_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {row.user_id || 'Anonymous'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
