import { Page, Locator, expect } from '@playwright/test';

export class ProductListingPage {
  readonly page: Page;
  readonly productTitles: Locator;
  readonly firstProductTile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitles = page.locator('.productImageTitle, div[class*="product"]');
    this.firstProductTile = page.locator('.productImageTitle:has-text("SCOOPED ICE CREAM"), .productImageTitle').first();
  }

  async verifyProductsDisplayed(): Promise<void> {
    await expect(this.firstProductTile).toBeVisible({ timeout: 15000 });
  }

  async selectProduct(productName: string = 'SCOOPED ICE CREAM'): Promise<void> {
    const productCard = this.page.locator(`.productImageTitle:has-text("${productName}"), div.productImageTitle:has-text("${productName}")`).first();
    await expect(productCard).toBeVisible({ timeout: 15000 });
    await productCard.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);
    await productCard.click({ force: true });
    await this.page.waitForTimeout(3000);
  }
}
