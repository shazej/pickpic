
export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <div className="prose dark:prose-invert max-w-none">
                <p className="lead">Effective Date: January 10, 2026</p>

                <h2>1. Introduction</h2>
                <p>Welcome to Kechiki ("we," "us," or "our"). We are committed to protecting your personal information and your right to privacy.</p>

                <h2>2. Information We Collect</h2>
                <p>We collect personal information that you voluntarily provide to us when you register on the Service, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Service, or otherwise when you contact us.</p>
                <ul>
                    <li><strong>Personal Data:</strong> Name, email address, phone number, and payment information (processed via Stripe).</li>
                    <li><strong>Usage Data:</strong> AI interaction logs, search queries, and device information.</li>
                </ul>

                <h2>3. How We Use Your Information</h2>
                <p>We use your information to operate, maintain, and improve our services, process payments, and communicate with you.</p>

                <h2>4. Data Sharing</h2>
                <p>We do not share your personal information with third parties except as necessary to provide the Service (e.g., Stripe for payments, OpenAI/Google for AI processing) or as required by law.</p>

                <h2>5. AI Processing</h2>
                <p><strong>Disclaimer:</strong> User inputs are sent to third-party AI providers (OpenAI, Google) for processing. Do not submit sensitive personal information (PII) or confidential data in AI prompts.</p>

                <h2>6. Your Rights</h2>
                <p>You may request access to, correction of, or deletion of your personal data by contacting us at support@kechiki.com.</p>
            </div>
        </div>
    );
}
