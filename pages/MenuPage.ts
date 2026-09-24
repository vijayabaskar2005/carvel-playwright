import { Page, Locator, expect } from '@playwright/test';

export class MenuPage {
  readonly page: Page;
  readonly categoryLinks: Locator;
  readonly iceCreamCategory: Locator;
  readonly sundaesShakesCategory: Locator;
  readonly readyNowCakesCategory: Locator;
  readonly carvelBundlesCategory: Locator;

  constructor(page: Page) {
    this.page = page;
    this.categoryLinks = page.locator('a#menuPageList, a.menuCat');
    this.iceCreamCategory = page.locator('a#menuPageList[href*="/ice-cream"], a[href*="/ice-cream"]').first();
    this.sundaesShakesCategory = page.locator('a#menuPageList[href*="/sundaes-shakes"], a[href*="/sundaes-shakes"]').first();
    this.readyNowCakesCategory = page.locator('a#menuPageList[href*="/ready-now-cakes"], a[href*="/ready-now-cakes"]').first();
    this.carvelBundlesCategory = page.locator('a#menuPageList[href*="/carvel-bundles"], a[href*="/carvel-bundles"]').first();
  }

  async verifyMenuLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/menu/);
    await expect(this.iceCreamCategory).toBeVisible();
  }

  async selectCategory(categoryName: string = 'Ice Cream'): Promise<void> {
    const categoryLink = this.page.locator(`a#menuPageList:has-text("${categoryName}"), a[href*="/${categoryName.toLowerCase().replace(/\s+/g, '-')}"]`).first();
    await expect(categoryLink).toBeVisible();
    await categoryLink.click();
    await this.page.waitForTimeout(3000);
  }
}
