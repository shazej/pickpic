export default function SecuritySettingsPage() {
    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-6">Security Settings</h1>
            <div className="grid gap-6">
                <div className="border rounded-lg p-6 bg-card">
                    <h2 className="text-xl font-semibold mb-4">Password & Authentication</h2>
                    <p className="text-sm text-muted-foreground mb-4">Manage your password and two-factor authentication settings.</p>
                    <p className="text-sm italic">Password management features are coming soon.</p>
                </div>
                <div className="border rounded-lg p-6 bg-card text-destructive border-destructive/20">
                    <h2 className="text-xl font-semibold mb-4">Deactivate Account</h2>
                    <p className="text-sm mb-4">Once you deactivate your account, there is no going back. Please be certain.</p>
                    <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium opacity-50 cursor-not-allowed">Deactivate Account</button>
                </div>
            </div>
        </div>
    );
}
