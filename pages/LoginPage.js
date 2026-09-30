const { expect } = require('@playwright/test');
const { log_step } = require('../utils/logger');

class LoginPage {
  constructor(page) {
    this.page = page;
    this.welcomeSignInBtn = page.locator('#signin-button, button:has-text("SIGN IN")').first();
    this.emailInput = page.locator('input#username, input[name="username"]').first();
    this.passwordInput = page.locator('input#password, input[name="password"]').first();
    this.submitButton = page.locator('button[type="submit"], button[name="action"][value="default"]').first();
    this.signOutBtn = page.locator('#btn_signOut, button:has-text("SIGN OUT")').first();
    this.pageHeading = page.locator('h1, h2').first();
  }

  async navigate() {
    log_step('Navigating to Welcome / Sign In page');
    await this.page.goto('/welcome', { waitUntil: 'domcontentloaded' });
  }

  async verifyLoginPageLoaded() {
    await expect(this.page).toHaveURL(/welcome|auth0\.com/);
  }

  async login(username, password) {
    if (!username || !password || username.trim().length === 0 || password.trim().length === 0) {
      throw new Error('[AUTH FAILED] Credentials not provided in environment variables.');
    }

    log_step('Starting Auth0 login authentication flow');

    try {
      // Dismiss cookie banner if present
      const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
      if (await cookieBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await cookieBtn.click().catch(() => {});
      }

      // Navigate to Auth0 if on /welcome
      await this.page.waitForURL(/welcome|auth0\.com/, { timeout: 15000 }).catch(() => {});
      if (await this.welcomeSignInBtn.isVisible({ timeout: 5000 }).catch(() => false) || this.page.url().includes('welcome')) {
        await expect(this.welcomeSignInBtn).toBeVisible({ timeout: 15000 });
        await this.welcomeSignInBtn.click({ force: true });
        await this.page.waitForURL(/auth0\.com/, { timeout: 30000 });
      }

      // Fill Auth0 credentials
      log_step('Filling credentials in Auth0 portal');
      await expect(this.emailInput).toBeVisible({ timeout: 20000 });
      await this.emailInput.fill(username);
      await this.passwordInput.fill(password);
      await this.passwordInput.press('Enter');

      // Verify post-login session
      await this.verifySuccessfulLogin();
      log_step('User authenticated successfully');
    } catch (err) {
      throw new Error(`[AUTH FAILED] Login could not be completed: ${err && err.message ? err.message : err}`);
    }
  }

  async verifySuccessfulLogin() {
    // Wait until redirected back from Auth0 to Carvel domain
    await this.page.waitForURL((url) => !url.href.includes('auth0.com') && !url.href.includes('welcome'), { timeout: 30000 });

    // Handle intermittent 'SOMETHING WENT WRONG' recovery screen
    const tryAgainBtn = this.page.locator('#btn_try_again, button:has-text("TRY AGAIN")').first();
    if (await tryAgainBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      log_step('Post-login recovery prompt detected, clicking TRY AGAIN');
      await tryAgainBtn.click();
      await this.page.waitForLoadState('domcontentloaded');
    }

    // Dismiss cookie banner if visible
    const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
    if (await cookieBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
    }

    // Verify authenticated indicators
    const authIndicator = this.page.locator('button:has-text("Account"), #link_auth_Profile, a[href*="personal-info"]').first();
    await expect(authIndicator).toBeVisible({ timeout: 25000 });
  }

  async continueAsGuest() {
    log_step('Continuing as guest');
    const guestBtn = this.page.locator('#txt_guest_account, button:has-text("Continue as Guest")').first();
    await expect(guestBtn).toBeVisible({ timeout: 15000 });
    await guestBtn.click();
    if (this.page.url().includes('welcome')) {
      await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    }
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = { LoginPage };
