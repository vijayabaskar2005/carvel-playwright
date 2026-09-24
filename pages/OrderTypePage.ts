import { Page, Locator, expect } from '@playwright/test';

export class OrderTypePage {
  readonly page: Page;
  readonly pickupOption: Locator;
  readonly deliveryOption: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pickupOption = page.locator('#btn_pickup, button:has-text("PICKUP")').first();
    this.deliveryOption = page.locator('#btn_delivery, button:has-text("DELIVERY")').first();
  }

  async selectPickup(): Promise<void> {
    await expect(this.pickupOption).toBeVisible();
    await this.pickupOption.click();
  }

  async selectDelivery(): Promise<void> {
    await expect(this.deliveryOption).toBeVisible();
    await this.deliveryOption.click();
  }

  async verifyPickupSelected(): Promise<void> {
    await expect(this.pickupOption).toBeVisible();
  }
}
