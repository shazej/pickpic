export default function BlogPage() {
    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-3xl font-bold mb-6">Blog</h1>
            <p className="text-lg text-muted-foreground mb-8">
                Stay updated with the latest news, tips, and insights from the sale chat community.
            </p>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="border rounded-lg p-6 bg-card">
                    <h2 className="text-xl font-semibold mb-2">Coming Soon: Interactive Search</h2>
                    <p className="text-sm text-muted-foreground mb-4">January 4, 2026</p>
                    <p className="mb-4">We are working on a revolutionary new way to search for products using voice and video...</p>
                    <span className="text-primary font-medium">Read more &rarr;</span>
                </div>
            </div>
        </div>
    );
}
