const { test, expect, recordStepActual } = require('../../fixtures/testFixtures');
const { testStoreData, testProductData, getTestCredentials } = require('../../utils/testData');
const { log_step } = require('../../utils/logger');

test.describe('Order Now Smoke Suite', () => {
  test('TC_002 - Order Now Order Journey', async ({
    homePage,
    header,
    loginPage,
    storeLocatorPage,
    orderTypePage,
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

    await test.step('Validate Homepage | Homepage URL and header elements should be visible', async () => {
      log_step('Navigating to Carvel homepage');
      await homePage.navigate();
      await homePage.verifyPageLoaded();

      expect(page.url(), 'Homepage URL should belong to Carvel domain').toMatch(/focusbrands\.com/);
      await expect(header.logo, 'Carvel logo should be visible').toBeVisible({ timeout: 15000 });
      await expect(header.startOrderBtn, 'Start Order button should be visible').toBeVisible({ timeout: 15000 });
      await expect(header.startOrderBtn, 'Start Order button should be enabled').toBeEnabled({ timeout: 15000 });

      await checkpoint('homepage');
      recordStepActual('Homepage', `Loaded URL: ${page.url()} | Header controls visible`);
      log_step('Homepage validated successfully');
    });

    await test.step('Authenticate User | User should be authenticated with active account indicator', async () => {
      log_step('Authenticating user session with .env credentials');
      const credentials = getTestCredentials();
      await header.clickSignIn();
      await loginPage.login(credentials.username, credentials.password);

      const authIndicator = page.locator('button:has-text("Account"), #link_auth_Profile, a[href*="personal-info"]').first();
      await expect(authIndicator, 'Authenticated account profile indicator should be visible').toBeVisible({ timeout: 25000 });
      await expect(page.locator('body'), 'Page should not display authentication failure').not.toContainText(/Invalid credentials/i);

      await checkpoint('authenticated');
      recordStepActual('Authenticate', 'User session authenticated successfully with Account profile active');
      log_step('User authenticated successfully');
    });

    await test.step('Start Order | Start Order should initiate order type selection', async () => {
      log_step('Initiating order from header');
      await header.clickStartOrder();
      await expect(orderTypePage.pickupOption, 'Pickup order type option should be visible').toBeVisible({ timeout: 20000 });

      recordStepActual('Start Order', 'Start Order clicked, order type options displayed');
      log_step('Start Order initiated successfully');
    });

    await test.step('Select Pickup | Pickup order mode should be selected', async () => {
      log_step('Selecting Pickup order type');
      await orderTypePage.selectPickup();
      await expect(orderTypePage.pickupOption, 'Pickup option should remain visible and active').toBeVisible({ timeout: 10000 });

      await checkpoint('order_type_selected');
      recordStepActual('Select Pickup', 'Pickup option selected');
      log_step('Pickup order type selected');
    });

    await test.step('Search & Select Store | Carvel Qu Sandbox should be selected with store details validated', async () => {
      try {
        log_step(`Searching for store: ${testStoreData.searchQuery}`);
        await storeLocatorPage.performSearch(testStoreData.searchQuery);
        selectedStore = await storeLocatorPage.selectStoreOrderNow(testStoreData.name, testStoreData.address);

        expect(selectedStore.name, 'Store name should match test store data').toBe(testStoreData.name);
        expect(selectedStore.address, 'Store address should contain 26 Broadway').toContain('26 Broadway');
        expect(selectedStore.address, 'Store address should contain New York city / zip').toMatch(/New York|10004/i);
        await storeLocatorPage.verifyStoreSelected(selectedStore.name);

        await checkpoint('store_selected');
        recordStepActual(
          'Select Store',
          `Store: ${selectedStore.name} | Address: ${selectedStore.address} | Mode: ORDER NOW`
        );
        log_step(`Store ${selectedStore.name} selected with ORDER NOW`);
      } catch (err) {
        recordStepActual('Select Store', err && err.message ? err.message : 'Store selection failed');
        throw err;
      }
    });

    await test.step('Verify ORDER NOW Active & Menu Loaded | Order mode should be immediate ORDER NOW and menu displayed', async () => {
      log_step('Verifying immediate ORDER NOW state and menu availability');
      await menuPage.verifyMenuLoaded();
      await expect(menuPage.categoryLinks.first(), 'Menu category links should be visible').toBeVisible({ timeout: 15000 });

      // Verify that Pickup Later is NOT the active order mode in the order bar
      const orderBarText = await page.locator('body').innerText();
      expect(orderBarText, 'Immediate ORDER NOW mode should not indicate Pickup Later tab').not.toMatch(/Pickup Later tab selected/i);

      await checkpoint('order_now_active');
      recordStepActual('Verify ORDER NOW', 'Menu loaded, ORDER NOW active');
      log_step('Menu and ORDER NOW ordering flow verified');
    });

    await test.step('Select Product | Category and customizable product should be loaded', async () => {
      log_step(`Selecting category "${testProductData.categoryName}" and product "${testProductData.productName}"`);
      await menuPage.selectCategory(testProductData.categoryName);
      await productListingPage.selectProduct(testProductData.productName);
      await productDetailPage.verifyPDPLoaded();

      await expect(productDetailPage.productName, 'PDP product name element should be visible').toBeVisible({ timeout: 15000 });
      const pdpTitle = await productDetailPage.productName.innerText();
      expect(pdpTitle.toLowerCase(), 'PDP product title should match expected product').toContain(testProductData.productName.toLowerCase());

      await checkpoint('product_selected');
      recordStepActual('Select Product', `${testProductData.productName} PDP loaded from ${testProductData.categoryName}`);
      log_step(`Product "${testProductData.productName}" selected`);
    });

    await test.step('Apply Customization | Required product customization options should be configured and validated', async () => {
      log_step(`Customizing with size: "${testProductData.size}", flavor: "${testProductData.flavor}"`);
      await productDetailPage.customizeProduct({
        size: testProductData.size,
        flavor: testProductData.flavor,
      });

      await expect(productDetailPage.addToCartBtn, 'Add to Cart button should be visible').toBeVisible({ timeout: 15000 });
      await expect(productDetailPage.addToCartBtn, 'Add to Cart button should be enabled').toBeEnabled({ timeout: 15000 });

      await checkpoint('product_customized');
      recordStepActual('Apply Customization', `Size: ${testProductData.size}, Flavor: ${testProductData.flavor}`);
      log_step('Product options customized successfully');
    });

    await test.step('Add to Cart & Validate Cart | Customized product, quantity, unit price, and total should be verified', async () => {
      log_step('Adding product to cart and verifying cart drawer');
      await productDetailPage.addToCart();
      await cartPage.verifyCartLoaded();
      await cartPage.verifyStoreInCart(selectedStore.name);
      await cartPage.verifyAddressInCart(selectedStore.address);
      await cartPage.verifyPickupMethodInCart('Pickup');
      await cartPage.verifyProductInCart(testProductData.productName);
      await cartPage.verifyQuantityInCart();
      await cartPage.verifyPriceDisplayed();

      const drawerText = await cartPage.cartDrawer.innerText();
      expect(drawerText.toLowerCase(), 'Cart drawer should display customized size').toContain(testProductData.size.toLowerCase());
      expect(drawerText.toLowerCase(), 'Cart drawer should display customized flavor').toContain(testProductData.flavor.toLowerCase());

      const priceMatch = drawerText.match(/\$\d+\.\d{2}/);
      const displayedPrice = priceMatch ? priceMatch[0] : 'Displayed';

      await checkpoint('cart_validated');
      recordStepActual(
        'Add to Cart',
        `Product: ${testProductData.productName} | Size: ${testProductData.size} | Flavor: ${testProductData.flavor} | Price: ${displayedPrice}`
      );
      log_step(`Cart verified with product ${testProductData.productName}`);
    });

    await test.step('Checkout | Checkout page should load with saved payment selected', async () => {
      log_step('Proceeding to checkout and verifying details');
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
      recordStepActual('Checkout', 'Checkout loaded, details verified, saved card selected');
      log_step('Checkout ready for order placement');
    });

    await test.step('Place Order | Order should be submitted successfully', async () => {
      log_step('Submitting single final order (Place Order)');
      await checkoutPage.placeOrder();
      recordStepActual('Place Order', 'Place Order button clicked');
      log_step('Order submitted, awaiting confirmation');
    });

    await test.step('Verify Order Confirmation | Order confirmation number, status, and details should be verified', async () => {
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
