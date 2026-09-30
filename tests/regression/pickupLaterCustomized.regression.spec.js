const { test, expect, recordStepActual } = require('../../fixtures/testFixtures');
const { testStoreData, testProductData, getTestCredentials } = require('../../utils/testData');
const { log_step } = require('../../utils/logger');

test.describe('Regression Suite - Pickup Later Customized Order', () => {
  test('TC_003 - Pickup Later Customized Order', async ({
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
      log_step('Homepage validated');
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

    await test.step('Start Order & Select Pickup | Pickup order mode should be selected', async () => {
      log_step('Initiating order from header and selecting Pickup');
      await header.clickStartOrder();
      await orderTypePage.selectPickup();
      await expect(orderTypePage.pickupOption, 'Pickup option should be visible and active').toBeVisible({ timeout: 10000 });

      await checkpoint('order_type_selected');
      recordStepActual('Select Pickup', 'Pickup order mode selected');
      log_step('Pickup order mode selected');
    });

    await test.step('Search & Select Store | Carvel Qu Sandbox should be selected with ORDER AHEAD', async () => {
      try {
        log_step(`Searching for store: ${testStoreData.searchQuery}`);
        selectedStore = await storeLocatorPage.searchAndSelectStore(testStoreData.searchQuery);

        expect(selectedStore.name, 'Selected store name should match test store data').toBe(testStoreData.name);
        expect(selectedStore.address, 'Selected store address should contain 26 Broadway').toContain('26 Broadway');
        expect(selectedStore.address, 'Selected store address should contain New York city / zip').toMatch(/New York|10004/i);
        await storeLocatorPage.verifyStoreSelected(selectedStore.name);

        await checkpoint('store_selected');
        recordStepActual('Select Store', `${selectedStore.name} - ${selectedStore.address} (ORDER AHEAD)`);
        log_step(`Store ${selectedStore.name} selected successfully`);
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

    await test.step('Select & Confirm Future Date/Time | Available future date and time should be selected', async () => {
      log_step('Selecting dynamic future pickup date and time');
      const dynamicSlot = await pickupPage.selectDynamicDateAndTime();
      expect(dynamicSlot.date, 'Dynamic pickup date should be defined and valid').toBeTruthy();
      expect(dynamicSlot.time, 'Dynamic pickup time should be defined and valid').toBeTruthy();

      const confirmedSlot = await pickupPage.confirmSchedule();
      finalDate = confirmedSlot.date || dynamicSlot.date;
      finalTime = confirmedSlot.time || dynamicSlot.time;

      expect(finalDate, 'Confirmed pickup date must be non-empty').toBeTruthy();
      expect(finalTime, 'Confirmed pickup time must be non-empty').toBeTruthy();

      await checkpoint('pickup_schedule_selected');
      recordStepActual('Select Date/Time', `Date: ${finalDate} | Time: ${finalTime}`);
      log_step(`Pickup schedule confirmed: ${finalDate} at ${finalTime}`);
    });

    await test.step('Verify Menu Loaded & Schedule Retained | Menu page and category listings should be available', async () => {
      log_step('Verifying menu page is loaded and scheduled slot is active');
      await menuPage.verifyMenuLoaded();
      await expect(menuPage.categoryLinks.first(), 'Menu category links should be visible').toBeVisible({ timeout: 15000 });

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.toLowerCase(), 'Body should contain selected store pickup info').toContain('pickup at carvel qu sandbox');
      expect(bodyText, 'Body should reflect retained schedule info').toMatch(/Scheduled for/i);

      await checkpoint('menu_loaded');
      recordStepActual('Verify Menu', 'Menu loaded, Pickup Later schedule retained');
      log_step('Menu and retained schedule verified');
    });

    await test.step('Select Customizable Product | Product PDP should load with customization section', async () => {
      log_step(`Selecting category "${testProductData.categoryName}" and product "${testProductData.productName}"`);
      await menuPage.selectCategory(testProductData.categoryName);
      await productListingPage.selectProduct(testProductData.productName);
      await productDetailPage.verifyPDPLoaded();

      await expect(productDetailPage.productName, 'PDP product title should be visible').toBeVisible({ timeout: 15000 });
      const pdpTitle = await productDetailPage.productName.innerText();
      expect(pdpTitle.toLowerCase(), 'PDP product title should match expected product').toContain(testProductData.productName.toLowerCase());

      await checkpoint('product_selected');
      recordStepActual('Select Product', `${testProductData.productName} PDP loaded from ${testProductData.categoryName}`);
      log_step(`Product "${testProductData.productName}" selected`);
    });

    await test.step('Apply Multiple Customizations | Size and Flavor options should be applied and verified individually', async () => {
      log_step(`Applying multiple customizations: Size="${testProductData.size}", Flavor="${testProductData.flavor}"`);
      await productDetailPage.customizeProduct({
        size: testProductData.size,
        flavor: testProductData.flavor,
      });

      const selectedCustoms = await productDetailPage.getSelectedCustomizations();
      expect(selectedCustoms.size.toLowerCase(), 'Selected size customization should reflect in UI').toContain(testProductData.size.toLowerCase());
      expect(selectedCustoms.flavor.toLowerCase(), 'Selected flavor customization should reflect in UI').toContain(testProductData.flavor.toLowerCase());

      await expect(productDetailPage.addToCartBtn, 'Add to Cart button should be visible').toBeVisible({ timeout: 15000 });
      await expect(productDetailPage.addToCartBtn, 'Add to Cart button should be enabled').toBeEnabled({ timeout: 15000 });

      await checkpoint('product_customized');
      recordStepActual(
        'Apply Customization',
        `Size: ${testProductData.size} | Flavor: ${testProductData.flavor} (both verified)`
      );
      log_step('Multiple customizations applied and verified');
    });

    await test.step('Add to Cart & Verify Cart Details | Cart drawer should verify product, customizations, price, and schedule', async () => {
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
      recordStepActual(
        'Add to Cart',
        `Product: ${testProductData.productName} | Size: ${testProductData.size} | Flavor: ${testProductData.flavor} | Slot: ${finalDate} at ${finalTime}`
      );
      log_step('Cart verified with product, customizations, and scheduled slot');
    });

    await test.step('Proceed to Checkout | Checkout details and saved payment method should be validated', async () => {
      log_step('Proceeding to checkout');
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyCheckoutPageLoaded();
      await checkoutPage.verifyCheckoutDetails(selectedStore.name, 'Pickup');

      const savedCardResult = await checkoutPage.locateAndVerifySavedCard();
      expect(savedCardResult.found, 'Saved payment card option should be found in checkout').toBeTruthy();
      expect(savedCardResult.selected, 'Saved payment card should be selected').toBeTruthy();

      const isPlaceOrderReady = await checkoutPage.verifyFinalOrderSubmissionReadiness();
      expect(isPlaceOrderReady, 'Place Order button should be ready and enabled').toBeTruthy();

      await checkpoint('checkout');
      await checkpoint('payment_method_selected');
      recordStepActual('Checkout', 'Checkout loaded, Pickup Later details verified, saved card selected');
      log_step('Checkout ready for order placement');
    });

    await test.step('Place Order | Order should be submitted successfully', async () => {
      log_step('Submitting single final order (Place Order)');
      await checkoutPage.placeOrder();
      recordStepActual('Place Order', 'Place Order button clicked');
      log_step('Order submitted, awaiting confirmation');
    });

    await test.step('Verify Order Confirmation | Confirmation number, status, store, product, and total should be validated', async () => {
      log_step('Verifying order confirmation page');
      const orderDetails = await checkoutPage.verifyOrderConfirmation(selectedStore.name, testProductData.productName);

      expect(orderDetails.confirmationNumber, 'Confirmation number must not be empty').toBeTruthy();
      expect(orderDetails.confirmationNumber.length, 'Confirmation number length must be valid').toBeGreaterThan(0);
      expect(orderDetails.orderStatus, 'Order status must be populated').toBeTruthy();

      await checkpoint('order_confirmation');
      recordStepActual(
        'Verify Order Confirmation',
        `Confirmation #${orderDetails.confirmationNumber} (${orderDetails.orderStatus}) - Store: ${orderDetails.storeName} - Total: ${orderDetails.orderTotal}`
      );
      log_step(`Order confirmation verified: #${orderDetails.confirmationNumber} (${orderDetails.orderStatus})`);
    });
  });
});
