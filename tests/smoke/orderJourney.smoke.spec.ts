import { test, expect } from '../../fixtures/testFixtures';
import { testStoreData, testProductData, getTestCredentials } from '../../utils/testData';

test.describe('PRIMARY E2E SMOKE FLOW — PICKUP LATER', () => {
  test('smoke: execute end-to-end pickup later journey with Linked Sandbox Carvel Vendor', async ({
    homePage,
    header,
    loginPage,
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
    // Telemetry monitoring for console and network errors (>=400)
    const consoleErrors: string[] = [];
    const networkErrors: { method: string; url: string; status: number }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('response', (res) => {
      if (res.status() >= 400) {
        networkErrors.push({
          method: res.request().method(),
          url: res.url(),
          status: res.status()
        });
      }
    });

    // 1. Carvel Homepage
    console.log('[STEP 1] Navigating to Carvel Homepage...');
    await homePage.navigate();
    await homePage.verifyPageLoaded();

    // 2. Sign In Check
    console.log('[STEP 2] Checking Sign In entry point & readiness...');
    await header.clickSignIn();
    await loginPage.verifyLoginPageLoaded();
    console.log('[INFO] Sign In entry point verified. Proceeding via customer order journey...');
    await loginPage.continueAsGuest();

    // 3. Start Order
    console.log('[STEP 3] Clicking Start Order...');
    await header.clickStartOrder();

    // 4. Select Pickup
    console.log('[STEP 4] Selecting Pickup order type...');
    await orderTypePage.selectPickup();

    // 5. Select Store & Verify Store Name AND Address (Linked Sandbox Carvel Vendor)
    console.log(`[STEP 5] Searching for store: ${testStoreData.name} at ${testStoreData.address}...`);
    await storeLocatorPage.searchAndSelectStore(
      testStoreData.searchQuery,
      testStoreData.name,
      testStoreData.address
    );
    await storeLocatorPage.verifyStoreSelected(testStoreData.name);
    console.log(`[STORE VERIFIED] Name: ${testStoreData.name} | Address: ${testStoreData.address}`);

    // 6. Select "Pickup Later"
    console.log('[STEP 6] Selecting "Pickup Later"...');
    await pickupPage.selectPickupLater();

    // 7 & 8. Select available future pickup date & time dynamically (no hardcoding)
    console.log('[STEP 7 & 8] Dynamically identifying available future pickup date and time...');
    const dynamicDate = await pickupPage.selectAvailableFutureDate();
    const dynamicTime = await pickupPage.selectAvailablePickupTime();
    console.log(`[DYNAMIC SCHEDULE DETECTED] Date: "${dynamicDate}" | Time: "${dynamicTime}"`);

    // 9. Confirm pickup schedule (handles any secondary confirm order type prompt)
    console.log('[STEP 9] Confirming pickup schedule...');
    const confirmedSchedule = await pickupPage.confirmSchedule();
    const finalDate = confirmedSchedule.date || dynamicDate;
    const finalTime = confirmedSchedule.time || dynamicTime;
    console.log(`[DYNAMIC SCHEDULE CONFIRMED] Date: "${finalDate}" | Time: "${finalTime}"`);

    // 10. Navigate to Menu / PLP
    console.log(`[STEP 10] Navigating to Menu and selecting category "${testProductData.categoryName}"...`);
    await menuPage.verifyMenuLoaded();
    await menuPage.selectCategory(testProductData.categoryName);

    // 11. Select a product
    console.log(`[STEP 11] Selecting product "${testProductData.productName}" on PLP...`);
    await productListingPage.selectProduct(testProductData.productName);

    // 12 & 13. Open PDP & Customize product if customization is available
    console.log('[STEP 12 & 13] Opening PDP and customizing product options...');
    await productDetailPage.verifyPDPLoaded();
    await productDetailPage.selectSizeAndFlavor(testProductData.size, testProductData.flavor);

    // 14. Add product to Cart
    console.log('[STEP 14] Adding product to Cart...');
    await productDetailPage.addToCart();

    // 15. Open Cart / Checkout
    console.log('[STEP 15] Opening Cart drawer/view...');
    await cartPage.verifyCartLoaded();

    // 16. Verify: Store, Method, Date, Time, Product, Price
    console.log('[STEP 16] Verifying all required Cart details...');
    await cartPage.verifyStoreInCart(testStoreData.name);
    await cartPage.verifyAddressInCart(testStoreData.address);
    await cartPage.verifyPickupMethodInCart('Pickup');
    await cartPage.verifyPickupScheduleInCart(finalDate, finalTime);
    await cartPage.verifyProductInCart(testProductData.productName);
    await cartPage.verifyPriceDisplayed();

    // 17. Verify Checkout entry point (Do NOT proceed to real payment or place order)
    console.log('[STEP 17] Verifying Checkout entry point readiness without placing order...');
    await checkoutPage.verifyCheckoutEntryPoint();

    // Report Network and Console Telemetry separately
    console.log('\n================ TELEMETRY MONITORING REPORT ================');
    console.log(`Console Errors Logged: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Sample Console Errors:', consoleErrors.slice(0, 3));
    }
    console.log(`HTTP 4xx/5xx Network Errors Logged: ${networkErrors.length}`);
    if (networkErrors.length > 0) {
      console.log('Detailed HTTP Error Responses (>= 400):');
      networkErrors.forEach((err, idx) => {
        console.log(`  [${idx + 1}] HTTP ${err.status} | ${err.method} ${err.url}`);
      });
    }
    console.log('=============================================================\n');

    console.log('[E2E SUCCESS] PRIMARY E2E SMOKE FLOW — PICKUP LATER COMPLETED SUCCESSFULLY!');
  });
});
