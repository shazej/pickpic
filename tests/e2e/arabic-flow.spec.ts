import { test, expect } from '@playwright/test';

test.describe('Arabic Localization & RTL', () => {
    test('should default to Arabic and RTL', async ({ page }) => {
        await page.goto('/');

        // Check HTML dir attribute
        const html = page.locator('html');
        const dir = await html.getAttribute('dir');
        const lang = await html.getAttribute('lang');
        console.log(`Debug: HTML dir="${dir}", lang="${lang}"`);
        await expect(html).toHaveAttribute('dir', 'rtl');
        await expect(html).toHaveAttribute('lang', 'ar');

        // Check greeting in Arabic
        const greeting = page.locator('.bg-purple-500').first().locator('xpath=..').locator('.text-sm');
        await expect(greeting).toContainText('مرحباً');
    });

    test('should toggle to English and LTR', async ({ page }) => {
        await page.goto('/');

        // Find language toggle (Globe icon usually)
        const toggle = page.locator('button:has(.lucide-globe)');
        await expect(toggle).toBeVisible();
        await toggle.click();
        console.log('Clicked toggle');

        // Wait for state update?
        await page.waitForTimeout(500);

        // Check HTML dir attribute
        const html = page.locator('html');
        const dir = await html.getAttribute('dir');
        console.log('After toggle, dir:', dir);

        await expect(html).toHaveAttribute('dir', 'ltr');
        await expect(html).toHaveAttribute('lang', 'en');

        // Check toggle text changed to "العربية" (meaning switch back to Arabic)
        await expect(toggle).toContainText('العربية');
    });

    test('should detect Arabic input and maintain RTL', async ({ page }) => {
        await page.goto('/');
        // Clear storage to ensure no saved preference? (Default is Ar anyway)

        // Type Arabic message
        const input = page.locator('input[placeholder*="صف ما تريد"]'); // Use Arabic placeholder
        await input.fill('أريد شراء كاميرا');
        await page.keyboard.press('Enter');

        // Expect bot reply in Arabic
        const lastMessage = page.locator('.bg-purple-500').last().locator('xpath=..').locator('.text-sm');
        // Wait for response
        await expect(lastMessage).not.toContainText('Analysis', { timeout: 10000 }); // Analyzing msg
        await expect(lastMessage).toContainText(/مسودة|نتائج|تأكيد/); // Generic arabic keywords
    });

    test('should detect English input and switch to English response', async ({ page }) => {
        // If we start fresh, default is AR.
        await page.goto('/');

        // Type English message
        const input = page.locator('input[type="text"]');
        await input.fill('I want to buy a camera');
        await page.keyboard.press('Enter');

        // The LanguageContext detection logic runs.
        // Expect bot reply in English
        const lastMessage = page.locator('.bg-purple-500').last().locator('xpath=..').locator('.text-sm');
        await expect(lastMessage).toContainText(/found|results|details/);

        // Note: The UI might switch to "en" immediately upon sending?
        // Let's check html lang
        const html = page.locator('html');
        await expect(html).toHaveAttribute('lang', 'en');
    });
});
