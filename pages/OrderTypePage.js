const { expect } = require('@playwright/test');

class OrderTypePage {
  constructor(page) {
    this.page = page;
    this.pickupOption = page.locator('#btn_pickup, button:has-text("PICKUP")').first();
    this.deliveryOption = page.locator('#btn_delivery, button:has-text("DELIVERY")').first();
  }

  async selectPickup() {
    if (this.page.url().includes('store-search')) {
      const pickupTab = this.page.locator('#btn_pickup, button:has-text("Pickup")').first();
      if (await pickupTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pickupTab.click();
      }
      return;
    }
    await expect(this.pickupOption).toBeVisible({ timeout: 20000 });
    await this.pickupOption.click();
  }

  async selectDelivery() {
    await expect(this.deliveryOption).toBeVisible();
    await this.deliveryOption.click();
  }

  async verifyPickupSelected() {
    await expect(this.pickupOption).toBeVisible();
  }
}

module.exports = { OrderTypePage };
