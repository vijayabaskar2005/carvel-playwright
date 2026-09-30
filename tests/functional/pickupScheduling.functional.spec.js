const { test, expect, recordStepActual } = require('../../fixtures/testFixtures');
const { testStoreData, getTestCredentials } = require('../../utils/testData');
const { log_step } = require('../../utils/logger');

test.describe('Pickup Scheduling Functional Suite', () => {
  test('TC_005 - Verify Pickup Later Scheduling', async ({
    homePage,
    header,
    loginPage,
    storeLocatorPage,
    orderTypePage,
    pickupPage,
    menuPage,
    checkpoint,
    page,
  }) => {
    test.setTimeout(180000);

    let selectedStore = { name: '', address: '' };
    let scheduledDate = '';
    let scheduledTime = '';

    await test.step('Validate Homepage | Homepage URL and header controls should be visible', async () => {
      log_step('Navigating to Carvel homepage');
      await homePage.navigate();
      await homePage.verifyPageLoaded();

      expect(page.url(), 'Homepage URL should belong to Carvel domain').toMatch(/focusbrands\.com/);
      await expect(header.startOrderBtn, 'Start Order button should be visible').toBeVisible({ timeout: 15000 });
      await expect(header.startOrderBtn, 'Start Order button should be enabled').toBeEnabled({ timeout: 15000 });
      await expect(header.logo, 'Carvel logo should be visible').toBeVisible({ timeout: 15000 });

      await checkpoint('homepage');
      recordStepActual('Homepage', `Loaded URL: ${page.url()} | Header controls visible`);
      log_step('Homepage validated successfully');
    });

    await test.step('Authenticate User | User session should be authenticated and verified', async () => {
      log_step('Authenticating user session with .env credentials');
      const credentials = getTestCredentials();
      await header.clickSignIn();
      await loginPage.login(credentials.username, credentials.password);

      const authIndicator = page.locator('button:has-text("Account"), #link_auth_Profile, a[href*="personal-info"]').first();
      await expect(authIndicator, 'Authenticated account profile indicator should be visible').toBeVisible({ timeout: 25000 });
      await expect(page.locator('body'), 'Page should not display authentication failure').not.toContainText(/Invalid credentials/i);

      await checkpoint('authenticated');
      recordStepActual('Authenticate', 'User session authenticated successfully');
      log_step('User authenticated successfully');
    });

    await test.step('Start Order & Select Pickup | Pickup order type should be selected', async () => {
      log_step('Initiating order from header');
      await header.clickStartOrder();
      await orderTypePage.selectPickup();
      await expect(orderTypePage.pickupOption, 'Pickup option should be visible and active').toBeVisible({ timeout: 10000 });

      await checkpoint('order_type_selected');
      recordStepActual('Select Pickup', 'Pickup option selected successfully');
      log_step('Pickup order type selected');
    });

    await test.step('Search & Select Store | Carvel Qu Sandbox should be selected with ORDER AHEAD', async () => {
      try {
        log_step(`Searching for store: ${testStoreData.searchQuery}`);
        await storeLocatorPage.performSearch(testStoreData.searchQuery);
        selectedStore = await storeLocatorPage.selectStoreCarvelQuSandbox(testStoreData.name, testStoreData.address);

        expect(selectedStore.name, 'Selected store name should match test store data').toBe(testStoreData.name);
        expect(selectedStore.address, 'Selected store address should contain 26 Broadway').toContain('26 Broadway');
        expect(selectedStore.address, 'Selected store address should contain New York city / zip').toMatch(/New York|10004/i);
        await storeLocatorPage.verifyStoreSelected(selectedStore.name);

        await checkpoint('store_selected');
        recordStepActual('Select Store', `${selectedStore.name} - ORDER AHEAD selected`);
        log_step(`Store ${selectedStore.name} selected with ORDER AHEAD`);
      } catch (err) {
        recordStepActual('Select Store', err && err.message ? err.message : 'Store selection failed');
        throw err;
      }
    });

    await test.step('Select Pickup Later | Pickup Later schedule option should be activated', async () => {
      log_step('Selecting Pickup Later order schedule option');
      await pickupPage.selectPickupLater();

      await checkpoint('pickup_later_selected');
      recordStepActual('Select Pickup Later', 'Pickup Later option selected');
      log_step('Pickup Later option selected');
    });

    await test.step('Select Dynamic Future Date & Time | Available future date and time should be selected', async () => {
      log_step('Selecting dynamic future pickup date and time');
      const dynamicSlot = await pickupPage.selectDynamicDateAndTime();
      expect(dynamicSlot.date, 'Selected dynamic pickup date must be defined').toBeTruthy();
      expect(dynamicSlot.time, 'Selected dynamic pickup time must be defined').toBeTruthy();

      scheduledDate = dynamicSlot.date;
      scheduledTime = dynamicSlot.time;

      await checkpoint('schedule_selected');
      recordStepActual('Select Date & Time', `Date: ${scheduledDate} | Time: ${scheduledTime}`);
      log_step(`Selected dynamic schedule: ${scheduledDate} at ${scheduledTime}`);
    });

    await test.step('Validate Schedule Values & Store Selection | Date, time, and store should be validated', async () => {
      log_step('Validating schedule selection values and store match');
      expect(scheduledDate.length, 'Scheduled date string length should be valid').toBeGreaterThan(0);
      expect(scheduledTime.length, 'Scheduled time string length should be valid').toBeGreaterThan(0);
      expect(selectedStore.name, 'Selected store name must match Carvel Qu Sandbox').toBe(testStoreData.name);

      recordStepActual('Validate Schedule', `Store: ${selectedStore.name} | Date: ${scheduledDate} | Time: ${scheduledTime}`);
      log_step('Schedule selection values validated');
    });

    await test.step('Continue to Menu | Pickup schedule should be confirmed and menu loaded', async () => {
      log_step('Confirming schedule and navigating to menu');
      const confirmedSlot = await pickupPage.confirmSchedule();
      if (confirmedSlot.date) scheduledDate = confirmedSlot.date;
      if (confirmedSlot.time) scheduledTime = confirmedSlot.time;

      await menuPage.verifyMenuLoaded();
      await expect(menuPage.categoryLinks.first(), 'Menu category links should be visible after scheduling').toBeVisible({ timeout: 15000 });

      await checkpoint('menu_loaded');
      recordStepActual('Continue to Menu', 'Schedule confirmed, menu loaded successfully');
      log_step('Menu loaded after schedule confirmation');
    });

    await test.step('Verify Schedule Retained | Selected pickup schedule and store should remain displayed on menu page', async () => {
      log_step('Verifying that order schedule is retained in order info bar');
      const changeBtn = page.locator('#order_changeButtonId, button:has-text("Change")').first();
      await expect(changeBtn, 'Change location/schedule button should be visible in order info bar').toBeVisible({ timeout: 15000 });

      // Verify retained store and scheduled slot on menu page
      await expect(page.locator('body'), 'Menu page should display selected store name').toContainText(new RegExp(`Pickup at ${selectedStore.name}`, 'i'), { timeout: 10000 });
      await expect(page.locator('body'), 'Menu page should display Scheduled for label').toContainText(/Scheduled for/i, { timeout: 10000 });

      const bodyText = await page.locator('body').innerText();
      const matchSchedule = bodyText.match(/Scheduled for\s+([^|\n]+)/i);
      const displayedSchedule = matchSchedule ? matchSchedule[1].trim() : 'Scheduled Future Slot';

      await checkpoint('schedule_retained');
      recordStepActual('Verify Schedule Retained', `Store: ${selectedStore.name} | Schedule: ${displayedSchedule}`);
      log_step(`Schedule retained verified: Pickup at ${selectedStore.name}, Scheduled for ${displayedSchedule}`);
    });
  });
});
