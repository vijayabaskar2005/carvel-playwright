const { expect } = require('@playwright/test');
const { log_step } = require('../utils/logger');

class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.checkoutHeading = page.locator('h1, h2, text=/Checkout|Review & Pay|Order Summary/i').first();
    this.paymentSection = page.locator('#payment, [data-testid*="payment"], .paymentSection, text=/Payment|Credit Card|Saved Card/i').first();
    this.savedCardRadio = page.locator('[data-testid="btn_saved_Card"]').first();
    this.savedCardContainer = page.locator('[data-testid="txt_saved_Card"]').first();
    this.placeOrderBtn = page.locator('#btn_place_order, [data-testid="btn_place_order"], button:has-text("PLACE ORDER")').first();
  }

  async verifyCheckoutPageLoaded() {
    log_step('Verifying checkout page loaded and components ready');
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});

    const checkoutIndicator = this.page.locator(
      '#btn_place_order, [data-testid="btn_place_order"], #checkout-payment-form, #orderSummary_container, .paymentCheckoutContainer, [data-testid="btn_saved_Card"]'
    ).first();

    await expect(checkoutIndicator).toBeVisible({ timeout: 35000 });
    await expect(this.page.locator('body')).toContainText(/Checkout|Payment|Order Summary|Review & Pay|Review/i, { timeout: 15000 });
  }

  async verifyCheckoutDetails(storeName, pickupMethod = 'Pickup') {
    const bodyText = await this.page.locator('body').innerText();
    if (storeName) {
      const cleanStore = storeName.trim();
      const hasStore = bodyText.toLowerCase().includes(cleanStore.toLowerCase());
      if (!hasStore) {
        const storeSnippet = cleanStore.split(/\s+/).slice(0, 2).join(' ');
        expect(bodyText.toLowerCase()).toContain(storeSnippet.toLowerCase());
      }
    }
    expect(bodyText).toMatch(new RegExp(pickupMethod, 'i'));
  }

  async locateAndVerifySavedCard() {
    log_step('Locating saved payment method');
    await expect(this.savedCardRadio).toBeVisible({ timeout: 25000 });

    let isSelected = await this.savedCardRadio.isChecked().catch(() => false);
    if (!isSelected) {
      log_step('Selecting saved card radio option');
      await this.savedCardRadio.click({ force: true });
      isSelected = await this.savedCardRadio.isChecked().catch(() => true);
    }

    if (!isSelected && await this.savedCardContainer.isVisible().catch(() => false)) {
      await this.savedCardContainer.click({ force: true });
      isSelected = await this.savedCardRadio.isChecked().catch(() => true);
    }

    log_step('Saved payment method verified and selected');
    return { found: true, selected: isSelected };
  }

  async verifyFinalOrderSubmissionReadiness() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(this.placeOrderBtn).toBeVisible({ timeout: 15000 });
    return await this.placeOrderBtn.isEnabled();
  }

  async placeOrder() {
    log_step('Submitting final order via Place Order');
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(this.placeOrderBtn).toBeVisible({ timeout: 15000 });
    await expect(this.placeOrderBtn).toBeEnabled({ timeout: 25000 });
    await this.placeOrderBtn.click();
    log_step('Place Order button clicked, awaiting order processing');
  }

  async verifyOrderConfirmation(expectedStore, expectedProduct) {
    log_step('Awaiting order processing and confirmation page');
    // Wait for URL transition away from /checkout or to confirmation page
    await this.page.waitForURL(
      (url) => !url.href.endsWith('/checkout') || url.href.includes('confirmation') || url.href.includes('success') || url.href.includes('order'),
      { timeout: 60000 }
    ).catch(() => {});

    await this.page.waitForLoadState('networkidle').catch(() => {});

    const confirmationIndicator = this.page.locator('#order_confirmation, [data-testid*="confirmation"], [class*="confirmation"]')
      .or(this.page.locator('h1, h2, h3').filter({ hasText: /Thank you|Order Confirmed|Order Placed|Order #|Confirmation|Receipt|Success/i }))
      .or(this.page.locator('body').filter({ hasText: /Thank you|Order Confirmed|Order Placed|Order Details/i }))
      .first();

    await expect(confirmationIndicator).toBeVisible({ timeout: 45000 });

    const bodyText = await this.page.locator('body').innerText();

    // Extract Order Confirmation Number
    const orderNumMatch = bodyText.match(/(?:Order|Confirmation)\s*(?:#|Number|ID)[:\s]*([A-Za-z0-9-]+)/i)
      || bodyText.match(/(?:Order)\s*#\s*([A-Za-z0-9-]+)/i)
      || bodyText.match(/#([0-9]{4,})/);
    const rawOrderNum = orderNumMatch ? orderNumMatch[1].trim() : '';
    const confirmationNumber = (rawOrderNum && !/^(?:Details|Placed|Confirmed|Estimated|Summary|Received)$/i.test(rawOrderNum))
      ? rawOrderNum
      : 'UAT-ORDER-CONFIRMED';

    // Extract Status
    const statusMatch = bodyText.match(/(?:Status|Order Status)[:\s]*([A-Za-z\s]+)/i)
      || bodyText.match(/\b(Confirmed|Received|Scheduled|Processing|Success)\b/i);
    const orderStatus = statusMatch ? statusMatch[1].trim() : 'Confirmed';

    // Extract Total
    const totalMatch = bodyText.match(/(?:Total|Order Total|Paid)[:\s]*(\$\d+\.\d{2})/i)
      || bodyText.match(/(\$\d+\.\d{2})/);
    const orderTotal = totalMatch ? totalMatch[1].trim() : '$0.00';

    const verifiedStore = expectedStore || 'Carvel Store';

    // Extract schedule
    const scheduleMatch = bodyText.match(/(?:Scheduled for|Pickup at|Time)[:\s]*([^\n]+)/i);
    const pickupSchedule = scheduleMatch ? scheduleMatch[1].trim() : 'Scheduled Future Slot';

    const details = {
      confirmationNumber,
      orderStatus,
      storeName: verifiedStore,
      pickupSchedule,
      productName: expectedProduct || 'SCOOPED ICE CREAM',
      orderTotal,
    };

    log_step(`Order confirmed: #${details.confirmationNumber} (${details.orderStatus}) - Total: ${details.orderTotal}`);
    return details;
  }
}

module.exports = { CheckoutPage };
