import { test, expect } from '@playwright/test';

test.describe('Generate Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Clerk authentication
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
          },
        }),
      });
    });

    // Mock OpenAI API
    await page.route('**/api/ideas', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          ideas: [
            '10 Ways to Boost Your Marketing Agency Growth',
            'The Ultimate Guide to Scaling Your Agency',
            'How to Double Your Agency Revenue in 90 Days',
          ],
        }),
      });
    });

    await page.route('**/api/article', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          html: '<article><h1>Test Article</h1><p>This is a test article content.</p></article>',
        }),
      });
    });

    await page.route('**/api/thumbnail', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          url: 'https://example.com/test-thumbnail.jpg',
        }),
      });
    });
  });

  test('should generate blog post ideas', async ({ page }) => {
    await page.goto('/generate');

    // Fill in the form
    await page.fill('input[name="topic"]', 'Marketing Agency Growth');
    await page.selectOption('select[name="industry"]', 'Marketing');

    // Click generate button
    await page.click('button[type="submit"]');

    // Wait for ideas to appear
    await page.waitForSelector('.idea-card');

    // Verify ideas are displayed
    const ideas = await page.$$('.idea-card');
    expect(ideas.length).toBe(3);
  });

  test('should generate article when idea is selected', async ({ page }) => {
    await page.goto('/generate');

    // Fill in the form
    await page.fill('input[name="topic"]', 'Marketing Agency Growth');
    await page.selectOption('select[name="industry"]', 'Marketing');

    // Click generate button
    await page.click('button[type="submit"]');

    // Wait for ideas to appear and click the first one
    await page.waitForSelector('.idea-card');
    await page.click('.idea-card:first-child');

    // Wait for article to be generated
    await page.waitForSelector('.article-preview');

    // Verify article content
    const articleContent = await page.textContent('.article-preview');
    expect(articleContent).toContain('Test Article');
  });

  test('should show error message for invalid input', async ({ page }) => {
    await page.goto('/generate');

    // Try to submit without filling the form
    await page.click('button[type="submit"]');

    // Verify error message
    const errorMessage = await page.textContent('.error-message');
    expect(errorMessage).toContain('Please fill in all required fields');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/ideas', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/generate');

    // Fill in the form
    await page.fill('input[name="topic"]', 'Marketing Agency Growth');
    await page.selectOption('select[name="industry"]', 'Marketing');

    // Click generate button
    await page.click('button[type="submit"]');

    // Verify error message
    const errorMessage = await page.textContent('.error-message');
    expect(errorMessage).toContain('Failed to generate ideas');
  });
}); 