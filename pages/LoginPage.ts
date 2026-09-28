import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly welcomeSignInBtn: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly signOutBtn: Locator;
  readonly pageHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeSignInBtn = page.locator('#signin-button, button:has-text("SIGN IN")').first();
    this.emailInput = page.locator('input#username, input[name="username"]').first();
    this.passwordInput = page.locator('input#password, input[name="password"]').first();
    this.submitButton = page.locator('button[type="submit"], button[name="action"][value="default"]').first();
    this.signOutBtn = page.locator('#btn_signOut, button:has-text("SIGN OUT")').first();
    this.pageHeading = page.locator('h1, h2').first();
  }

  async navigate(): Promise<void> {
    await this.page.goto('/welcome', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000);
  }

  async verifyLoginPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/welcome|auth0\.com/);
  }

  async login(username?: string, password?: string): Promise<void> {
    if (!username || !password || username.trim().length === 0 || password.trim().length === 0) {
      console.log('[AUTH FAILED] Login could not be completed.');
      throw new Error('[AUTH FAILED] Credentials not provided in environment variables.');
    }

    try {
      // 0. Dismiss cookie banner if present
      const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
      if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cookieBtn.click().catch(() => {});
        await this.page.waitForTimeout(500);
      }

      // 1. Wait for navigation to /welcome or Auth0 and click SIGN IN button if on /welcome
      await this.page.waitForURL(/welcome|auth0\.com/, { timeout: 15000 }).catch(() => {});
      if (await this.welcomeSignInBtn.isVisible({ timeout: 5000 }).catch(() => false) || this.page.url().includes('welcome')) {
        await expect(this.welcomeSignInBtn).toBeVisible({ timeout: 15000 });
        await this.welcomeSignInBtn.click({ force: true });
        await this.page.waitForURL(/auth0\.com/, { timeout: 30000 });
      }

      // 2. Wait for Auth0 login inputs to appear
      await expect(this.emailInput).toBeVisible({ timeout: 20000 });
      await this.emailInput.fill(username);
      await this.passwordInput.fill(password);

      // 3. Submit credentials via Enter or submit button
      await this.passwordInput.press('Enter');

      // 4. Verify post-login session
      await this.verifySuccessfulLogin();
    } catch (err: any) {
      console.log('[AUTH FAILED] Login could not be completed.');
      throw new Error(`[AUTH FAILED] Login could not be completed: ${err?.message || err}`);
    }
  }

  async verifySuccessfulLogin(): Promise<void> {
    // 1. Wait until redirected back from Auth0 to Carvel domain
    await this.page.waitForURL((url) => !url.href.includes('auth0.com') && !url.href.includes('welcome'), { timeout: 30000 });
    await this.page.waitForTimeout(2000);

    // 2. Check if intermittent 'SOMETHING WENT WRONG' screen is displayed
    const tryAgainBtn = this.page.locator('#btn_try_again, button:has-text("TRY AGAIN")').first();
    if (await tryAgainBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('[INFO] Post-login system hiccup detected. Clicking TRY AGAIN to recover...');
      await tryAgainBtn.click();
      await this.page.waitForTimeout(3000);
    }

    // 3. Dismiss cookie banner if visible
    const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }

    // 4. Verify authenticated indicators with auto-waiting
    const authIndicator = this.page.locator('#link_auth_Profile, button#btn_startorder, a[href*="personal-info"]').first();
    try {
      await expect(authIndicator).toBeVisible({ timeout: 25000 });
      console.log('[AUTH SUCCESS] User successfully authenticated with .env credentials.');
    } catch (err: any) {
      console.log('[AUTH FAILED] Login could not be completed.');
      throw new Error('[AUTH FAILED] Post-login authentication state verification failed.');
    }
  }

  async continueAsGuest(): Promise<void> {
    const guestBtn = this.page.locator('#txt_guest_account, button:has-text("Continue as Guest")').first();
    await expect(guestBtn).toBeVisible({ timeout: 15000 });
    await guestBtn.click();
    await this.page.waitForTimeout(3000);
    if (this.page.url().includes('welcome')) {
      await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    }
    await this.page.waitForLoadState('domcontentloaded');
  }
}
