import { test, expect } from '@playwright/test';

test.describe('PickPic Smoke Tests', () => {

    // 1. Buyer Flow
    test('Buyer: Register, Search, and View Product', async ({ page }) => {
        // A. Register
        await page.goto('/register');
        await page.fill('input[name="displayName"]', 'Test Buyer');
        await page.fill('input[name="email"]', `buyer_${Date.now()}@example.com`);
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard'); // Assume redirect

        // B. Search (Text)
        await page.goto('/');
        await page.fill('input[type="search"]', 'Vintage Lamp');
        await page.press('input[type="search"]', 'Enter');
        await expect(page.locator('.product-grid')).toBeVisible();

        // C. View Product (First item)
        await page.click('.product-card:first-child');
        await expect(page.locator('h1.product-title')).toBeVisible();

        // D. Chat
        await page.click('button:has-text("Message Seller")');
        await expect(page.locator('.chat-window')).toBeVisible();
    });

    // 2. Seller Flow
    test('Seller: Create Listing', async ({ page }) => {
        // Login as Seller (seeded)
        await page.goto('/login');
        await page.fill('input[name="email"]', 'seller@example.com');
        await page.fill('input[name="password"]', 'SellerPass123!');
        await page.click('button[type="submit"]');

        // Create Listing
        await page.goto('/seller/listings/new');
        await page.fill('input[name="title"]', 'Test Product ' + Date.now());
        await page.fill('textarea[name="description"]', 'A test product description.');
        await page.fill('input[name="price"]', '99.99');

        // Publish
        await page.click('button:has-text("Publish")');
        await expect(page.locator('.toast-success')).toHaveText(/published/i);
    });

    // 3. Admin Flow
    test('Admin: Moderate Listing', async ({ page }) => {
        // Login as Admin
        await page.goto('/login');
        await page.fill('input[name="email"]', 'admin@pickpic.com');
        await page.fill('input[name="password"]', 'AdminSecret1!');
        await page.click('button[type="submit"]');

        // Approve
        await page.goto('/admin/moderation');
        await expect(page.locator('table.listings')).toBeVisible();
        await page.click('button.approve-btn:first-child');
        await expect(page.locator('.toast-success')).toBeVisible();
    });
});
