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
  readonly dateInput: Locator;
  readonly timeInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.changeBtn = page.locator('#order_changeButtonId').first();
    this.asapBtn = page.locator('#orderInfoAsapBtn').first();
    this.laterBtn = page.locator('#orderInfoLaterBtn').first();
    this.dateInput = page.locator('[data-testid="orderInfoInputDate"], input[aria-label="Date"]').first();
    this.timeInput = page.locator('[data-testid="orderInfoInputTime"], input[aria-label="Time"]').first();
    this.dateSelect = page.locator('select[id*="date"], select[name*="date"], select').first();
    this.timeSelect = page.locator('select[id*="time"], select[name*="time"], select').last();
    this.confirmBtn = page.locator('#orderInfoConfirmBtn').first();
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

  async selectDynamicDateAndTime(): Promise<{ date: string; time: string }> {
    console.log('[PICKUP LATER] Inspecting available pickup dates and times...');

    await this.page.waitForTimeout(1500);

    let selectedDate = '';
    let selectedTime = '';

    // 1. React Datepicker input detection (used by Carvel UAT)
    if (await this.dateInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      console.log('[PICKUP LATER] React Datepicker detected. Opening calendar...');
      await this.dateInput.click();
      await this.page.waitForTimeout(1000);

      // Select next available future day from calendar
      const futureDays = this.page.locator('.react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)');
      const dayCount = await futureDays.count();
      if (dayCount > 1) {
        // Select tomorrow or next available day
        await futureDays.nth(1).click();
        await this.page.waitForTimeout(1000);
      } else if (dayCount === 1) {
        await futureDays.first().click();
        await this.page.waitForTimeout(1000);
      }

      selectedDate = await this.dateInput.inputValue().catch(() => '');

      // Select available future time
      if (await this.timeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('[PICKUP LATER] Opening timepicker list...');
        await this.timeInput.click();
        await this.page.waitForTimeout(1000);

        const timeOptions = this.page.locator('.react-datepicker__time-list-item:not(.react-datepicker__time-list-item--disabled), li:not(.disabled)');
        const timeCount = await timeOptions.count();
        if (timeCount > 0) {
          const visibleItem = timeOptions.filter({ hasText: /AM|PM/i }).first();
          if (await visibleItem.isVisible().catch(() => false)) {
            await visibleItem.click({ force: true }).catch(() => {});
            await this.page.waitForTimeout(1000);
          }
        }

        // Close timepicker popper
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.locator('text="Schedule For"').first().click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(500);

        selectedTime = await this.timeInput.inputValue().catch(() => '');
      }

      console.log(`[DYNAMIC SCHEDULE] Selected Date: "${selectedDate}"`);
      console.log(`[DYNAMIC SCHEDULE] Selected Time: "${selectedTime}"`);
      return {
        date: selectedDate || 'Dynamic Future Date',
        time: selectedTime || 'Dynamic Future Time'
      };
    }

    // 2. Select tag fallback if present
    if (await this.dateSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const dateOptionElements = this.dateSelect.locator('option:not([disabled])');
      const dateCount = await dateOptionElements.count();

      if (dateCount === 0) {
        throw new Error('No available pickup dates returned by UAT.');
      }

      const dateOptions = await dateOptionElements.allInnerTexts();
      const validDateIndices: number[] = [];
      for (let i = 0; i < dateOptions.length; i++) {
        if (dateOptions[i].trim().length > 0 && !dateOptions[i].toLowerCase().includes('select date')) {
          validDateIndices.push(i);
        }
      }

      if (validDateIndices.length === 0) {
        throw new Error('No available pickup dates returned by UAT.');
      }

      let selectedDate = '';
      let selectedTime = '';

      // Try available dates until one has available times
      for (const dateIdx of validDateIndices) {
        await this.dateSelect.selectOption({ index: dateIdx });
        selectedDate = (await dateOptionElements.nth(dateIdx).innerText()).trim();
        console.log(`[PICKUP LATER] Selected date option [${dateIdx}]: "${selectedDate}". Inspecting available times...`);
        await this.page.waitForTimeout(1500);

        if (await this.timeSelect.isVisible({ timeout: 4000 }).catch(() => false)) {
          const timeOptionElements = this.timeSelect.locator('option:not([disabled])');
          const timeCount = await timeOptionElements.count();
          const validTimeIndices: number[] = [];

          for (let t = 0; t < timeCount; t++) {
            const tText = (await timeOptionElements.nth(t).innerText()).trim();
            if (tText.length > 0 && !tText.toLowerCase().includes('select time')) {
              validTimeIndices.push(t);
            }
          }

          if (validTimeIndices.length > 0) {
            // Pick an available time
            const chosenTimeIdx = validTimeIndices[0];
            await this.timeSelect.selectOption({ index: chosenTimeIdx });
            selectedTime = (await timeOptionElements.nth(chosenTimeIdx).innerText()).trim();
            console.log(`[DYNAMIC SCHEDULE] Selected Date: "${selectedDate}"`);
            console.log(`[DYNAMIC SCHEDULE] Selected Time: "${selectedTime}"`);
            break;
          } else {
            console.log(`[PICKUP LATER] No times available for date "${selectedDate}". Trying next available date...`);
          }
        }
      }

      if (!selectedTime) {
        // Fallback: check text in modal
        const modalText = await this.page.locator('body').innerText();
        const timeMatch = modalText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
        selectedTime = timeMatch ? timeMatch[1].trim() : 'Dynamic Future Time';
      }

      return { date: selectedDate || 'Dynamic Future Date', time: selectedTime };
    } else {
      const modalText = await this.page.locator('body').innerText();
      const dateMatch = modalText.match(/Scheduled for:?\s+([A-Za-z]+\s+\d+|Today|Tomorrow)/i);
      const timeMatch = modalText.match(/at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
      return {
        date: dateMatch ? dateMatch[1].trim() : 'Dynamic Future Date',
        time: timeMatch ? timeMatch[1].trim() : 'Dynamic Future Time'
      };
    }
  }

  async selectAvailableFutureDate(): Promise<string> {
    const res = await this.selectDynamicDateAndTime();
    return res.date;
  }

  async selectAvailablePickupTime(): Promise<string> {
    const res = await this.selectDynamicDateAndTime();
    return res.time;
  }

  async confirmSchedule(): Promise<{ date: string; time: string }> {
    let confirmedDate = '';
    let confirmedTime = '';

    // Close any open timepicker/datepicker poppers
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.locator('text="Schedule For"').first().click({ force: true }).catch(() => {});
    await this.page.waitForTimeout(500);

    // Dismiss cookie banner if overlaying
    const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
    if (await cookieBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }

    const confirmBtn = this.page.locator('#orderInfoConfirmBtn, [data-testid="orderInfoConfirmBtn"], button:has-text("CONFIRM")').first();
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.scrollIntoViewIfNeeded().catch(() => {});
    await confirmBtn.click({ force: true });
    await this.page.waitForTimeout(3000);

    // If secondary "CONFIRM ORDER TYPE" modal appears
    const secondaryConfirm = this.page.locator('button:has-text("CONFIRM")').last();
    if (await secondaryConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await secondaryConfirm.click();
      await this.page.waitForTimeout(3000);
    }

    // Inspect confirmation prompt if visible
    const modalText = await this.page.locator('body').innerText();
    const dateMatch = modalText.match(/Scheduled for:?\s+([A-Za-z]+\s+\d+|Today|Tomorrow)/i);
    const timeMatch = modalText.match(/Scheduled for:?[\s\S]*?at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
    if (dateMatch) confirmedDate = dateMatch[1].trim();
    if (timeMatch) confirmedTime = timeMatch[1].trim();



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
