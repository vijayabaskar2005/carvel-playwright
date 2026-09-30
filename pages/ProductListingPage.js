const { expect } = require('@playwright/test');
const { log_step } = require('../utils/logger');

class ProductListingPage {
  constructor(page) {
    this.page = page;
    this.productTitles = page.locator('.productImageTitle, div[class*="product"]');
    this.firstProductTile = page.locator('.productImageTitle').first();
  }

  async verifyProductsDisplayed() {
    await expect(this.firstProductTile).toBeVisible({ timeout: 15000 });
  }

  async selectProduct(productName) {
    log_step(`Selecting product from listing: "${productName}"`);
    const productCard = this.page.locator(
      `.productImageTitle:has-text("${productName}"), div.productImageTitle:has-text("${productName}")`
    ).first();
    await expect(productCard).toBeVisible({ timeout: 15000 });
    await productCard.scrollIntoViewIfNeeded();
    await productCard.click({ force: true });
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = { ProductListingPage };
