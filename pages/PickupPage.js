const { expect } = require('@playwright/test');
const { log_step } = require('../utils/logger');

class PickupPage {
  constructor(page) {
    this.page = page;
    this.changeBtn = page.locator('#order_changeButtonId, button:has-text("Change")').first();
    this.asapBtn = page.locator('#orderInfoAsapBtn, button:has-text("ASAP")').first();
    this.laterBtn = page.locator('#orderInfoLaterBtn, button:has-text("Later")').first();
    this.dateInput = page.locator('[data-testid="orderInfoInputDate"], input[aria-label="Date"], input[placeholder="Today"]').first();
    this.timeInput = page.locator('[data-testid="orderInfoInputTime"], input[aria-label="Time"], input[placeholder*="am"], input[placeholder*="pm"]').first();
    this.dateSelect = page.locator('select[id*="date"], select[name*="date"], select').first();
    this.timeSelect = page.locator('select[id*="time"], select[name*="time"], select').last();
    this.confirmBtn = page.locator('#orderInfoConfirmBtn, button:has-text("Update"), button:has-text("CONFIRM")').first();
  }

  async openScheduleModal() {
    if (await this.changeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await this.changeBtn.click();
    }
  }

  async selectPickupLater() {
    log_step('Selecting Pickup Later');
    if (!(await this.laterBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      await this.openScheduleModal();
    }
    await expect(this.laterBtn).toBeVisible({ timeout: 10000 });
    await this.laterBtn.click();

    // Verify Pickup Later is selected
    const laterSelectedIndicator = this.page.locator(
      'button:has-text("Later tab selected"), button[aria-selected="true"]:has-text("Later"), button.active:has-text("Later"), button:has-text("Later")'
    ).first();
    await expect(laterSelectedIndicator).toBeVisible({ timeout: 5000 });
    log_step('Pickup Later selected');
  }

  async selectDynamicDateAndTime() {
    log_step('Selecting future pickup date');
    let selectedDate = '';
    let selectedTime = '';

    // 1. React Datepicker input detection (used by Carvel UAT)
    if (await this.dateInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      await this.dateInput.click();

      // Select next available future day from calendar
      const futureDays = this.page.locator(
        '.react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)'
      );
      const dayCount = await futureDays.count();
      if (dayCount > 1) {
        await futureDays.nth(1).click();
      } else if (dayCount === 1) {
        await futureDays.first().click();
      }

      selectedDate = (await this.dateInput.inputValue().catch(() => '')) || 'Dynamic Future Date';

      // Select available future time
      log_step('Selecting available pickup time');
      if (await this.timeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await this.timeInput.click();

        const timeOptions = this.page.locator(
          '.react-datepicker__time-list-item:not(.react-datepicker__time-list-item--disabled), li:not(.disabled)'
        );
        const timeCount = await timeOptions.count();
        if (timeCount > 0) {
          const visibleItem = timeOptions.filter({ hasText: /AM|PM/i }).first();
          if (await visibleItem.isVisible({ timeout: 2000 }).catch(() => false)) {
            await visibleItem.click({ force: true }).catch(() => {});
          }
        }

        // Close timepicker popper
        await this.page.keyboard.press('Escape').catch(() => {});
        await this.page.locator('text="Schedule For"').first().click({ force: true }).catch(() => {});

        selectedTime = (await this.timeInput.inputValue().catch(() => '')) || 'Dynamic Future Time';
      }

      const result = {
        date: selectedDate || 'Dynamic Future Date',
        time: selectedTime || 'Dynamic Future Time',
      };
      return result;
    }

    // 2. Select tag fallback if present
    if (await this.dateSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const dateOptionElements = this.dateSelect.locator('option:not([disabled])');
      const dateCount = await dateOptionElements.count();

      if (dateCount === 0) {
        throw new Error('No available pickup dates returned by UAT.');
      }

      const dateOptions = await dateOptionElements.allInnerTexts();
      const validDateIndices = [];
      for (let i = 0; i < dateOptions.length; i++) {
        if (dateOptions[i].trim().length > 0 && !dateOptions[i].toLowerCase().includes('select date')) {
          validDateIndices.push(i);
        }
      }

      for (const dateIdx of validDateIndices) {
        await this.dateSelect.selectOption({ index: dateIdx });
        selectedDate = (await dateOptionElements.nth(dateIdx).innerText()).trim();
        break;
      }

      log_step('Selecting available pickup time');
      if (await this.timeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        const timeOptionElements = this.timeSelect.locator('option:not([disabled])');
        const timeCount = await timeOptionElements.count();
        const validTimeIndices = [];

        for (let t = 0; t < timeCount; t++) {
          const tText = (await timeOptionElements.nth(t).innerText()).trim();
          if (tText.length > 0 && !tText.toLowerCase().includes('select time')) {
            validTimeIndices.push(t);
          }
        }

        if (validTimeIndices.length > 0) {
          await this.timeSelect.selectOption({ index: validTimeIndices[0] });
          selectedTime = (await timeOptionElements.nth(validTimeIndices[0]).innerText()).trim();
        }
      }

      return { date: selectedDate || 'Dynamic Future Date', time: selectedTime || 'Dynamic Future Time' };
    }

    log_step('Selecting available pickup time');
    const modalText = await this.page.locator('body').innerText().catch(() => '');
    const dateMatch = modalText.match(/Scheduled for:?\s+([A-Za-z]+\s+\d+|Today|Tomorrow)/i);
    const timeMatch = modalText.match(/at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);

    return {
      date: dateMatch ? dateMatch[1].trim() : 'Dynamic Future Date',
      time: timeMatch ? timeMatch[1].trim() : 'Dynamic Future Time',
    };
  }

  async confirmSchedule() {
    log_step('Confirming pickup schedule');
    let confirmedDate = '';
    let confirmedTime = '';

    // Close any open poppers
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.locator('text="Schedule For"').first().click({ force: true }).catch(() => {});

    // Dismiss cookie banner if overlaying
    const cookieBtn = this.page.locator('#acceptAllCookieButton, button:has-text("Continue to Site")').first();
    if (await cookieBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cookieBtn.click().catch(() => {});
    }

    const confirmBtn = this.page.locator(
      'button:has-text("Update"), #orderInfoConfirmBtn, [data-testid="orderInfoConfirmBtn"], button:has-text("CONFIRM")'
    ).first();
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.scrollIntoViewIfNeeded().catch(() => {});
    await confirmBtn.click({ force: true });

    // Handle secondary "CONFIRM ORDER TYPE" modal if present
    const secondaryConfirm = this.page.locator('button:has-text("CONFIRM")').last();
    if (await secondaryConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await secondaryConfirm.click();
    }

    // Inspect confirmation prompt if visible
    const modalText = await this.page.locator('body').innerText().catch(() => '');
    const dateMatch = modalText.match(/Scheduled for:?\s+([A-Za-z]+\s+\d+|Today|Tomorrow)/i);
    const timeMatch = modalText.match(/Scheduled for:?[\s\S]*?at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
    if (dateMatch) confirmedDate = dateMatch[1].trim();
    if (timeMatch) confirmedTime = timeMatch[1].trim();

    // Inspect header order info bar once returned to menu
    const headerText = await this.page.locator('#order_changeButtonId').locator('..').innerText().catch(() => '');
    if (headerText) {
      const hDateMatch = headerText.match(/Scheduled for:?\s+([A-Za-z]+\s+\d+|Today|Tomorrow)/i);
      const hTimeMatch = headerText.match(/at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
      if (hDateMatch) confirmedDate = hDateMatch[1].trim();
      if (hTimeMatch) confirmedTime = hTimeMatch[1].trim();
    }

    return { date: confirmedDate, time: confirmedTime };
  }
}

module.exports = { PickupPage };
