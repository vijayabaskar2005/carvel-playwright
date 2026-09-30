const { expect } = require('@playwright/test');
const { log_step } = require('../utils/logger');

class MenuPage {
  constructor(page) {
    this.page = page;
    this.categoryLinks = page.locator('a#menuPageList, a.menuCat');
    this.iceCreamCategory = page.locator('a#menuPageList[href*="/ice-cream"], a[href*="/ice-cream"]').first();
    this.sundaesShakesCategory = page.locator('a#menuPageList[href*="/sundaes-shakes"], a[href*="/sundaes-shakes"]').first();
    this.readyNowCakesCategory = page.locator('a#menuPageList[href*="/ready-now-cakes"], a[href*="/ready-now-cakes"]').first();
    this.carvelBundlesCategory = page.locator('a#menuPageList[href*="/carvel-bundles"], a[href*="/carvel-bundles"]').first();
  }

  async verifyMenuLoaded() {
    log_step('Verifying Menu page is loaded');
    if (this.page.url().includes('order-info') || this.page.url().includes('store-search')) {
      const confirmBtn = this.page.locator('#orderInfoConfirmBtn, [data-testid="orderInfoConfirmBtn"], button:has-text("CONFIRM"), button:has-text("Update")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click({ force: true }).catch(() => {});
      }
      await this.page.waitForURL(/menu/, { timeout: 25000 });
    }
    await expect(this.page).toHaveURL(/menu/);
    await expect(this.categoryLinks.first()).toBeVisible({ timeout: 15000 });
  }

  async selectCategory(categoryName) {
    log_step(`Selecting menu category: "${categoryName}"`);
    const categoryLink = this.page.locator(
      `a#menuPageList:has-text("${categoryName}"), a[href*="/${categoryName.toLowerCase().replace(/\s+/g, '-')}"]`
    ).first();
    await expect(categoryLink).toBeVisible({ timeout: 15000 });
    await categoryLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = { MenuPage };
