import { test, expect } from '../../fixtures/testFixtures';
import { testStoreData } from '../../utils/testData';

test.describe('Smoke 4 – Pickup & Pickup Later Scheduling', () => {
  test('smoke: user can select Linked Sandbox Carvel Vendor and configure Pickup Later with dynamic date/time', async ({ storeLocatorPage, pickupPage, page }) => {
    await storeLocatorPage.navigate();
    await storeLocatorPage.searchAndSelectStore(testStoreData.searchQuery, testStoreData.name, testStoreData.address);
    await storeLocatorPage.verifyStoreSelected(testStoreData.name);

    const schedule = await pickupPage.configurePickupLaterJourney();
    console.log(`[TEST LOG] Dynamically selected future date: ${schedule.date}, time: ${schedule.time}`);

    await expect(page.locator('body')).toContainText(testStoreData.name);
  });
});
