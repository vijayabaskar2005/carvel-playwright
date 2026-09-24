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
    await expect(this.laterBtn).toBeVisible({ timeout: 10000 });
    await this.laterBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async selectAvailableFutureDate(): Promise<string> {
    let selectedDate = '';
    if (await this.dateSelect.isVisible()) {
      const options = await this.dateSelect.locator('option').allInnerTexts();
      if (options.length > 1) {
        await this.dateSelect.selectOption({ index: 1 });
        selectedDate = options[1].trim();
      } else if (options.length === 1) {
        selectedDate = options[0].trim();
      }
      await this.page.waitForTimeout(1000);
    } else {
      const modalText = await this.page.locator('body').innerText();
      const match = modalText.match(/Scheduled for:?\s+([A-Za-z]+\s+\d+|Today|Tomorrow)/i);
      selectedDate = match ? match[1].trim() : 'Dynamic Future Date';
    }
    return selectedDate;
  }

  async selectAvailablePickupTime(): Promise<string> {
    let selectedTime = '';
    if (await this.timeSelect.isVisible()) {
      const options = await this.timeSelect.locator('option').allInnerTexts();
      if (options.length > 1) {
        await this.timeSelect.selectOption({ index: 1 });
        selectedTime = options[1].trim();
      } else if (options.length === 1) {
        selectedTime = options[0].trim();
      }
      await this.page.waitForTimeout(1000);
    } else {
      const modalText = await this.page.locator('body').innerText();
      const match = modalText.match(/Scheduled for:?[\s\S]*?at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
      selectedTime = match ? match[1].trim() : 'Dynamic Future Time';
    }
    return selectedTime;
  }

  async confirmSchedule(): Promise<{ date: string; time: string }> {
    let confirmedDate = '';
    let confirmedTime = '';

    if (await this.confirmBtn.isVisible()) {
      await this.confirmBtn.click();
      await this.page.waitForTimeout(2000);
    }

    // Inspect confirmation prompt if visible
    const modalText = await this.page.locator('body').innerText();
    const dateMatch = modalText.match(/Scheduled for:?\s+([A-Za-z]+\s+\d+|Today|Tomorrow)/i);
    const timeMatch = modalText.match(/Scheduled for:?[\s\S]*?at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
    if (dateMatch) confirmedDate = dateMatch[1].trim();
    if (timeMatch) confirmedTime = timeMatch[1].trim();

    // Secondary confirm button on "CONFIRM ORDER TYPE" modal
    const secondaryConfirm = this.page.locator('button:has-text("CONFIRM")').last();
    if (await secondaryConfirm.isVisible()) {
      await secondaryConfirm.click();
      await this.page.waitForTimeout(3000);
    }

    // Also inspect header order info bar once returned to menu
    const headerText = await this.page.locator('#order_changeButtonId').locator('..').innerText().catch(() => '');
    if (headerText) {
      const hDateMatch = headerText.match(/Scheduled for:?\s+([A-Za-z]+\s+\d+|Today|Tomorrow)/i);
      const hTimeMatch = headerText.match(/at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
      if (hDateMatch) confirmedDate = hDateMatch[1].trim();
      if (hTimeMatch) confirmedTime = hTimeMatch[1].trim();
    }

    return { date: confirmedDate, time: confirmedTime };
  }

  async configurePickupLaterJourney(): Promise<{ date: string; time: string }> {
    await this.selectPickupLater();
    const date = await this.selectAvailableFutureDate();
    const time = await this.selectAvailablePickupTime();
    const confirmed = await this.confirmSchedule();
    return {
      date: confirmed.date || date,
      time: confirmed.time || time
    };
  }
}
