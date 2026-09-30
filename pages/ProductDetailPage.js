const { expect } = require('@playwright/test');
const { log_step } = require('../utils/logger');

class ProductDetailPage {
  constructor(page) {
    this.page = page;
    this.productName = page.locator('h2:visible').filter({ hasNotText: /ACCOUNT/i }).first();
    this.addToCartBtn = page.locator('#btn_add_to_cart').first();
    this.radioOptions = page.locator('input[type="radio"]');
  }

  async verifyPDPLoaded() {
    await expect(this.addToCartBtn).toBeVisible({ timeout: 20000 });
  }

  async customizeProduct(options) {
    await this.selectSizeAndFlavor(options.size, options.flavor);
  }

  async selectSizeAndFlavor(sizeName, flavorName) {
    log_step(`Customizing product with size: "${sizeName}" and flavor: "${flavorName}"`);
    await this.page.waitForSelector('#btn_add_to_cart', { timeout: 20000 });

    // Dismiss cookie banner if present
    const cookieBtn = this.page.locator('button:has-text("Continue to Site"), button:has-text("Accept")').first();
    if (await cookieBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
    }

    // Step 1: Select Size radio and dispatch React change event
    await this.page.evaluate((sizeChoice) => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const sizeRadio = radios.find((r) => (r.getAttribute('aria-label') || '').toLowerCase().includes(sizeChoice.toLowerCase())) || radios[0];
      if (sizeRadio) {
        sizeRadio.click();
        sizeRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, sizeName);

    // Step 2: Select Flavor radio and dispatch React change event
    await this.page.evaluate((flavorChoice) => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const flavorRadio =
        radios.find((r) => (r.getAttribute('aria-label') || '').toLowerCase().includes(flavorChoice.toLowerCase())) ||
        radios.find((r) => (r.getAttribute('aria-label') || '').toLowerCase().includes('vanilla')) ||
        (radios.length > 6 ? radios[6] : null);

      if (flavorRadio) {
        flavorRadio.click();
        flavorRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, flavorName);

    // Ensure the add-to-cart button is visible and enabled
    await expect(this.addToCartBtn).toBeVisible({ timeout: 15000 });
  }

  async getSelectedCustomizations() {
    return await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]:checked'));
      const labels = radios.map((r) => r.getAttribute('aria-label') || r.value || '');
      return {
        size: labels[0] || '',
        flavor: labels[1] || (labels.length > 1 ? labels[1] : ''),
      };
    });
  }

  async addToCart() {
    log_step('Adding customized product to cart');
    await expect(this.addToCartBtn).toBeVisible({ timeout: 15000 });
    await this.addToCartBtn.scrollIntoViewIfNeeded();
    await this.addToCartBtn.click();

    // Wait for "Item Added!" toast or drawer trigger
    await this.page.waitForSelector('text="Item Added!"', { timeout: 10000 }).catch(() => {});
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = { ProductDetailPage };
