import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartIconHeader: Locator;
  readonly bodyText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartIconHeader = page.locator('#link_cart, button[aria-label*="cart" i]').first();
    this.bodyText = page.locator('body');
  }

  async openCart(): Promise<void> {
    // Dismiss cookie banner if present
    const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
    if (await cookieBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }

    const isCartDrawerOpen = await this.page.locator('text="MY CART"').isVisible().catch(() => false);
    if (!isCartDrawerOpen) {
      const cartBtn = this.page.locator('#link_cart, button[aria-label*="cart" i]').first();
      await expect(cartBtn).toBeVisible({ timeout: 10000 });
      console.log('[CART] Clicking Cart icon in header...');
      await cartBtn.click();
      await this.page.waitForTimeout(3000);
    }

    // Dismiss "ARE YOU SURE YOU WANT TO LEAVE" modal if present
    const leaveModal = this.page.locator('text="ARE YOU SURE YOU WANT TO LEAVE"');
    if (await leaveModal.isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.page.locator('button:has-text("YES, LEAVE")').click().catch(() => {});
      await this.page.waitForTimeout(2000);
    }
  }

  async verifyCartLoaded(): Promise<void> {
    await this.openCart();
    await expect(this.page.locator('body')).toContainText(/MY CART|YOUR ORDER|Cart/i);
  }

  async verifyStoreInCart(storeName: string): Promise<void> {
    const cleanStore = storeName.trim();
    const bodyText = await this.page.locator('body').innerText();
    if (bodyText.toLowerCase().includes(cleanStore.toLowerCase())) {
      expect(true).toBeTruthy();
    } else {
      const storeSnippet = cleanStore.split(/\s+/).slice(0, 2).join(' ');
      await expect(this.page.locator('body')).toContainText(new RegExp(storeSnippet, 'i'));
    }
  }

  async verifyAddressInCart(addressSnippet: string): Promise<void> {
    const street = addressSnippet.split(',')[0].trim();
    await expect(this.page.locator('body')).toContainText(street);
  }

  async verifyPickupMethodInCart(method: string = 'Pickup'): Promise<void> {
    await expect(this.page.locator('body')).toContainText(new RegExp(method, 'i'));
  }

  async verifyPickupScheduleInCart(date?: string, time?: string): Promise<void> {
    const bodyText = await this.page.locator('body').innerText();
    expect(bodyText).toMatch(/Scheduled for/i);

    // Verify time format (e.g. 12:15 AM)
    expect(bodyText).toMatch(/\d{1,2}:\d{2}\s*(?:AM|PM)/i);

    if (date && date.trim().length > 0 && !date.includes('Dynamic')) {
      const lowerBody = bodyText.toLowerCase();
      const dateSnippet = date.split(',')[0].trim();

      let dateMatched = lowerBody.includes(dateSnippet.toLowerCase());

      if (!dateMatched) {
        // Derive expected display date (e.g. "09/26/2026" -> "sep 26")
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const fullMonthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
        ];

        // Format: MM/DD/YYYY or M/D/YYYY or MM-DD-YYYY
        const match = dateSnippet.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/);
        if (match) {
          const monthIndex = parseInt(match[1], 10) - 1;
          const dayNum = parseInt(match[2], 10);

          if (monthIndex >= 0 && monthIndex < 12) {
            const shortMonth = monthNames[monthIndex];
            const fullMonth = fullMonthNames[monthIndex];
            const dateRegex = new RegExp(`(?:${shortMonth}|${fullMonth})\\s+0?${dayNum}\\b`, 'i');
            dateMatched = dateRegex.test(lowerBody);
          }
        } else {
          // If already textual or standard date string
          const parsedDate = new Date(dateSnippet);
          if (!isNaN(parsedDate.getTime())) {
            const shortMonth = monthNames[parsedDate.getMonth()];
            const fullMonth = fullMonthNames[parsedDate.getMonth()];
            const dayNum = parsedDate.getDate();
            const dateRegex = new RegExp(`(?:${shortMonth}|${fullMonth})\\s+0?${dayNum}\\b`, 'i');
            dateMatched = dateRegex.test(lowerBody);
          } else {
            // General word match fallback: check if both month name and day number appear in body
            const parts = dateSnippet.split(/\s+/);
            if (parts.length >= 2) {
              const monthPart = parts[0].toLowerCase().substring(0, 3);
              const dayPart = parts[1].replace(/\D/g, '');
              dateMatched = lowerBody.includes(monthPart) && lowerBody.includes(dayPart);
            }
          }
        }
      }

      expect(dateMatched, `Expected cart to contain scheduled pickup date derived from "${dateSnippet}", but not found in body text`).toBeTruthy();
    }

    if (time && time.trim().length > 0 && !time.includes('Dynamic')) {
      const timeSnippet = time.replace(/\s+/g, ' ').trim().toLowerCase();
      const normalizedTime = timeSnippet.replace(/^0(\d:\d{2})/, '$1');
      const paddedTime = timeSnippet.replace(/^(\d:\d{2})/, '0$1');
      const timeMatched = bodyText.toLowerCase().includes(timeSnippet) ||
                          bodyText.toLowerCase().includes(normalizedTime) ||
                          bodyText.toLowerCase().includes(paddedTime);
      expect(timeMatched, `Expected cart to contain pickup time "${time}", but not found in body text`).toBeTruthy();
    }
  }

  async verifyProductInCart(productName: string): Promise<void> {
    const regex = new RegExp(productName.replace(/®/g, ''), 'i');
    await expect(this.page.locator('body')).toContainText(regex);
  }

  async verifyQuantityInCart(): Promise<void> {
    const bodyText = await this.page.locator('body').innerText();
    // Look for quantity text or counter
    const hasQty = /\b(?:Qty|Quantity|\d+\s*item|\$?\d+\.\d{2})\b/i.test(bodyText);
    expect(hasQty).toBeTruthy();
  }

  async verifyPriceDisplayed(): Promise<void> {
    const bodyText = await this.page.locator('body').innerText();
    const hasPrice = /\$\d+\.\d{2}/.test(bodyText) && /Subtotal|Total|CHECKOUT/i.test(bodyText);
    expect(hasPrice).toBeTruthy();
  }

  async proceedToCheckout(): Promise<void> {
    const checkoutBtn = this.page.locator('#cart_checkout_button').first();
    await expect(checkoutBtn).toBeVisible({ timeout: 15000 });
    console.log('[CART] Proceeding to Checkout...');
    await checkoutBtn.click();
    await this.page.waitForTimeout(4000);

    // In case an intermediate modal appears (e.g. Continue as Guest, or Leave)
    const continueBtn = this.page.locator('button:has-text("CONTINUE"), button:has-text("YES, LEAVE")').first();
    if (await continueBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await continueBtn.click().catch(() => {});
      await this.page.waitForTimeout(2000);
    }
  }
}
