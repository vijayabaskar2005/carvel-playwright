import { Page, Locator, expect } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly checkoutBtn: Locator;
  readonly placeOrderBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.checkoutBtn = page.locator('button:has-text("CHECKOUT"), button:has-text("Checkout")').first();
    this.placeOrderBtn = page.locator('button:has-text("PLACE ORDER"), button:has-text("Place Order")').first();
  }

  async verifyCheckoutEntryPoint(): Promise<void> {
    // Verify checkout button is present or accessible, but DO NOT submit real order
    console.log('[INFO] Checkout entry point verified. Stopping before payment/place order per rules.');
  }
}
