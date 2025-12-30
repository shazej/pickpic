
import { AccountSidebar } from "@/components/account/account-sidebar";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className="container py-8 max-w-6xl">
                <div className="flex flex-col md:flex-row gap-8">
                    <AccountSidebar />
                    <div className="flex-1">
                        {children}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
