
export interface Thread {
    id: string;
    productId: string;
    productTitle?: string;
    productImage?: string;
    participants: string[];
    lastMessage: string;
    lastMessageAt: string;
    participantName?: string;
}

export interface Message {
    id: string;
    senderId: string;
    text: string; // Mapped from 'content' in API
    timestamp: string;
}

export const messageService = {
    async createThread(sellerId: string, productId?: string): Promise<string> {
        const res = await fetch('/api/chat/threads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerId, productId })
        });
        if (!res.ok) throw new Error('Failed to create thread');
        const data = await res.json();
        return data.id;
    },

    async getThreads(): Promise<Thread[]> {
        const res = await fetch('/api/chat/threads');
        if (!res.ok) throw new Error('Failed to fetch threads');
        const data = await res.json();
        return data.threads;
    },

    async getThread(threadId: string): Promise<Thread | undefined> {
        const threads = await this.getThreads();
        return threads.find(t => t.id === threadId);
    },

    async getMessages(threadId: string): Promise<Message[]> {
        const res = await fetch(`/api/chat/threads/${threadId}/messages`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        // API returns { messages: [{id, senderId, content, timestamp}] }
        // We map 'content' to 'text' for frontend compatibility
        return data.messages.map((m: any) => ({
            id: m.id,
            senderId: m.senderId,
            text: m.content,
            timestamp: m.timestamp
        }));
    },

    async sendMessage(threadId: string, text: string): Promise<Message> {
        const res = await fetch(`/api/chat/threads/${threadId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
        });
        if (!res.ok) throw new Error('Failed to send message');

        // Optimistic return or we could refetch
        // Return a mock message object consistent with the one we just sent
        return {
            id: Date.now().toString(), // Temporary ID
            senderId: 'me', // Assumed
            text: text,
            timestamp: new Date().toISOString()
        };
    }
};
