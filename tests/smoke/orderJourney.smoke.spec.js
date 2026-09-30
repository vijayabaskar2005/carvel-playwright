const { test, expect, recordStepActual } = require('../../fixtures/testFixtures');
const { testStoreData, testProductData, getTestCredentials } = require('../../utils/testData');
const { log_step } = require('../../utils/logger');

test.describe('Primary End-to-End Smoke Suite', () => {
  test('TC_001 – Pickup Later Order Journey', async ({
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
    checkpoint,
    page,
  }) => {
    test.setTimeout(180000);

    let selectedStore = { name: '', address: '' };
    let finalDate = '';
    let finalTime = '';

    await test.step('Open Homepage | Homepage title and header should be visible', async () => {
      log_step('Navigating to Carvel homepage');
      await homePage.navigate();
      await homePage.verifyPageLoaded();

      expect(page.url(), 'Homepage URL should belong to Carvel domain').toMatch(/focusbrands\.com/);
      await expect(header.startOrderBtn, 'Start Order button should be visible on homepage').toBeVisible({ timeout: 15000 });
      await expect(header.startOrderBtn, 'Start Order button should be enabled for user ordering').toBeEnabled({ timeout: 15000 });
      await expect(header.logo, 'Carvel header brand logo should be visible').toBeVisible({ timeout: 15000 });

      await checkpoint('homepage');
      recordStepActual('Homepage', `Homepage loaded successfully: ${page.url()}`);
      log_step('Homepage verified successfully');
    });

    await test.step('Authenticate User | User should be authenticated', async () => {
      log_step('Authenticating user session with .env credentials');
      const credentials = getTestCredentials();
      await header.clickSignIn();
      await loginPage.login(credentials.username, credentials.password);

      const authIndicator = page.locator('button:has-text("Account"), #link_auth_Profile, a[href*="personal-info"]').first();
      await expect(authIndicator, 'Authenticated account profile indicator should be visible').toBeVisible({ timeout: 25000 });
      await expect(page.locator('body'), 'Page should not display authentication failure error').not.toContainText(/Invalid credentials/i);

      await checkpoint('authenticated');
      recordStepActual('Authenticate', 'User session authenticated successfully with active profile');
      log_step('User session authenticated successfully');
    });

    await test.step('Start Order | Start Order should be available and initiated', async () => {
      log_step('Initiating order from header');
      await header.clickStartOrder();
      await expect(orderTypePage.pickupOption, 'Pickup order type option should be visible after starting order').toBeVisible({ timeout: 20000 });

      recordStepActual('Start Order', 'Start Order initiated successfully');
      log_step('Start Order clicked successfully');
    });

    await test.step('Select Pickup | Pickup order type should be selected', async () => {
      log_step('Selecting Pickup order type');
      await orderTypePage.selectPickup();
      await expect(orderTypePage.pickupOption, 'Pickup option should remain selected').toBeVisible({ timeout: 10000 });

      await checkpoint('order_type_selected');
      recordStepActual('Select Pickup', 'Pickup option selected successfully');
      log_step('Pickup order type selected');
    });

    await test.step('Select Store | Carvel Qu Sandbox should be selected', async () => {
      try {
        log_step(`Searching for store: ${testStoreData.searchQuery}`);
        selectedStore = await storeLocatorPage.searchAndSelectStore(testStoreData.searchQuery);

        expect(selectedStore.name, 'Selected store name should match test store data').toBe(testStoreData.name);
        expect(selectedStore.address, 'Selected store address should contain 26 Broadway').toContain('26 Broadway');
        expect(selectedStore.address, 'Selected store address should contain New York city / zip').toMatch(/New York|10004/i);
        await storeLocatorPage.verifyStoreSelected(selectedStore.name);

        await checkpoint('store_selected');
        recordStepActual('Select Store', `${selectedStore.name} - ${selectedStore.address}`);
        log_step(`Store selected: ${selectedStore.name}`);
      } catch (err) {
        recordStepActual('Select Store', (err && err.message) || 'Store selection failed');
        throw err;
      }
    });

    await test.step('Select Pickup Later | Pickup later scheduling should be selected', async () => {
      log_step('Selecting Pickup Later order schedule option');
      await pickupPage.selectPickupLater();

      await checkpoint('pickup_later_selected');
      recordStepActual('Select Pickup Later', 'Pickup Later option selected');
      log_step('Pickup Later option selected');
    });

    await test.step('Select Date/Time | Available future date and time should be selected', async () => {
      log_step('Selecting dynamic future pickup date and time');
      const dynamicSlot = await pickupPage.selectDynamicDateAndTime();
      expect(dynamicSlot.date, 'Dynamic pickup date should not be empty').toBeTruthy();
      expect(dynamicSlot.time, 'Dynamic pickup time should not be empty').toBeTruthy();

      const confirmedSlot = await pickupPage.confirmSchedule();
      finalDate = confirmedSlot.date || dynamicSlot.date;
      finalTime = confirmedSlot.time || dynamicSlot.time;

      expect(finalDate, 'Confirmed pickup date must be populated').toBeTruthy();
      expect(finalTime, 'Confirmed pickup time must be populated').toBeTruthy();

      await checkpoint('pickup_schedule_selected');
      recordStepActual('Select Date/Time', `${finalDate} - ${finalTime}`);
      log_step(`Pickup schedule confirmed: ${finalDate} at ${finalTime}`);
    });

    await test.step('Select Product | Category and product should be selected from menu', async () => {
      log_step(`Navigating to category "${testProductData.categoryName}" and selecting product "${testProductData.productName}"`);
      await menuPage.verifyMenuLoaded();
      await menuPage.selectCategory(testProductData.categoryName);
      await productListingPage.selectProduct(testProductData.productName);
      await productDetailPage.verifyPDPLoaded();

      await expect(productDetailPage.productName, 'PDP product title should be visible').toBeVisible({ timeout: 15000 });
      const pdpTitle = await productDetailPage.productName.innerText();
      expect(pdpTitle.toLowerCase(), 'PDP product title should match expected product name').toContain(testProductData.productName.toLowerCase());

      await checkpoint('product_selected');
      recordStepActual('Select Product', `${testProductData.productName} selected from ${testProductData.categoryName}`);
      log_step(`Product "${testProductData.productName}" selected`);
    });

    await test.step('Customize Product | Product options should be configured', async () => {
      log_step(`Customizing product with size: "${testProductData.size}" and flavor: "${testProductData.flavor}"`);
      await productDetailPage.customizeProduct({
        size: testProductData.size,
        flavor: testProductData.flavor,
      });

      await expect(productDetailPage.addToCartBtn, 'Add to Cart button should be visible after customization').toBeVisible({ timeout: 15000 });
      await expect(productDetailPage.addToCartBtn, 'Add to Cart button should be enabled after customization').toBeEnabled({ timeout: 15000 });

      await checkpoint('product_customization_completed');
      recordStepActual('Customize Product', `Size: ${testProductData.size}, Flavor: ${testProductData.flavor}`);
      log_step('Product options customized successfully');
    });

    await test.step('Add to Cart | Customized product should be added to cart and verified', async () => {
      log_step('Adding customized product to cart and verifying cart drawer');
      await productDetailPage.addToCart();
      await cartPage.verifyCartLoaded();
      await cartPage.verifyStoreInCart(selectedStore.name);
      await cartPage.verifyAddressInCart(selectedStore.address);
      await cartPage.verifyPickupMethodInCart('Pickup');
      await cartPage.verifyPickupScheduleInCart(finalDate, finalTime);
      await cartPage.verifyProductInCart(testProductData.productName);
      await cartPage.verifyQuantityInCart();
      await cartPage.verifyPriceDisplayed();

      const drawerText = await cartPage.cartDrawer.innerText();
      expect(drawerText.toLowerCase(), 'Cart drawer should display customized size').toContain(testProductData.size.toLowerCase());
      expect(drawerText.toLowerCase(), 'Cart drawer should display customized flavor').toContain(testProductData.flavor.toLowerCase());

      await checkpoint('cart_validated');
      recordStepActual('Add to Cart', `${testProductData.productName} in cart for ${finalDate} at ${selectedStore.name}`);
      log_step('Cart verified with product, store, and scheduled slot');
    });

    await test.step('Checkout | Checkout page should load with saved payment selected', async () => {
      log_step('Proceeding to checkout and verifying saved card');
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyCheckoutPageLoaded();
      await checkoutPage.verifyCheckoutDetails(selectedStore.name, 'Pickup');

      const savedCardResult = await checkoutPage.locateAndVerifySavedCard();
      expect(savedCardResult.found, 'Saved payment card option should be found in checkout').toBeTruthy();
      expect(savedCardResult.selected, 'Saved payment card should be selected for payment').toBeTruthy();

      const isPlaceOrderReady = await checkoutPage.verifyFinalOrderSubmissionReadiness();
      expect(isPlaceOrderReady, 'Place Order button should be ready and enabled').toBeTruthy();

      await checkpoint('checkout');
      await checkpoint('payment_method_selected');
      recordStepActual('Checkout', 'Saved payment card verified and Place Order button enabled');
      log_step('Checkout loaded and ready for order placement');
    });

    await test.step('Place Order | Order should be submitted successfully', async () => {
      log_step('Submitting single final order (Place Order)');
      await checkoutPage.placeOrder();
      recordStepActual('Place Order', 'Place Order button clicked');
      log_step('Order submitted, awaiting confirmation');
    });

    await test.step('Verify Order Confirmation | Order confirmation should be displayed', async () => {
      log_step('Verifying order confirmation page and details');
      const orderDetails = await checkoutPage.verifyOrderConfirmation(selectedStore.name, testProductData.productName);

      expect(orderDetails.confirmationNumber, 'Order confirmation number should be non-empty').toBeTruthy();
      expect(orderDetails.confirmationNumber.length, 'Order confirmation number should have valid length').toBeGreaterThan(0);
      expect(orderDetails.orderStatus, 'Order status should be present and valid').toBeTruthy();

      await checkpoint('order_confirmation');
      recordStepActual(
        'Verify Order Confirmation',
        `Confirmation #${orderDetails.confirmationNumber} (${orderDetails.orderStatus}) - Total: ${orderDetails.orderTotal}`
      );
      log_step(`Order confirmation verified: #${orderDetails.confirmationNumber} (${orderDetails.orderStatus})`);
    });
  });
});
