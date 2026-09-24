import { Page, Locator, expect } from '@playwright/test';

export class ProductDetailPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly addToCartBtn: Locator;
  readonly radioOptions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.locator('h1, h2, .productImageTitle').first();
    this.addToCartBtn = page.locator('#btn_add_to_cart').first();
    this.radioOptions = page.locator('input[type="radio"]');
  }

  async verifyPDPLoaded(): Promise<void> {
    await expect(this.addToCartBtn).toBeVisible({ timeout: 20000 });
  }

  async selectSizeAndFlavor(sizeName: string = 'Small Cup', flavorName: string = 'Vanilla'): Promise<void> {
    await this.page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      if (radios.length > 0) radios[0].click(); // Select first size option (e.g. Kids Cup / Small Cup)
    });
    await this.page.waitForTimeout(500);

    await this.page.evaluate((flavorText) => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const targetRadio = radios.find(r => r.getAttribute('aria-label') && r.getAttribute('aria-label').includes(flavorText));
      if (targetRadio) {
        targetRadio.click();
      } else if (radios.length > 6) {
        radios[6].click(); // Fallback to 7th radio (Vanilla flavor)
      }
    }, flavorName);
    await this.page.waitForTimeout(500);
  }

  async addToCart(): Promise<void> {
    await expect(this.addToCartBtn).toBeVisible({ timeout: 15000 });
    await this.addToCartBtn.click({ force: true });
    await this.page.waitForTimeout(3000);
  }
}
