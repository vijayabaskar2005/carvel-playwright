import { Page, Locator, expect } from '@playwright/test';

export class StoreLocatorPage {
  readonly page: Page;
  readonly pickupTab: Locator;
  readonly deliveryTab: Locator;
  readonly searchInput: Locator;
  readonly firstSuggestion: Locator;
  readonly storeCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pickupTab = page.locator('#btn_pickup, button:has-text("PICKUP")').first();
    this.deliveryTab = page.locator('#btn_delivery, button:has-text("DELIVERY")').first();
    this.searchInput = page.locator('input[placeholder*="Street"], input[placeholder*="City"], input[placeholder*="Zip"], input[type="text"]').first();
    this.firstSuggestion = page.locator('.storeSearchItem button, div.storeSearchItem').first();
    this.storeCards = page.locator('div, section, article');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/store-search', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000);
  }

  async selectPickup(): Promise<void> {
    if (await this.pickupTab.isVisible()) {
      await this.pickupTab.click();
    }
  }

  async searchAndSelectStore(address: string, storeName: string): Promise<void> {
    await this.selectPickup();
    await this.searchInput.click();
    await this.searchInput.fill(address);
    await this.page.waitForTimeout(2000);

    if (await this.firstSuggestion.isVisible()) {
      await this.firstSuggestion.click({ force: true });
      await this.page.waitForTimeout(4000);
    }

    const targetStoreCard = this.storeCards.filter({ hasText: storeName }).first();
    await expect(targetStoreCard).toBeVisible({ timeout: 15000 });

    const selectShoppeBtn = targetStoreCard.locator('button:has-text("SELECT SHOPPE")').first();
    await expect(selectShoppeBtn).toBeVisible();
    await selectShoppeBtn.click();
    await this.page.waitForTimeout(4000);
  }

  async verifyStoreSelected(storeName: string): Promise<void> {
    await expect(this.page).toHaveURL(/menu/);
    await expect(this.page.locator('body')).toContainText(storeName);
  }
}
