import { Metadata } from 'next';
import { TutorialHero } from '@/components/tutorial/tutorial-hero';
import { TutorialSection } from '@/components/tutorial/tutorial-section';
import { TutorialStep } from '@/components/tutorial/tutorial-step';
import { TutorialTOC } from '@/components/tutorial/table-of-contents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    UserPlus, Search, Upload, SlidersHorizontal, Image as ImageIcon,
    Info, MessageCircle, RefreshCw, Camera, Sparkles, Edit, Star, ShieldCheck,
    Zap, CreditCard, LifeBuoy, FileText, Heart, ShieldAlert
} from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/lib/contact';

export const metadata: Metadata = {
    title: 'How to Use kechiki | Tutorial',
    description: 'A step-by-step guide to buying and selling on kechiki using AI visual search.',
};

const SECTIONS = [
    { id: 'account', title: '1. Create an Account' },
    { id: 'search', title: '2. Find Products' },
    { id: 'details', title: '3. Product Details' },
    { id: 'message', title: '4. Message Seller' },
    { id: 'favorites', title: '5. Favorites' },
    { id: 'sell', title: '6. Sell a Product' },
    { id: 'reviews', title: '7. Reviews & Trust' },
    { id: 'plans', title: '8. Usage & Plans' },
    { id: 'support', title: '9. Help & Support' },
    { id: 'safety', title: '10. Safety Tips' },
];

