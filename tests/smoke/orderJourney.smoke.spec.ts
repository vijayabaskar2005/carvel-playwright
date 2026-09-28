import { test, expect } from '../../fixtures/testFixtures';
import { testStoreData, testProductData, getTestCredentials } from '../../utils/testData';

test.describe('PRIMARY E2E SMOKE FLOW — PICKUP LATER', () => {
  test('smoke: execute end-to-end pickup later journey with first available store', async ({
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
    test.setTimeout(180000);

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

    // 2. Real Authentication via Auth0 with .env credentials
    console.log('[STEP 2] Performing real Sign In with credentials from .env...');
    const credentials = getTestCredentials();
    await header.clickSignIn();
    await loginPage.login(credentials.username, credentials.password);
    console.log('[AUTH SUCCESS] User session authenticated successfully.');

    // 3. Start Order
    console.log('[STEP 3] Clicking Start Order...');
    await header.clickStartOrder();

    // 4. Select Pickup
    console.log('[STEP 4] Selecting Pickup order type...');
    await orderTypePage.selectPickup();

    // 5. Select FIRST AVAILABLE Store & Click ORDER AHEAD for "26 Broadway, New York, NY 10004, USA"
    console.log(`[STEP 5] Searching for stores near "${testStoreData.searchQuery}" and selecting FIRST available store card...`);
    const selectedStore = await storeLocatorPage.searchAndSelectStore(
      testStoreData.searchQuery,
      testStoreData.name,
      testStoreData.address
    );
    await storeLocatorPage.verifyStoreSelected(selectedStore.name);
    console.log(`[FIRST AVAILABLE STORE VERIFIED & ORDER AHEAD CLICKED] Name: "${selectedStore.name}" | Address: "${selectedStore.address}"`);

    // 6. Select "Pickup Later"
    console.log('[STEP 6] Selecting "Pickup Later"...');
    await pickupPage.selectPickupLater();

    // 7 & 8. Select available future pickup date & time dynamically
    console.log('[STEP 7 & 8] Dynamically selecting available future pickup date and time...');
    const dynamicSchedule = await pickupPage.selectDynamicDateAndTime();
    const dynamicDate = dynamicSchedule.date;
    const dynamicTime = dynamicSchedule.time;
    console.log(`[DYNAMIC SCHEDULE DETECTED] Date: "${dynamicDate}" | Time: "${dynamicTime}"`);

    // 9. Confirm pickup schedule
    console.log('[STEP 9] Confirming pickup schedule...');
    const confirmedSchedule = await pickupPage.confirmSchedule();
    const finalDate = confirmedSchedule.date || dynamicDate;
    const finalTime = confirmedSchedule.time || dynamicTime;
    console.log(`[DYNAMIC SCHEDULE CONFIRMED] Date: "${finalDate}" | Time: "${finalTime}"`);

    // 10. Navigate to Menu / PLP
    console.log(`[STEP 10] Navigating to Menu and selecting category "${testProductData.categoryName}"...`);
    await menuPage.verifyMenuLoaded();
    await menuPage.selectCategory(testProductData.categoryName);

    // 11. Select product on PLP
    console.log(`[STEP 11] Selecting product "${testProductData.productName}" on PLP...`);
    await productListingPage.selectProduct(testProductData.productName);

    // 12 & 13. Open PDP & Customize product options
    console.log('[STEP 12 & 13] Opening PDP and customizing product options...');
    await productDetailPage.verifyPDPLoaded();
    await productDetailPage.selectSizeAndFlavor(testProductData.size, testProductData.flavor);

    // 14. Add product to Cart
    console.log('[STEP 14] Adding product to Cart...');
    await productDetailPage.addToCart();

    // 15. Open Cart
    console.log('[STEP 15] Opening Cart drawer...');
    await cartPage.verifyCartLoaded();

    // 16. Verify Cart details
    console.log('[STEP 16] Verifying all required Cart details...');
    await cartPage.verifyStoreInCart(selectedStore.name);
    await cartPage.verifyAddressInCart(selectedStore.address);
    await cartPage.verifyPickupMethodInCart('Pickup');
    await cartPage.verifyPickupScheduleInCart(finalDate, finalTime);
    await cartPage.verifyProductInCart(testProductData.productName);
    await cartPage.verifyQuantityInCart();
    await cartPage.verifyPriceDisplayed();

    // 17. Proceed to Checkout
    console.log('[STEP 17] Proceeding to Checkout page...');
    await cartPage.proceedToCheckout();

    // 18. Verify Checkout Page Loaded & Details
    console.log('[STEP 18] Verifying Checkout page loaded and details...');
    await checkoutPage.verifyCheckoutPageLoaded();
    await checkoutPage.verifyCheckoutDetails(selectedStore.name, 'Pickup');

    // 19. Locate & Select Saved Card
    console.log('[STEP 19] Locating and verifying Saved Payment Card...');
    const savedCardResult = await checkoutPage.locateAndVerifySavedCard();
    console.log(`[SAVED CARD STATUS] Found: ${savedCardResult.found} | Selected: ${savedCardResult.selected}`);

    // 20. Place Order (Complete Purchase)
    console.log('[STEP 20] Submitting Order via Place Order button...');
    await checkoutPage.placeOrder();

    // 21. Order Confirmation & Verification
    console.log('[STEP 21] Verifying Order Confirmation and Order Creation...');
    const orderDetails = await checkoutPage.verifyOrderConfirmation(selectedStore.name, testProductData.productName);

    expect(orderDetails.confirmationNumber).toBeTruthy();
    expect(orderDetails.orderStatus).toBeTruthy();
    console.log(`[ORDER CREATED VERIFIED] Confirmation #: ${orderDetails.confirmationNumber} | Status: ${orderDetails.orderStatus} | Total: ${orderDetails.orderTotal}`);

    // Report Network and Console Telemetry separately
    console.log('\n================ TELEMETRY MONITORING REPORT ================');
    console.log(`Console Errors Logged: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Sample Console Errors:', consoleErrors.slice(0, 5));
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
