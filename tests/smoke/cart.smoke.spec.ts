import { test, expect } from '../../fixtures/testFixtures';
import { testStoreData, testProductData } from '../../utils/testData';

test.describe('Smoke 7 – Add to Cart & Cart Validation', () => {
  test('smoke: user can add customized product to cart and verify cart contents', async ({ storeLocatorPage, menuPage, productListingPage, productDetailPage, cartPage }) => {
    await storeLocatorPage.navigate();
    await storeLocatorPage.searchAndSelectStore(testStoreData.address, testStoreData.name);

    await menuPage.selectCategory(testProductData.categoryName);
    await productListingPage.selectProduct(testProductData.productName);

    await productDetailPage.verifyPDPLoaded();
    await productDetailPage.selectSizeAndFlavor(testProductData.size, testProductData.flavor);
    await productDetailPage.addToCart();

    await cartPage.verifyCartLoaded();
    await cartPage.verifyStoreInCart(testStoreData.name);
  });
});
