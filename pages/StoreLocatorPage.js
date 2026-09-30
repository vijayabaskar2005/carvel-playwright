const { expect } = require('@playwright/test');
const { log_step } = require('../utils/logger');

class StoreLocatorPage {
  constructor(page) {
    this.page = page;
    this.pickupTab = page.locator('#btn_pickup').first();
    this.deliveryTab = page.locator('#btn_delivery').first();
    this.searchInput = page.locator('#store-search-input, input[type="text"]').first();
    this.storeCards = page.locator('.storeCardContainer');
    this.lastNearbyApiStatus = null;
    this.lastNearbyApiUrl = '';
    this.lastNearbyApiBody = '';
  }

  async navigate() {
    await this.page.goto('/store-search', { waitUntil: 'domcontentloaded' });
  }

  async selectPickup() {
    if (await this.pickupTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.pickupTab.click();
    }
  }

  async performSearch(searchQuery) {
    log_step(`Searching store location: ${searchQuery}`);

    // Monitor nearby location API response
    this.page.on('response', async (res) => {
      if (res.url().includes('location/nearby')) {
        this.lastNearbyApiStatus = res.status();
        this.lastNearbyApiUrl = res.url();
        this.lastNearbyApiBody = await res.text().catch(() => '');
      }
    });

    // Dismiss cookie banner overlay if present
    await this.page.evaluate(() => {
      const cookieBtn = document.getElementById('acceptAllCookieButton');
      if (cookieBtn) cookieBtn.click();
      const truyo = document.getElementById('truyo-consent-module');
      if (truyo) truyo.remove();
    }).catch(() => {});

    await this.selectPickup();

    // Dismiss location services prompt if present
    const continueBtn = this.page.locator('button:has-text("CONTINUE"), button:has-text("Continue")').first();
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      log_step('Clicking CONTINUE on location prompt');
      await continueBtn.click({ force: true }).catch(() => {});
    }

    await expect(this.searchInput).toBeVisible({ timeout: 15000 });
    await this.searchInput.click();
    await this.searchInput.fill('');
    await this.searchInput.pressSequentially(searchQuery, { delay: 20 });

    // Autocomplete dropdown prediction detection
    const autocompleteSuggestion = this.page.locator(
      '[data-testid*="atom_address_list"], .storeSearchItem button, div.storeSearchItem button, [role="listitem"] button, .pac-item, [data-testid*="address_item"]'
    );

    const matchingSuggestion = autocompleteSuggestion.filter({ hasText: /26 Broadway/i }).first();
    const anySuggestion = autocompleteSuggestion.first();

