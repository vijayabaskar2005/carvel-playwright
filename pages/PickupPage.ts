import { Page, Locator, expect } from '@playwright/test';

export class PickupPage {
  readonly page: Page;
  readonly changeBtn: Locator;
  readonly asapBtn: Locator;
  readonly laterBtn: Locator;
  readonly dateSelect: Locator;
  readonly timeSelect: Locator;
  readonly confirmBtn: Locator;
  readonly selectedStoreText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.changeBtn = page.locator('#order_changeButtonId, button:has-text("Change")').first();
    this.asapBtn = page.locator('#orderInfoAsapBtn, button:has-text("ASAP")').first();
    this.laterBtn = page.locator('#orderInfoLaterBtn, button:has-text("Later")').first();
    this.dateSelect = page.locator('select[id*="date"], select[name*="date"], select').first();
    this.timeSelect = page.locator('select[id*="time"], select[name*="time"], select').last();
    this.confirmBtn = page.locator('#orderInfoConfirmBtn, button:has-text("CONFIRM")').first();
    this.selectedStoreText = page.locator('body');
  }

  async openScheduleModal(): Promise<void> {
    if (await this.changeBtn.isVisible()) {
      await this.changeBtn.click();
      await this.page.waitForTimeout(2000);
    }
  }

  async selectPickupLater(): Promise<void> {
    if (!await this.laterBtn.isVisible()) {
      await this.openScheduleModal();
    }
    await expect(this.laterBtn).toBeVisible();
    await this.laterBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async selectAvailableFutureDate(): Promise<string> {
    let selectedDate = 'Default Future Date';
    if (await this.dateSelect.isVisible()) {
      const options = await this.dateSelect.locator('option').allInnerTexts();
      if (options.length > 1) {
        await this.dateSelect.selectOption({ index: 1 });
        selectedDate = options[1].trim();
        await this.page.waitForTimeout(1000);
      }
    }
    return selectedDate;
  }

  async selectAvailablePickupTime(): Promise<string> {
    let selectedTime = 'Default Future Time';
    if (await this.timeSelect.isVisible()) {
      const options = await this.timeSelect.locator('option').allInnerTexts();
      if (options.length > 1) {
        await this.timeSelect.selectOption({ index: 1 });
        selectedTime = options[1].trim();
        await this.page.waitForTimeout(1000);
      }
    }
    return selectedTime;
  }

  async confirmSchedule(): Promise<void> {
    if (await this.confirmBtn.isVisible()) {
      await this.confirmBtn.click();
      await this.page.waitForTimeout(3000);
    }
  }

  async configurePickupLaterJourney(): Promise<{ date: string; time: string }> {
    await this.selectPickupLater();
    const date = await this.selectAvailableFutureDate();
    const time = await this.selectAvailablePickupTime();
    await this.confirmSchedule();
    return { date, time };
  }
}