export default function TutorialPage() {
    return (
        <div className="container mx-auto px-4 pb-24">
            <TutorialHero
                title="How to Use kechiki"
                subtitle="A quick guide to buying and selling with AI-powered visual search"
                ctaText="Start Exploring"
                ctaHref="/search"
            />

            {/* Video Tutorial Section */}
            <section className="mb-20 max-w-5xl mx-auto">
                <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative aspect-video group">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors z-10">
                        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1"></div>
                        </div>
                    </div>
                    {/* Placeholder for actual video embed */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-60"></div>
                    <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end">
                        <div>
                            <Badge className="mb-2 bg-primary/20 text-primary border-primary/30 backdrop-blur-sm">Platform Overview</Badge>
                            <h2 className="text-2xl font-bold text-white mb-1">Getting Started with kechiki</h2>
                            <p className="text-white/70 text-sm">Watch this 2-minute video to see how visual search works in action.</p>
                        </div>
                        <div className="text-white/60 text-xs font-mono">02:14 / 02:30</div>
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex gap-3 items-start">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary mt-1">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">AI Magic</h4>
                            <p className="text-xs text-muted-foreground">Discover how our AI identifies objects instantly.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary mt-1">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">Safe Trading</h4>
                            <p className="text-xs text-muted-foreground">Learn about our secure messaging and reputation system.</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary mt-1">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">Quick Sell</h4>
                            <p className="text-xs text-muted-foreground">Set up your shop and list items in under 60 seconds.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid lg:grid-cols-[1fr_250px] gap-12 max-w-6xl mx-auto">
                <main>
                    {/* 1. Account */}
                    <TutorialSection id="account" title="1. Getting Started">
                        <TutorialStep
                            stepNumber={1}
                            title="Sign Up or Log In"
                            description="To access all features like messaging and selling, you need an account. Click 'Sign In' at the top right."
                            icon={UserPlus}
                        >
                            <div className="flex gap-4 mt-2">
                                <Button variant="outline" asChild size="sm">
                                    <Link href="/register">Sign Up</Link>
                                </Button>
                                <Button variant="ghost" asChild size="sm">
                                    <Link href="/login">Log In</Link>
                                </Button>
                            </div>
                        </TutorialStep>
                        <TutorialStep
                            stepNumber={2}
                            title="One Account, Two Roles"
                            description="Your single account allows you to both buy products and sell your own items. No separate accounts needed."
                            icon={RefreshCw}
                        />
                    </TutorialSection>

                    {/* 2. Search */}
                    <TutorialSection id="search" title="2. Finding Products">
                        <TutorialStep
                            stepNumber={1}
                            title="Smart Text Search"
                            description="Use the search bar to find items by name, brand, or description. Our search is optimized for natural language."
                            icon={Search}
                        />
                        <TutorialStep
                            stepNumber={2}
                            title="AI Visual Search"
                            description="Upload a photo of an item you like, and our AI will find similar products listed on the marketplace."
                            icon={Upload}
                        >
                            <Button size="sm" variant="secondary" asChild className="mt-2">
                                <Link href="/search?mode=visual">Try Visual Search</Link>
                            </Button>
                        </TutorialStep>
                        <TutorialStep
                            stepNumber={3}
                            title="Advanced Filters"
                            description="Narrow down results by price range, category, condition, and distance to find exactly what you need."
                            icon={SlidersHorizontal}
                        />
                    </TutorialSection>

                    {/* 3. Details */}
                    <TutorialSection id="details" title="3. Product Details">
                        <TutorialStep
                            stepNumber={1}
                            title="Comprehensive Gallery"
                            description="View high-quality images of the product from multiple angles to assess its condition."
                            icon={ImageIcon}
                        />
                        <TutorialStep
                            stepNumber={2}
                            title="Vision Chat"
                            description="Have questions? Use our AI Vision Chat to ask specific questions about the product image, like 'Is there a scratch on the lens?'"
                            icon={Sparkles}
                        />
                        <TutorialStep
                            stepNumber={3}
                            title="Seller Information"
                            description="Check the seller's profile, ratings, and location to ensure a safe transaction."
                            icon={Info}
                        />
                    </TutorialSection>

                    {/* 4. Message */}
                    <TutorialSection id="message" title="4. Messaging">
                        <TutorialStep
                            stepNumber={1}
                            title="Direct Chat"
                            description="Click 'Message Seller' on any product page to start a private conversation. Discuss price, shipping, or ask for more photos."
                            icon={MessageCircle}
                        />
                        <TutorialStep
                            stepNumber={2}
                            title="Inbox & Notifications"
                            description="Access all your conversations in the 'Messages' tab. You'll receive real-time updates for new messages."
                            icon={FileText}
                        />
                    </TutorialSection>

                    {/* 5. Favorites */}
                    <TutorialSection id="favorites" title="5. Favorites & Shortlists">
                        <TutorialStep
                            stepNumber={1}
                            title="Save for Later"
                            description="Click the heart icon on any product to save it to your favorites. You can access them anytime from your profile."
                            icon={Heart}
                        />
                        <TutorialStep
                            stepNumber={2}
                            title="Compare Items"
                            description="Build a shortlist of items you are considering to easily compare prices and conditions."
                            icon={Star}
                        />
                    </TutorialSection>

                    {/* 6. Sell */}
                    <TutorialSection id="sell" title="6. Selling a Product">
                        <TutorialStep
                            stepNumber={1}
                            title="Seller Profile"
                            description="Set up your store profile with a photo and bio to build trust with buyers."
                            icon={RefreshCw}
                        />
                        <TutorialStep
                            stepNumber={2}
                            title="Upload Photos"
                            description="Start by uploading clear photos of your item. Good lighting helps our AI analyze your product better."
                            icon={Camera}
                        />
                        <TutorialStep
                            stepNumber={3}
                            title="AI Smart Listing"
                            description="kechiki AI analyzes your photos and automatically generates a title, description, and attributes for you."
                            icon={Sparkles}
                        />
                        <TutorialStep
                            stepNumber={4}
                            title="Review & Publish"
                            description="Edit the generated details if needed, set your price, and publish your listing instantly."
                            icon={Edit}
                        >
                            <Button size="sm" asChild className="mt-2 text-primary-foreground">
                                <Link href="/sell/new">List an Item</Link>
                            </Button>
                        </TutorialStep>
                    </TutorialSection>

                    {/* 7. Reviews */}
                    <TutorialSection id="reviews" title="7. Reviews & Trust">
                        <TutorialStep
                            stepNumber={1}
                            title="Rate Your Experience"
                            description="After a transaction, leave a review for the buyer or seller. Honest feedback keeps our community safe."
                            icon={Star}
                        />
                        <TutorialStep
                            stepNumber={2}
                            title="Member Reputation"
                            description="Look for the 'Verified' badge and high star ratings when choosing who to do business with."
                            icon={ShieldCheck}
                        />
                    </TutorialSection>

                    {/* 8. Usage */}
                    <TutorialSection id="plans" title="8. Usage & Plans">
                        <TutorialStep
                            stepNumber={1}
                            title="Free Tier"
                            description="Get started for free with generous daily limits for searching and listing items."
                            icon={Zap}
                        />
                        <TutorialStep
                            stepNumber={2}
                            title="Premium Features"
                            description="Upgrade to access unlimited Visual Search, advanced AI analytics, and promoted listings."
                            icon={CreditCard}
                        >
                            <Button variant="link" asChild className="p-0 h-auto mt-1">
                                <Link href="/account/billing">View Plans</Link>
                            </Button>
                        </TutorialStep>
                    </TutorialSection>

                    {/* 9. Support */}
                    <TutorialSection id="support" title="9. Help & Support">
                        <TutorialStep
                            stepNumber={1}
                            title="Frequently Asked Questions"
                            description="Find quick answers to common questions about shipping, payments, and account management."
                            icon={FileText}
                        />
                        <TutorialStep
                            stepNumber={2}
                            title="Contact Support"
                            description={`Need help? Open a support ticket and our team will assist you within 24 hours. Email us at ${SUPPORT_EMAIL}.`}
                            icon={LifeBuoy}
                        >
                            <div className="flex gap-4 mt-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/faq">Read FAQs</Link>
                                </Button>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/support">Open Ticket</Link>
                                </Button>
                            </div>
                        </TutorialStep>
                    </TutorialSection>

                    {/* 10. Safety */}
                    <TutorialSection id="safety" title="10. Safety Tips">
                        <TutorialStep
                            stepNumber={1}
                            title="Meet in Public"
                            description="When meeting locally to exchange items, always choose a busy, public location like a mall or coffee shop."
                            icon={ShieldCheck}
                        />
                        <TutorialStep
                            stepNumber={2}
                            title="Avoid Scams"
                            description="Be wary of users asking for payment outside of the platform or requesting shipping before payment."
                            icon={ShieldAlert}
                        />
                        <TutorialStep
                            stepNumber={3}
                            title="Report Abuse"
                            description="If you see suspicious activity, use the 'Report' button on the user's profile or listing to alert our team."
                            icon={LifeBuoy}
                        />
                    </TutorialSection>

                    {/* FAQ Teaser */}
                    <div className="bg-muted/30 rounded-xl p-8 my-16">
                        <h3 className="text-2xl font-bold mb-6">Common Questions</h3>
                        <div className="space-y-4 mb-6">
                            <details className="group">
                                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                                    Is kechiki free to use?
                                    <span className="transition group-open:rotate-180">▼</span>
                                </summary>
                                <p className="text-muted-foreground mt-2 text-sm">Yes! Browsing and basic selling are completely free. We also offer premium plans for power users.</p>
                            </details>
                            <div className="h-px bg-border" />
                            <details className="group">
                                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                                    How does Visual Search work?
                                    <span className="transition group-open:rotate-180">▼</span>
                                </summary>
                                <p className="text-muted-foreground mt-2 text-sm">Simply upload an image, and our AI analyzes shapes, colors, and objects to find matching items in our catalog.</p>
                            </details>
                            <div className="h-px bg-border" />
                        </div>
                        <Button variant="secondary" asChild className="w-full">
                            <Link href="/faq">View All FAQs</Link>
                        </Button>
                    </div>

                    {/* Final CTA */}
                    <section className="text-center bg-primary text-primary-foreground rounded-2xl p-12 space-y-6">
                        <h2 className="text-3xl font-bold">Ready to try kechiki?</h2>
                        <p className="text-primary-foreground/90 max-w-md mx-auto text-lg">
                            Join thousands of users buying and selling with the power of AI.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button size="lg" variant="secondary" asChild className="font-semibold text-lg px-8">
                                <Link href="/search">Start Searching</Link>
                            </Button>
                            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary font-semibold text-lg px-8" asChild>
                                <Link href="/sell">Start Selling</Link>
                            </Button>
                        </div>
                    </section>

                </main>

                {/* Sidebar TOC */}
                <aside className="hidden lg:block">
                    <TutorialTOC sections={SECTIONS} />
                </aside>
            </div>
        </div>
    );
}