    const isMatchVisible = await matchingSuggestion.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false);
    if (isMatchVisible) {
      log_step(`Selecting matching autocomplete address: "${searchQuery}"`);
      const nearbyPromise = this.page.waitForResponse(
        (res) => res.url().includes('location/nearby'),
        { timeout: 15000 }
      ).catch(() => null);
      await matchingSuggestion.click({ force: true }).catch(() => {});
      await nearbyPromise;
    } else if (await anySuggestion.isVisible().catch(() => false)) {
      log_step('Clicking first available autocomplete address suggestion');
      const nearbyPromise = this.page.waitForResponse(
        (res) => res.url().includes('location/nearby'),
        { timeout: 15000 }
      ).catch(() => null);
      await anySuggestion.click({ force: true }).catch(() => {});
      await nearbyPromise;
    } else {
      log_step('Autocomplete dropdown not visible, pressing Enter');
      await this.searchInput.press('Enter').catch(() => {});
    }

    if (await continueBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await continueBtn.click({ force: true }).catch(() => {});
    }

    // Wait for store cards to render
    try {
      await this.storeCards.first().waitFor({ state: 'visible', timeout: 20000 });
      log_step('Store results loaded');
    } catch {
      if (this.lastNearbyApiStatus && this.lastNearbyApiStatus >= 400) {
        throw new Error(
          `Store search API returned HTTP ${this.lastNearbyApiStatus}. Store selection cannot continue because the application did not provide valid store data.`
        );
      }
      throw new Error(
        `Store search API returned HTTP ${this.lastNearbyApiStatus || 500}. Store selection cannot continue because the application did not provide valid store data.`
      );
    }
  }

  async selectStoreCarvelQuSandbox(
    targetStoreName = 'Carvel Qu Sandbox',
    expectedAddress = '26 Broadway, New York, NY 10004'
  ) {
    const cardCount = await this.storeCards.count();
    if (cardCount === 0) {
      if (this.lastNearbyApiStatus && this.lastNearbyApiStatus >= 400) {
        throw new Error(
          `Store search API returned HTTP ${this.lastNearbyApiStatus}. Store selection cannot continue because the application did not provide valid store data.`
        );
      }
      throw new Error('No store cards were returned in the store list.');
    }

    // 1. Find store card specifically for Carvel Qu Sandbox
    const targetCard = this.storeCards.filter({ hasText: targetStoreName }).first();
    const isTargetVisible = await targetCard.isVisible({ timeout: 8000 }).catch(() => false);

    if (!isTargetVisible) {
      throw new Error(`Store '${targetStoreName}' was not found in the returned store list.`);
    }

    log_step(`Found store: ${targetStoreName}`);

    // 2. Verify displayed address
    const cardContent = await targetCard.innerText().catch(() => '');
    const cleanText = cardContent.replace(/\s+/g, ' ').trim();
    const hasAddressMatch = cleanText.toLowerCase().includes('26 broadway');

    if (!hasAddressMatch) {
      throw new Error(`Store address verification failed for '${targetStoreName}'. Expected: ${expectedAddress}, Actual card text: ${cleanText}`);
    }

    log_step(`Verified store address: ${expectedAddress}`);

    // 3. Verify store is open / available for ordering
    const explicitClosedPattern = /\b(closed|currently closed|temporarily closed|not open)\b/i;
    if (explicitClosedPattern.test(cleanText) && !cleanText.match(/open\s*until|open\s*\d/i)) {
      throw new Error(`Store '${targetStoreName}' is closed or unavailable for online ordering.`);
    }

    // 4. Locate ORDER AHEAD or SELECT SHOPPE button strictly scoped to the target store card
    const orderAheadBtn = targetCard.locator('button:has-text("ORDER AHEAD"), button:has-text("Order Ahead")').first();
    const selectShoppeBtn = targetCard.locator(
      'button:has-text("SELECT SHOPPE"), button:has-text("select shoppe"), [data-testid="btn_select shoppe"]'
    ).first();

    const isOrderAheadVisible = await orderAheadBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const isSelectShoppeVisible = await selectShoppeBtn.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isOrderAheadVisible && !isSelectShoppeVisible) {
      throw new Error(`Store '${targetStoreName}' is open, but ORDER AHEAD button is missing or disabled.`);
    }

    log_step('Store is open and available for ordering');

    // 5. Select ORDER AHEAD or SELECT SHOPPE
    if (isOrderAheadVisible) {
      log_step('Selecting ORDER AHEAD');
      await orderAheadBtn.click();
    } else {
      log_step('Selecting SELECT SHOPPE');
      await selectShoppeBtn.click();
    }

    // Confirm store change or clear cart if modal appears
    const confirmChangeBtn = this.page.locator(
      'button:has-text("START NEW ORDER"), button:has-text("CHANGE LOCATION"), button:has-text("CONFIRM"), button:has-text("YES")'
    ).first();
    if (await confirmChangeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      log_step('Confirming location switch modal');
      await confirmChangeBtn.click();
    }

    // Check for unavailable location modal
    const unavailableHeading = this.page.locator('[data-testid="location_popup_warning_heading"]')
      .or(this.page.locator('h1, h2, div, span').filter({ hasText: /This location is not available for online ordering|Please select a different location/i }))
      .first();

    if (await unavailableHeading.isVisible({ timeout: 2500 }).catch(() => false)) {
      throw new Error(`Store '${targetStoreName}' is not available for online ordering according to the location warning modal.`);
    }

    // 6. Verify that scheduling UI or ordering panel is visible
    const schedulingUIIndicator = this.page.locator(
      '#orderInfoLaterBtn, #orderInfoAsapBtn, #order_changeButtonId, button:has-text("Update"), button:has-text("Later"), button:has-text("Change")'
    ).or(this.page.getByText('your Carvel shoppe')).first();

    await expect(schedulingUIIndicator).toBeVisible({ timeout: 12000 });

    return { name: targetStoreName, address: expectedAddress };
  }

  async searchAndSelectStore(searchQuery) {
    await this.performSearch(searchQuery);
    return await this.selectStoreCarvelQuSandbox('Carvel Qu Sandbox', '26 Broadway, New York, NY 10004');
  }

  async selectStoreOrderNow(
    targetStoreName = 'Carvel Qu Sandbox',
    expectedAddress = '26 Broadway, New York, NY 10004'
  ) {
    const cardCount = await this.storeCards.count();
    if (cardCount === 0) {
      if (this.lastNearbyApiStatus && this.lastNearbyApiStatus >= 400) {
        throw new Error(
          `Store search API returned HTTP ${this.lastNearbyApiStatus}. Store selection cannot continue because the application did not provide valid store data.`
        );
      }
      throw new Error('No store cards were returned in the store list.');
    }

    const targetCard = this.storeCards.filter({ hasText: targetStoreName }).first();
    const isTargetVisible = await targetCard.isVisible({ timeout: 8000 }).catch(() => false);

    if (!isTargetVisible) {
      throw new Error(`Store '${targetStoreName}' was not found in the returned store list.`);
    }

    log_step(`Found store: ${targetStoreName}`);

    const cardContent = await targetCard.innerText().catch(() => '');
    const cleanText = cardContent.replace(/\s+/g, ' ').trim();
    const hasAddressMatch = cleanText.toLowerCase().includes('26 broadway');

    if (!hasAddressMatch) {
      throw new Error(`Store address verification failed for '${targetStoreName}'. Expected: ${expectedAddress}, Actual card text: ${cleanText}`);
    }

    log_step(`Verified store address: ${expectedAddress}`);

    const explicitClosedPattern = /\b(closed|currently closed|temporarily closed|not open)\b/i;
    if (explicitClosedPattern.test(cleanText) && !cleanText.match(/open\s*until|open\s*\d/i)) {
      throw new Error(`Store '${targetStoreName}' is closed or unavailable for online ordering.`);
    }

    const orderNowBtn = targetCard.locator(
      'button:has-text("ORDER NOW"), button:has-text("Order Now"), #btn_order_now, [data-testid="btn_order_now"]'
    ).first();
    const selectShoppeBtn = targetCard.locator(
      'button:has-text("SELECT SHOPPE"), button:has-text("select shoppe"), [data-testid="btn_select shoppe"]'
    ).first();

    const isOrderNowVisible = await orderNowBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const isSelectShoppeVisible = await selectShoppeBtn.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isOrderNowVisible && !isSelectShoppeVisible) {
      throw new Error(`Store '${targetStoreName}' is open, but ORDER NOW / SELECT SHOPPE button is missing or disabled.`);
    }

    log_step('Store is open and available for ordering');

    if (isOrderNowVisible) {
      log_step('Selecting ORDER NOW');
      await orderNowBtn.click();
    } else {
      log_step('Selecting SELECT SHOPPE to configure ASAP Order Now');
      await selectShoppeBtn.click();
    }

    // Confirm store change or clear cart if modal appears
    const confirmChangeBtn = this.page.locator(
      'button:has-text("START NEW ORDER"), button:has-text("CHANGE LOCATION"), button:has-text("CONFIRM"), button:has-text("YES")'
    ).first();
    if (await confirmChangeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      log_step('Confirming location switch modal');
      await confirmChangeBtn.click();
    }

    const unavailableHeading = this.page.locator('[data-testid="location_popup_warning_heading"]')
      .or(this.page.locator('h1, h2, div, span').filter({ hasText: /This location is not available for online ordering|Please select a different location/i }))
      .first();

    if (await unavailableHeading.isVisible({ timeout: 2500 }).catch(() => false)) {
      throw new Error(`Store '${targetStoreName}' is not available for online ordering according to the location warning modal.`);
    }

    // If order-info schedule screen is shown, select ASAP and confirm to reach menu
    const asapBtn = this.page.locator('#orderInfoAsapBtn, button:has-text("ASAP")').first();
    if (await asapBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      log_step('Selecting ASAP ordering mode');
      await asapBtn.click();
    }

    const asapConfirmBtn = this.page.locator(
      '#orderInfoConfirmBtn, [data-testid="orderInfoConfirmBtn"], button:has-text("Update"), button:has-text("CONFIRM")'
    ).first();
    if (await asapConfirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      log_step('Confirming ORDER NOW / ASAP schedule');
      await asapConfirmBtn.click();
    }

    // Verify ordering flow or menu is available
    const orderFlowIndicator = this.page.locator(
      '#orderInfoLaterBtn, #orderInfoAsapBtn, #order_changeButtonId, button:has-text("Update"), button:has-text("Later"), button:has-text("Change"), a#menuPageList, a.menuCat'
    ).or(this.page.getByText('your Carvel shoppe')).first();

    await expect(orderFlowIndicator).toBeVisible({ timeout: 15000 });

    return { name: targetStoreName, address: expectedAddress };
  }

  async searchAndSelectStoreOrderNow(searchQuery) {
    await this.performSearch(searchQuery);
    return await this.selectStoreOrderNow('Carvel Qu Sandbox', '26 Broadway, New York, NY 10004');
  }

  async verifyStoreSelected(storeName) {
    const cleanStore = storeName.split(/\s+/).slice(0, 2).join(' ');
    await expect(this.page.locator('body')).toContainText(new RegExp(cleanStore, 'i'), { timeout: 15000 });
  }
}

module.exports = { StoreLocatorPage };
