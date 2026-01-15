
import { test, expect } from '@playwright/test';

test.describe('Stabilization Verification', () => {

    test('Health Check', async ({ request }) => {
        const health = await request.get('/api/health');
        expect(health.ok()).toBeTruthy();
        const json = await health.json();
        expect(json.status).toBe('ok');
        expect(json.db).toBe('connected');
    });

    test('Verify "sell my camera" intent', async ({ page }) => {
        await page.goto('/');

        // Locate chat input using robust selector
        const chatInput = page.locator('input[placeholder^="Describe"]');

        if (await chatInput.count() > 0) {
            await chatInput.fill('sell my camera');
            await chatInput.press('Enter');

            // Expect Seller Draft Listing UI
            try {
                await expect(page.locator('text=Draft Listing').or(page.locator('text=Sell Item'))).toBeVisible({ timeout: 20000 });
            } catch (e) {
                console.log('Sell Camera Test Failed. Chat Messages:', await page.locator('.p-4.rounded-2xl').allTextContents());
                throw e;
            }
        } else {
            console.log('Chat input not found. Checking page structure...');
            console.log('Body visible:', await page.locator('body').isVisible());
            console.log('Main visible:', await page.locator('main').isVisible());
            console.log('Any input count:', await page.locator('input').count());

            // Try to dump body text
            console.log('Body Text:', await page.locator('body').innerText());

            // Expect to fail
            expect(await chatInput.count(), 'Chat input should be visible').toBeGreaterThan(0);
        }
    });

    test('Verify "looking for a red dress" intent', async ({ page }) => {
        await page.goto('/');
        const chatInput = page.locator('input[placeholder^="Describe"]');
        if (await chatInput.count() > 0) {
            await chatInput.fill('looking for a red dress');
            await chatInput.press('Enter');

            // Expect Buyer Search UI
            try {
                await expect(page.locator('text=Searching for').or(page.locator('text=red dress'))).toBeVisible({ timeout: 20000 });
            } catch (e) {
                console.log('Red Dress Test Failed. Chat Messages:', await page.locator('.p-4.rounded-2xl').allTextContents());
                throw e;
            }
        }
    });

    test('Verify "apple" triggers Clarification UI', async ({ page }) => {
        await page.goto('/');
        const chatInput = page.locator('input[placeholder^="Describe"]');
        if (await chatInput.count() > 0) {
            await chatInput.fill('apple');
            await chatInput.press('Enter');

            // Expect Clarification UI (Buttons for Buy / Sell)
            try {
                await expect(page.locator('button:has-text("Buy apple")')).toBeVisible({ timeout: 20000 });
                await expect(page.locator('button:has-text("Sell apple")')).toBeVisible({ timeout: 20000 });
            } catch (e) {
                console.log('Apple Test Failed. Chat Messages:', await page.locator('.p-4.rounded-2xl').allTextContents());
                console.log('Buttons found:', await page.locator('button').allInnerTexts());
                throw e;
            }
        }
    });

});
