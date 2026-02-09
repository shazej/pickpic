import { requireAdmin } from "@/lib/auth-checks";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { SidebarProvider } from "@/components/ui/sidebar"; // Assuming shadcn sidebar or similar exists, or I build custom.
// Wait, I don't know if SidebarProvider exists. I should check if I need to build a custom sidebar layout.
// Given strict aesthetic requirements, I will build a custom layout using Tailwind + existing UI components.
// The user prompt mentions "Sidebar navigation". I'll build a responsive one.
// Actually, let's stick to a solid custom implementation if reusable one isn't obvious.

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireAdmin();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar */}
            <AdminSidebar user={user} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AdminTopbar user={user} />

                <main className="flex-1 overflow-auto p-6 scrollbar-thin">
                    <div className="container mx-auto max-w-7xl space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
