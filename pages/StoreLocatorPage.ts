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
    this.storeCards = page.locator('.storeCardContainer');
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

  async searchAndSelectStore(searchQuery: string, storeName: string, expectedAddress?: string): Promise<void> {
    await this.selectPickup();
    await this.searchInput.click();
    await this.searchInput.fill(searchQuery);
    await this.page.waitForTimeout(2000);

    if (await this.firstSuggestion.isVisible()) {
      await this.firstSuggestion.click({ force: true });
      await this.page.waitForTimeout(4000);
    }

    // Locate the specific store card container
    const targetStoreCard = this.page.locator('.storeCardContainer').filter({ hasText: storeName }).first();
    const isStoreVisible = await targetStoreCard.isVisible({ timeout: 15000 }).catch(() => false);

    if (!isStoreVisible) {
      throw new Error(`[STORE NOT FOUND] Required store "${storeName}" with address "${expectedAddress || searchQuery}" was not found in search results. Automatic substitution is strictly prohibited.`);
    }

    const cardContent = await targetStoreCard.innerText();

    // Verify Store Name
    if (!cardContent.includes(storeName)) {
      throw new Error(`[STORE NAME MISMATCH] Expected store name "${storeName}" not found on store card. Content:\n${cardContent}`);
    }

    // Verify Address if specified
    if (expectedAddress && !cardContent.includes(expectedAddress)) {
      const addressParts = expectedAddress.split(',').map(s => s.trim());
      const hasStreet = addressParts.length > 0 && cardContent.includes(addressParts[0]);
      if (!hasStreet) {
        throw new Error(`[ADDRESS MISMATCH] Expected address "${expectedAddress}" not found on store card for "${storeName}". Content:\n${cardContent}`);
      }
    }

    const selectShoppeBtn = targetStoreCard.locator('button:has-text("SELECT SHOPPE")').first();
    await expect(selectShoppeBtn).toBeVisible({ timeout: 10000 });
    await selectShoppeBtn.click();
    await this.page.waitForTimeout(4000);
  }

  async verifyStoreSelected(storeName: string): Promise<void> {
    await expect(this.page.locator('body')).toContainText(storeName, { timeout: 15000 });
  }
}
