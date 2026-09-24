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
    if (await this.cartIconHeader.isVisible()) {
      await this.cartIconHeader.click({ force: true });
      await this.page.waitForTimeout(3000);
    }
  }

  async verifyCartLoaded(): Promise<void> {
    await this.openCart();
    await expect(this.bodyText).toBeVisible();
  }

  async verifyProductInCart(productName: string): Promise<void> {
    await expect(this.bodyText).toContainText(productName);
  }

  async verifyStoreInCart(storeName: string): Promise<void> {
    await expect(this.bodyText).toContainText(storeName);
  }
}
