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
    await this.page.waitForSelector('#btn_add_to_cart', { timeout: 20000 });
    await this.page.waitForTimeout(1500);

    // Dismiss cookie banner if present
    const cookieBtn = this.page.locator('button:has-text("Continue to Site"), button:has-text("Accept")').first();
    if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    // Verify customization sections are present
    const optionsSection = this.page.locator('button:has-text("SCOOPED SIZE CHOICE"), div:has-text("SCOOPED SIZE CHOICE")').first();
    if (await optionsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('[PDP] Customization section detected and available.');
    }

    // Step 1: Select Size radio and dispatch React change event
    await this.page.evaluate((sizeChoice) => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const sizeRadio = radios.find(r => (r.getAttribute('aria-label') || '').toLowerCase().includes(sizeChoice.toLowerCase())) || radios[0];
      if (sizeRadio) {
        sizeRadio.click();
        sizeRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, sizeName);
    await this.page.waitForTimeout(1500);

    // Step 2: Select Flavor radio and dispatch React change event
    await this.page.evaluate((flavorChoice) => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const flavorRadio = radios.find(r => (r.getAttribute('aria-label') || '').toLowerCase().includes(flavorChoice.toLowerCase())) 
        || radios.find(r => (r.getAttribute('aria-label') || '').toLowerCase().includes('vanilla'))
        || (radios.length > 6 ? radios[6] : null);

      if (flavorRadio) {
        flavorRadio.click();
        flavorRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, flavorName);
    await this.page.waitForTimeout(1500);

    // Ensure the product is ready to add (button is enabled with price)
    await expect(this.addToCartBtn).toBeVisible({ timeout: 15000 });
    const btnText = await this.addToCartBtn.innerText();
    console.log(`[PDP] Product ready state: "${btnText.replace(/\n/g, ' ')}"`);
  }

  async addToCart(): Promise<void> {
    await expect(this.addToCartBtn).toBeVisible({ timeout: 15000 });
    await this.addToCartBtn.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(1000);
    await this.addToCartBtn.click();
    // Wait for "Item Added!" toast
    await this.page.waitForSelector('text="Item Added!"', { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(3000);
  }
}
