import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartIconHeader: Locator;
  readonly bodyText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartIconHeader = page.locator('#link_cart, .cartIcon, [aria-label="cart icon"]').first();
    this.bodyText = page.locator('body');
  }

  async openCart(): Promise<void> {
    // Dismiss cookie banner if present
    const cookieBtn = this.page.locator('button:has-text("Continue to Site"), button:has-text("Accept")').first();
    if (await cookieBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }

    const isCartDrawerOpen = await this.page.locator('text="MY CART"').isVisible().catch(() => false);
    if (!isCartDrawerOpen) {
      if (await this.cartIconHeader.isVisible()) {
        await this.cartIconHeader.click();
        await this.page.waitForTimeout(3000);
      }
    }

    // Dismiss "ARE YOU SURE YOU WANT TO LEAVE" modal if present
    const leaveModal = this.page.locator('text="ARE YOU SURE YOU WANT TO LEAVE"');
    if (await leaveModal.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.page.locator('button:has-text("YES, LEAVE")').click().catch(() => {});
      await this.page.waitForTimeout(2000);
    }
  }

  async verifyCartLoaded(): Promise<void> {
    await this.openCart();
    await expect(this.page.locator('body')).toContainText(/MY CART|YOUR ORDER|Cart/i);
  }

  async verifyStoreInCart(storeName: string): Promise<void> {
    await expect(this.page.locator('body')).toContainText(storeName);
  }

  async verifyAddressInCart(addressSnippet: string): Promise<void> {
    const street = addressSnippet.split(',')[0].trim();
    await expect(this.page.locator('body')).toContainText(street);
  }

  async verifyPickupMethodInCart(method: string = 'Pickup'): Promise<void> {
    await expect(this.page.locator('body')).toContainText(new RegExp(method, 'i'));
  }

  async verifyPickupScheduleInCart(date?: string, time?: string): Promise<void> {
    const bodyText = await this.page.locator('body').innerText();
    expect(bodyText).toMatch(/Scheduled for/i);

    // Verify time format (e.g. 12:15 AM)
    expect(bodyText).toMatch(/\d{1,2}:\d{2}\s*(?:AM|PM)/i);

    if (date && date.trim().length > 0 && !date.includes('Dynamic')) {
      const dateSnippet = date.split(',')[0].trim();
      expect(bodyText.toLowerCase()).toContain(dateSnippet.toLowerCase());
    }

    if (time && time.trim().length > 0 && !time.includes('Dynamic')) {
      const timeSnippet = time.replace(/\s+/g, ' ').trim();
      expect(bodyText.toLowerCase()).toContain(timeSnippet.toLowerCase());
    }
  }

  async verifyProductInCart(productName: string): Promise<void> {
    // Carvel cart may format title case (e.g. "Scooped Ice Cream")
    const regex = new RegExp(productName.replace(/®/g, ''), 'i');
    await expect(this.page.locator('body')).toContainText(regex);
  }

  async verifyPriceDisplayed(): Promise<void> {
    const bodyText = await this.page.locator('body').innerText();
    const hasPrice = /\$\d+\.\d{2}/.test(bodyText) && /Subtotal|Total|CHECKOUT/i.test(bodyText);
    expect(hasPrice).toBeTruthy();
  }
}
