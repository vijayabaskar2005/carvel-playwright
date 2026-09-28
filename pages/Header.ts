import { Page, Locator, expect } from '@playwright/test';

export class Header {
  readonly page: Page;
  readonly logo: Locator;
  readonly menuLink: Locator;
  readonly locationsLink: Locator;
  readonly giftCardsLink: Locator;
  readonly fudgieFanaticsLink: Locator;
  readonly signInBtn: Locator;
  readonly startOrderBtn: Locator;
  readonly cartIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('#img_headerlogo, a[aria-label="carvel logo"]').first();
    this.menuLink = page.locator('#Menu_Menu, a[href*="/menu"]').first();
    this.locationsLink = page.locator('#Locations_Locations, a[href*="/locations"]').first();
    this.giftCardsLink = page.locator('#Gift Cards_Gift Cards, a[href*="gift"]').first();
    this.fudgieFanaticsLink = page.locator('#Fudgie Fanatics_Fudgie Fanatics').first();
    this.signInBtn = page.locator('#link_guestProfile, #link_sign_in, #signin-button');
    this.startOrderBtn = page.locator('#btn_startorder');
    this.cartIcon = page.locator('#link_cart, button[aria-label*="cart" i]');
  }

  async verifyHeaderVisible(): Promise<void> {
    await expect(this.logo).toBeVisible();
    await expect(this.startOrderBtn).toBeVisible();
  }

  async clickStartOrder(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');

    const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }

    // In case system hiccup appears
    const tryAgainBtn = this.page.locator('#btn_try_again, button:has-text("TRY AGAIN")').first();
    if (await tryAgainBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tryAgainBtn.click().catch(() => {});
      await this.page.waitForTimeout(2000);
    }

    // Re-resolve #btn_startorder immediately before clicking and wait for stability
    const btn = this.page.locator('#btn_startorder').first();
    await btn.waitFor({ state: 'attached', timeout: 20000 });
    await btn.waitFor({ state: 'visible', timeout: 20000 });

    try {
      await btn.click({ timeout: 7000 });
    } catch (err: any) {
      console.log('[HEADER] Start Order button detached during React re-render. Re-resolving and retrying click...');
      await this.page.waitForLoadState('domcontentloaded');
      const freshBtn = this.page.locator('#btn_startorder').first();
      await freshBtn.waitFor({ state: 'visible', timeout: 15000 });
      await freshBtn.click({ timeout: 15000 });
    }

    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickSignIn(): Promise<void> {
    const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }

    const visibleSignIn = this.page.locator('#link_guestProfile, #link_sign_in, #signin-button').filter({ visible: true }).first();
    if (await visibleSignIn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await visibleSignIn.click();
    } else {
      await this.page.goto('/welcome', { waitUntil: 'domcontentloaded' });
    }
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickCartIcon(): Promise<void> {
    await this.cartIcon.click({ force: true });
    await this.page.waitForTimeout(2000);
  }
}
