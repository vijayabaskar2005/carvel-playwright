import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly pageHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
    this.passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    this.submitButton = page.locator('button[type="submit"], button:has-text("SIGN IN"), button:has-text("LOG IN")').first();
    this.pageHeading = page.locator('h1, h2').first();
  }

  async navigate(): Promise<void> {
    await this.page.goto('/welcome', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000);
  }

  async login(username?: string, password?: string): Promise<void> {
    if (!username || !password) {
      console.log('[INFO] Login skipped: credentials not provided or missing from environment.');
      return;
    }
    await this.emailInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForTimeout(3000);
  }

  async verifyLoginPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/welcome/);
  }
}
