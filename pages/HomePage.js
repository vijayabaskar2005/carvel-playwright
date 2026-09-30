const { expect } = require('@playwright/test');
const { Header } = require('./Header');

class HomePage {
  constructor(page) {
    this.page = page;
    this.header = new Header(page);
  }

  async navigate() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/car\.uat\.focusbrands\.com/);
    await this.header.verifyHeaderVisible();
  }
}

module.exports = { HomePage };
