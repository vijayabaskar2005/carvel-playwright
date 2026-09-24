import { test, expect } from '../../fixtures/testFixtures';
import { testStoreData } from '../../utils/testData';

test.describe('Smoke 5 – Menu & Product Listing Page (PLP)', () => {
  test('smoke: user can view menu categories and load ice cream category PLP', async ({ storeLocatorPage, menuPage, productListingPage, page }) => {
    await storeLocatorPage.navigate();
    await storeLocatorPage.searchAndSelectStore(testStoreData.address, testStoreData.name);

    await menuPage.verifyMenuLoaded();
    await menuPage.selectCategory('Ice Cream');

    await expect(page).toHaveURL(/ice-cream/);
    await productListingPage.verifyProductsDisplayed();
  });
});
