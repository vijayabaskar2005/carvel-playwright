import { test, expect } from '../../fixtures/testFixtures';
import { testStoreData, testProductData } from '../../utils/testData';

test.describe('Primary E2E Smoke Journey – Carvel Pickup Later Order Journey', () => {
  test('smoke: complete critical user journey from homepage to cart via pickup later', async ({
    homePage,
    header,
    storeLocatorPage,
    orderTypePage,
    pickupPage,
    menuPage,
    productListingPage,
    productDetailPage,
    cartPage,
    checkoutPage,
    page
  }) => {
    // 1. Open Carvel Homepage
    console.log('[STEP 1] Navigating to Carvel Homepage...');
    await homePage.navigate();
    await homePage.verifyPageLoaded();

    // 2. Start Order
    console.log('[STEP 2] Clicking Start Order...');
    await header.clickStartOrder();

    // 3. Select Pickup Order Type
    console.log('[STEP 3] Verifying Pickup Order Type...');
    await orderTypePage.selectPickup();

    // 4. Search and Select Carvel Qu Sandbox (26 Broadway, New York, NY 10004)
    console.log('[STEP 4] Searching & selecting Carvel Qu Sandbox (26 Broadway, New York, NY 10004)...');
    await storeLocatorPage.searchAndSelectStore(testStoreData.address, testStoreData.name);
    await storeLocatorPage.verifyStoreSelected(testStoreData.name);

    // 5. Select Pickup Later & Dynamically Select Future Date & Time
    console.log('[STEP 5] Configuring Pickup Later with dynamic future date and time...');
    const schedule = await pickupPage.configurePickupLaterJourney();
    console.log(`[SCHEDULED] Pickup Date: ${schedule.date} | Time: ${schedule.time}`);

    // 6. Navigate Menu Category (Ice Cream)
    console.log('[STEP 6] Opening Menu & Ice Cream Category...');
    await menuPage.verifyMenuLoaded();
    await menuPage.selectCategory(testProductData.categoryName);

    // 7. Select Product (SCOOPED ICE CREAM)
    console.log('[STEP 7] Selecting product card on PLP...');
    await productListingPage.selectProduct(testProductData.productName);

    // 8. Open PDP & Customize (Size & Flavor)
    console.log('[STEP 8] Customizing product options on PDP...');
    await productDetailPage.verifyPDPLoaded();
    await productDetailPage.selectSizeAndFlavor(testProductData.size, testProductData.flavor);

    // 9. Add to Cart
    console.log('[STEP 9] Adding product to Cart...');
    await productDetailPage.addToCart();

    // 10. Verify Cart & Order State
    console.log('[STEP 10] Verifying Cart contents, store, and pickup details...');
    await cartPage.verifyCartLoaded();
    await cartPage.verifyStoreInCart(testStoreData.name);

    // 11. Checkout Entry Point Check (Stop before payment/place order)
    console.log('[STEP 11] Verifying Checkout entry point readiness...');
    await checkoutPage.verifyCheckoutEntryPoint();

    console.log('[E2E SMOKE SUCCESS] Primary E2E Pickup Later Smoke Test executed successfully!');
  });
});
