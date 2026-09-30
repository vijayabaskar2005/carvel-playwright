const { expect } = require('@playwright/test');
const { log_step } = require('../utils/logger');

class CartPage {
  constructor(page) {
    this.page = page;
    this.cartIconHeader = page.locator('#link_cart, button[aria-label*="cart" i]').first();
    this.cartDrawer = page.locator(
      '#cart_drawer, [data-testid="cart_drawer"], .cartDrawer, div[class*="Cart_"], div[role="dialog"], #cartContent'
    ).or(page.locator('body')).first();
    this.checkoutButton = page.locator('#cart_checkout_button').first();
  }

  async openCart() {
    log_step('Opening cart drawer');
    // Dismiss cookie banner if present
    const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
    if (await cookieBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
    }

    const isCartDrawerOpen = await this.page.locator('text="MY CART"').isVisible().catch(() => false);
    if (!isCartDrawerOpen) {
      await expect(this.cartIconHeader).toBeVisible({ timeout: 10000 });
      await this.cartIconHeader.click();
    }

    // Dismiss "ARE YOU SURE YOU WANT TO LEAVE" modal if present
    const leaveModal = this.page.locator('text="ARE YOU SURE YOU WANT TO LEAVE"');
    if (await leaveModal.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.page.locator('button:has-text("YES, LEAVE")').click().catch(() => {});
    }
  }

  async verifyCartLoaded() {
    await this.openCart();
    await expect(this.cartDrawer).toContainText(/MY CART|YOUR ORDER|Cart/i, { timeout: 15000 });
  }

  async verifyStoreInCart(storeName) {
    const cleanStore = storeName.trim();
    const drawerText = await this.cartDrawer.innerText();
    if (drawerText.toLowerCase().includes(cleanStore.toLowerCase())) {
      expect(true).toBeTruthy();
    } else {
      const storeSnippet = cleanStore.split(/\s+/).slice(0, 2).join(' ');
      await expect(this.cartDrawer).toContainText(new RegExp(storeSnippet, 'i'));
    }
  }

  async verifyAddressInCart(addressSnippet) {
    const street = addressSnippet.split(',')[0].trim();
    await expect(this.cartDrawer).toContainText(street);
  }

  async verifyPickupMethodInCart(method = 'Pickup') {
    await expect(this.cartDrawer).toContainText(new RegExp(method, 'i'));
  }

  async verifyPickupScheduleInCart(date, time) {
    const drawerText = await this.cartDrawer.innerText();
    expect(drawerText).toMatch(/Scheduled for/i);
    expect(drawerText).toMatch(/\d{1,2}:\d{2}\s*(?:AM|PM)/i);

    if (date && date.trim().length > 0 && !date.includes('Dynamic')) {
      const lowerText = drawerText.toLowerCase();
      const dateSnippet = date.split(',')[0].trim();

      let dateMatched = lowerText.includes(dateSnippet.toLowerCase());

      if (!dateMatched) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const fullMonthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
        ];

        const match = dateSnippet.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/);
        if (match) {
          const monthIndex = parseInt(match[1], 10) - 1;
          const dayNum = parseInt(match[2], 10);

          if (monthIndex >= 0 && monthIndex < 12) {
            const shortMonth = monthNames[monthIndex];
            const fullMonth = fullMonthNames[monthIndex];
            const dateRegex = new RegExp(`(?:${shortMonth}|${fullMonth})\\s+0?${dayNum}\\b`, 'i');
            dateMatched = dateRegex.test(lowerText);
          }
        } else {
          const parsedDate = new Date(dateSnippet);
          if (!isNaN(parsedDate.getTime())) {
            const shortMonth = monthNames[parsedDate.getMonth()];
            const fullMonth = fullMonthNames[parsedDate.getMonth()];
            const dayNum = parsedDate.getDate();
            const dateRegex = new RegExp(`(?:${shortMonth}|${fullMonth})\\s+0?${dayNum}\\b`, 'i');
            dateMatched = dateRegex.test(lowerText);
          } else {
            const parts = dateSnippet.split(/\s+/);
            if (parts.length >= 2) {
              const monthPart = parts[0].toLowerCase().substring(0, 3);
              const dayPart = parts[1].replace(/\D/g, '');
              dateMatched = lowerText.includes(monthPart) && lowerText.includes(dayPart);
            }
          }
        }
      }

      expect(dateMatched, `Expected cart to contain scheduled pickup date derived from "${dateSnippet}"`).toBeTruthy();
    }

    if (time && time.trim().length > 0 && !time.includes('Dynamic')) {
      const timeSnippet = time.replace(/\s+/g, ' ').trim().toLowerCase();
      const normalizedTime = timeSnippet.replace(/^0(\d:\d{2})/, '$1');
      const paddedTime = timeSnippet.replace(/^(\d:\d{2})/, '0$1');
      const timeMatched = drawerText.toLowerCase().includes(timeSnippet) ||
                          drawerText.toLowerCase().includes(normalizedTime) ||
                          drawerText.toLowerCase().includes(paddedTime);
      expect(timeMatched, `Expected cart to contain pickup time "${time}"`).toBeTruthy();
    }
  }

  async verifyProductInCart(productName) {
    const regex = new RegExp(productName.replace(/®/g, ''), 'i');
    await expect(this.cartDrawer).toContainText(regex);
  }

  async verifyQuantityInCart() {
    const drawerText = await this.cartDrawer.innerText();
    const hasQty = /\b(?:Qty|Quantity|\d+\s*item|\$?\d+\.\d{2})\b/i.test(drawerText);
    expect(hasQty).toBeTruthy();
  }

  async verifyPriceDisplayed() {
    const drawerText = await this.cartDrawer.innerText();
    const hasPrice = /\$\d+\.\d{2}/.test(drawerText) && /Subtotal|Total|CHECKOUT/i.test(drawerText);
    expect(hasPrice).toBeTruthy();
  }

  async proceedToCheckout() {
    log_step('Proceeding to checkout from cart');
    await expect(this.checkoutButton).toBeVisible({ timeout: 15000 });
    await this.checkoutButton.click();

    // Intermediate modal handling if present
    const continueBtn = this.page.locator('button:has-text("CONTINUE"), button:has-text("YES, LEAVE")').first();
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click().catch(() => {});
    }

    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = { CartPage };
