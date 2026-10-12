import { test, expect } from '@playwright/test';

test.describe('MatchPulse User Flow', () => {
  test('Complete flow: fill form → submit → view result → copy', async ({ page }) => {
    await page.goto('/');

    // Check initial load: don't show an example result before a real analysis.
    await expect(page.locator('h1')).toContainText('MatchPulse');
    await expect(page.locator('[data-testid="result-card"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '42 off 33' })).toBeVisible();

    // Fill form
    await page.fill('[name="battingTeam"]', 'India');
    await page.fill('[name="bowlingTeam"]', 'Australia');
    await page.fill('[name="score"]', '153');
    await page.fill('[name="wickets"]', '5');
    await page.fill('[name="oversCompleted"]', '14.3');
    await page.fill('[name="totalOvers"]', '20');
    await page.fill('[name="target"]', '195');

    // Submit
    await page.getByRole('button', { name: 'Explain this match' }).click();

    // Wait for result
    await expect(page.locator('[data-testid="result-card"]')).toBeVisible({ timeout: 10000 });

    // Check result card content
    await expect(page.locator('[data-testid="situation"]')).toBeVisible();
    await expect(page.locator('[data-testid="key-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="win-probability"]')).toBeVisible();

    // Copy to clipboard
    await page.click('button:has-text("Copy")');
    await expect(page.locator('text=Copied to clipboard!')).toBeVisible({ timeout: 3000 });
  });

  test('Validation: shows error for invalid input', async ({ page }) => {
    await page.goto('/');

    await page.fill('[name="wickets"]', '15'); // Invalid
    await page.fill('[name="oversCompleted"]', '25'); // Invalid
    await page.fill('[name="totalOvers"]', '20');

    await expect(page.locator('text=/Wickets.*0-10/')).toBeVisible();
    await expect(page.locator('text=/Overs completed.*total overs/')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Explain this match' })).toBeDisabled();
  });

  test('Language toggle switches language', async ({ page }) => {
    await page.goto('/');

    // Check default is Hinglish
    await expect(page.locator('[data-testid="language-toggle"] input[value="hinglish"]')).toBeChecked();

    // Switch to English
    await page.click('[data-testid="language-toggle"] label:has-text("English")');
    await expect(page.locator('[data-testid="language-toggle"] input[value="english"]')).toBeChecked();

    // Check persistence on refresh
    await page.reload();
    await expect(page.locator('[data-testid="language-toggle"] input[value="english"]')).toBeChecked();
  });
});
