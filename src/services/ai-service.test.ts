// src/services/ai-service.test.ts
import { AiService } from '@/services/ai-service';
import { aiEngine } from '@/ai/engine/service';

jest.mock('@/ai/engine/service', () => ({
    aiEngine: {
        getConfig: jest.fn(),
        chat: jest.fn()
    }
}));

describe('AiService.verifyProvider', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('returns true when provider matches and ping succeeds', async () => {
        // Mock config to return provider "gemini"
        (aiEngine.getConfig as jest.Mock).mockResolvedValue({ provider: 'gemini' });
        // Mock chat to resolve successfully
        (aiEngine.chat as jest.Mock).mockResolvedValue({ text: 'pong' });

        const result = await AiService.verifyProvider('gemini');
        expect(result).toBe(true);
        expect(aiEngine.getConfig).toHaveBeenCalledTimes(1);
        expect(aiEngine.chat).toHaveBeenCalledTimes(1);
    });

    it('returns false when provider does not match', async () => {
        (aiEngine.getConfig as jest.Mock).mockResolvedValue({ provider: 'openai' });
        const result = await AiService.verifyProvider('gemini');
        expect(result).toBe(false);
        expect(aiEngine.chat).not.toHaveBeenCalled();
    });

    it('returns false when ping throws an error', async () => {
        (aiEngine.getConfig as jest.Mock).mockResolvedValue({ provider: 'gemini' });
        (aiEngine.chat as jest.Mock).mockRejectedValue(new Error('network'));
        const result = await AiService.verifyProvider('gemini');
        expect(result).toBe(false);
    });
});
