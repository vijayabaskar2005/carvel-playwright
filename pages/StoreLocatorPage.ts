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
    this.pickupTab = page.locator('#btn_pickup').first();
    this.deliveryTab = page.locator('#btn_delivery').first();
    this.searchInput = page.locator('#store-search-input, input[type="text"]').first();
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

  async performSearch(searchQuery: string): Promise<void> {
    await this.selectPickup();
    await this.searchInput.click();
    await this.searchInput.fill('');
    await this.page.keyboard.type(searchQuery, { delay: 30 });
    await this.page.waitForTimeout(2500);

    if (await this.firstSuggestion.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.firstSuggestion.click({ force: true });
      await this.page.waitForTimeout(3000);
    }
  }

  async searchAndSelectStore(searchQuery: string, storeName?: string, expectedAddress?: string): Promise<{ name: string; address: string }> {
    await this.performSearch(searchQuery);
    return await this.selectFirstAvailableStoreOrderAhead(searchQuery);
  }

  async selectFirstAvailableStoreOrderAhead(searchQuery?: string): Promise<{ name: string; address: string }> {
    await expect(this.storeCards.first()).toBeVisible({ timeout: 20000 });
    console.log('[STORE LOCATOR] Inspecting available store cards...');

    const cardCount = await this.storeCards.count();
    let chosenStoreName = '';
    let chosenAddress = '';
    let storeAccepted = false;

    for (let i = 0; i < cardCount; i++) {
      console.log(`[STORE LOCATOR] Inspecting store ${i + 1}...`);

      const card = this.storeCards.nth(i);
      await card.scrollIntoViewIfNeeded().catch(() => {});
      const cardContent = await card.innerText();
      const lines = cardContent.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      const candidateStoreName = lines[0] || `Store ${i + 1}`;
      const candidateAddress = lines.length > 2 ? `${lines[1]}, ${lines[2]}` : (lines[1] || 'Address');
      console.log(`[STORE LOCATOR] Candidate store: "${candidateStoreName}"`);

      const orderAheadBtn = card.locator('button:has-text("ORDER AHEAD")').first();
      const isVisible = await orderAheadBtn.isVisible().catch(() => false);
      const isEnabled = isVisible && await orderAheadBtn.isEnabled().catch(() => false);

      if (!isEnabled) {
        console.log(`[STORE LOCATOR] Store ${i + 1} unavailable: ORDER AHEAD is not enabled.`);
        continue;
      }

      console.log('[STORE LOCATOR] ORDER AHEAD is enabled. Testing store availability...');
      await orderAheadBtn.click();
      await this.page.waitForTimeout(3000);

      // Confirm store change or clear cart if modal appears
      const confirmChangeBtn = this.page.locator('button:has-text("START NEW ORDER"), button:has-text("CHANGE LOCATION"), button:has-text("CONFIRM"), button:has-text("YES")').first();
      if (await confirmChangeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('[STORE LOCATOR] Confirming store switch / clear cart modal...');
        await confirmChangeBtn.click();
        await this.page.waitForTimeout(3000);
      }

      // Check for unavailable location modal using valid Playwright selectors
      const unavailableHeading = this.page.locator('[data-testid="location_popup_warning_heading"]')
        .or(this.page.locator('h1, h2, div, span').filter({ hasText: /This location is not available for online ordering|Please select a different location/i }))
        .first();

      const isUnavailable = await unavailableHeading.isVisible({ timeout: 3500 }).catch(() => false);

      if (isUnavailable) {
        console.log('[STORE LOCATOR] Store rejected: location is not available for online ordering.');
        console.log('[STORE LOCATOR] Moving to next available store...');

        // Close the unavailable modal using stable close button
        const closeBtn = this.page.locator('button[aria-label="Close"]').first();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.click();
          await this.page.waitForTimeout(1500);
        } else {
          const findNewLocationBtn = this.page.locator('#modal-findnewlocation-button, [data-testid="modal-findnewlocation-button"]').first();
          if (await findNewLocationBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await findNewLocationBtn.click();
            await this.page.waitForTimeout(2000);
          }
        }

        // Verify if store cards are still visible or if we need to return to store search
        const cardsStillVisible = await this.storeCards.first().isVisible({ timeout: 2000 }).catch(() => false);
        if (!cardsStillVisible) {
          console.log('[STORE LOCATOR] Returning to store selection screen...');
          await this.navigate();
          if (searchQuery) {
            await this.performSearch(searchQuery);
          }
        }
        continue;
      }

      // Verify that the store is accepted and ordering UI is available
      const orderingUIIndicator = this.page.locator(
        '#orderInfoLaterBtn, #orderInfoAsapBtn, #order_changeButtonId, [data-testid*="orderInfo"], #menu_category_list, .categoryListWrapper, a[href*="/menu/"]'
      ).first();

      const isAccepted = await orderingUIIndicator.isVisible({ timeout: 8000 }).catch(() => false)
        || !this.page.url().includes('store-search');

      if (isAccepted) {
        console.log('[STORE LOCATOR] Store accepted for online ordering.');
        console.log(`[SELECTED STORE] Name: "${candidateStoreName}" | Address: "${candidateAddress}"`);
        console.log('[STORE LOCATOR] Continuing with Pickup Later flow...');
        chosenStoreName = candidateStoreName;
        chosenAddress = candidateAddress;
        storeAccepted = true;
        break;
      } else {
        console.log('[STORE LOCATOR] Store did not transition to ordering UI. Moving to next candidate...');
        continue;
      }
    }

    if (!storeAccepted) {
      console.error('[STORE LOCATOR] No stores were accepted for online ordering.');
      throw new Error('No store available for online ordering for the configured location.');
    }

    return { name: chosenStoreName, address: chosenAddress };
  }

  async selectFirstStoreOrderAhead(expectedStoreName?: string, expectedAddress?: string): Promise<{ name: string; address: string }> {
    return await this.selectFirstAvailableStoreOrderAhead();
  }

  async verifyStoreSelected(storeName: string): Promise<void> {
    const cleanStore = storeName.split(/\s+/).slice(0, 2).join(' ');
    await expect(this.page.locator('body')).toContainText(new RegExp(cleanStore, 'i'), { timeout: 15000 });
  }
}
