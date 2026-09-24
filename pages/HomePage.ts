import { Page, expect } from '@playwright/test';
import { Header } from './Header';

export class HomePage {
  readonly page: Page;
  readonly header: Header;

  constructor(page: Page) {
    this.page = page;
    this.header = new Header(page);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(2000);
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/Carvel/i);
    await expect(this.page).toHaveURL(/car\.uat\.focusbrands\.com/);
    await this.header.verifyHeaderVisible();
  }
}
