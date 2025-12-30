
import { UnifiedChat } from "@/components/chat/unified-chat";

export default function Home() {
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <UnifiedChat />
        </div>
    );
}
