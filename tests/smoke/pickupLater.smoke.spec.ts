import { test, expect } from '../../fixtures/testFixtures';
import { testStoreData } from '../../utils/testData';

test.describe('Smoke 4 – Pickup & Pickup Later Scheduling', () => {
  test('smoke: user can select Carvel Qu Sandbox and configure Pickup Later with dynamic date/time', async ({ storeLocatorPage, pickupPage, page }) => {
    await storeLocatorPage.navigate();
    await storeLocatorPage.searchAndSelectStore(testStoreData.address, testStoreData.name);
    await storeLocatorPage.verifyStoreSelected(testStoreData.name);

    const schedule = await pickupPage.configurePickupLaterJourney();
    console.log(`[TEST LOG] Dynamically selected future date: ${schedule.date}, time: ${schedule.time}`);

    await expect(page.locator('body')).toContainText(testStoreData.name);
  });
});
