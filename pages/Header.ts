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
    this.signInBtn = page.locator('#link_guestProfile, #signin-button, button:has-text("SIGN IN")').first();
    this.startOrderBtn = page.locator('#btn_startorder, button:has-text("START ORDER"), a:has-text("START ORDER")').first();
    this.cartIcon = page.locator('#link_cart, .cartIcon, [aria-label="cart icon"]').first();
  }

  async verifyHeaderVisible(): Promise<void> {
    await expect(this.logo).toBeVisible();
    await expect(this.startOrderBtn).toBeVisible();
  }

  async clickStartOrder(): Promise<void> {
    await this.startOrderBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickSignIn(): Promise<void> {
    await this.signInBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickCartIcon(): Promise<void> {
    await this.cartIcon.click({ force: true });
    await this.page.waitForTimeout(2000);
  }
}
