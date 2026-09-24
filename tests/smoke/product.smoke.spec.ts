import { test, expect } from '../../fixtures/testFixtures';
import { testStoreData, testProductData } from '../../utils/testData';

test.describe('Smoke 6 – Product Detail Page (PDP)', () => {
  test('smoke: user can open product details and select customization options', async ({ storeLocatorPage, menuPage, productListingPage, productDetailPage }) => {
    await storeLocatorPage.navigate();
    await storeLocatorPage.searchAndSelectStore(testStoreData.address, testStoreData.name);

    await menuPage.selectCategory(testProductData.categoryName);
    await productListingPage.selectProduct(testProductData.productName);

    await productDetailPage.verifyPDPLoaded();
    await productDetailPage.selectSizeAndFlavor(testProductData.size, testProductData.flavor);
  });
});
