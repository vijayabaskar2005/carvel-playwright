const { expect } = require('@playwright/test');
const { log_step } = require('../utils/logger');

class Header {
  constructor(page) {
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

  async verifyHeaderVisible() {
    await expect(this.logo).toBeVisible({ timeout: 15000 });
    await expect(this.startOrderBtn).toBeVisible({ timeout: 15000 });
  }

  async clickStartOrder() {
    log_step('Clicking Start Order from header');
    await this.page.waitForLoadState('domcontentloaded');

    const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
    if (await cookieBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
    }

    const tryAgainBtn = this.page.locator('#btn_try_again, button:has-text("TRY AGAIN")').first();
    if (await tryAgainBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await tryAgainBtn.click().catch(() => {});
      await this.page.waitForLoadState('domcontentloaded');
    }

    const startOrderBtn = this.page.locator(
      '#btn_startorder, button:has-text("START ORDER"), button:has-text("Order Now"), a[href*="/menu"]:has-text("Order Now"), a:has-text("Order Now")'
    ).first();

    await expect(startOrderBtn).toBeVisible({ timeout: 20000 });
    await startOrderBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickSignIn() {
    log_step('Initiating Sign In from header');
    const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
    if (await cookieBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
    }

    const visibleSignIn = this.page.locator('#link_guestProfile, #link_sign_in, #signin-button').filter({ visible: true }).first();
    if (await visibleSignIn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await visibleSignIn.click();
    } else {
      await this.page.goto('/welcome', { waitUntil: 'domcontentloaded' });
    }
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickCartIcon() {
    log_step('Clicking Cart icon in header');
    await expect(this.cartIcon.first()).toBeVisible({ timeout: 10000 });
    await this.cartIcon.first().click({ force: true });
  }
}

module.exports = { Header };
