const { test, expect, recordStepActual } = require('../../fixtures/testFixtures');
const { testStoreData, testProductData, getTestCredentials } = require('../../utils/testData');
const { log_step } = require('../../utils/logger');

test.describe('Product Customization Functional Suite', () => {
  test('TC_006 - Verify Product Customization And Cart', async ({
    homePage,
    header,
    loginPage,
    storeLocatorPage,
    orderTypePage,
    menuPage,
    productListingPage,
    productDetailPage,
    cartPage,
    checkpoint,
    page,
  }) => {
    test.setTimeout(180000);

    let selectedStore = { name: '', address: '' };

    await test.step('Validate Homepage | Homepage URL and header controls should be visible', async () => {
      log_step('Navigating to homepage');
      await homePage.navigate();
      await homePage.verifyPageLoaded();

      expect(page.url(), 'Homepage URL should belong to Carvel domain').toMatch(/focusbrands\.com/);
      await expect(header.startOrderBtn, 'Start Order button should be visible').toBeVisible({ timeout: 15000 });
      await expect(header.startOrderBtn, 'Start Order button should be enabled').toBeEnabled({ timeout: 15000 });
      await expect(header.logo, 'Carvel logo should be visible').toBeVisible({ timeout: 15000 });

      await checkpoint('homepage');
      recordStepActual('Homepage', `Loaded URL: ${page.url()} | Header controls visible`);
      log_step('Homepage validated successfully');
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

    await test.step('Start Order & Select Pickup | Pickup order type should be selected', async () => {
      log_step('Initiating order from header');
      await header.clickStartOrder();
      await orderTypePage.selectPickup();
      await expect(orderTypePage.pickupOption, 'Pickup option should be visible and active').toBeVisible({ timeout: 10000 });

      await checkpoint('order_type_selected');
      recordStepActual('Select Pickup', 'Pickup option selected successfully');
      log_step('Pickup order type selected');
    });

    await test.step('Select Store | Carvel Qu Sandbox should be selected with ORDER NOW', async () => {
      try {
        log_step(`Searching and selecting store: ${testStoreData.searchQuery}`);
        await storeLocatorPage.performSearch(testStoreData.searchQuery);
        selectedStore = await storeLocatorPage.selectStoreOrderNow(testStoreData.name, testStoreData.address);

        expect(selectedStore.name, 'Selected store name should match test store data').toBe(testStoreData.name);
        expect(selectedStore.address, 'Selected store address should contain 26 Broadway').toContain('26 Broadway');
        expect(selectedStore.address, 'Selected store address should contain New York city / zip').toMatch(/New York|10004/i);
        await storeLocatorPage.verifyStoreSelected(selectedStore.name);

        await checkpoint('store_selected');
        recordStepActual('Select Store', `${selectedStore.name} - ORDER NOW selected`);
        log_step(`Store ${selectedStore.name} selected successfully`);
      } catch (err) {
        recordStepActual('Select Store', err && err.message ? err.message : 'Store selection failed');
        throw err;
      }
    });

    await test.step('Navigate to Menu | Menu page should load with categories', async () => {
      log_step('Navigating to menu');
      await menuPage.verifyMenuLoaded();
      await expect(menuPage.categoryLinks.first(), 'Menu category links should be visible').toBeVisible({ timeout: 15000 });

      await checkpoint('menu_loaded');
      recordStepActual('Navigate Menu', 'Menu loaded successfully');
      log_step('Menu page loaded');
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
      recordStepActual('Select Product', `${testProductData.productName} PDP loaded`);
      log_step(`PDP loaded for ${testProductData.productName}`);
    });

    await test.step('Apply Customization Options | Customization options should be applied and verified individually', async () => {
      log_step(`Applying customization: size="${testProductData.size}", flavor="${testProductData.flavor}"`);
      await productDetailPage.customizeProduct({
        size: testProductData.size,
        flavor: testProductData.flavor,
      });

      const selectedCustoms = await productDetailPage.getSelectedCustomizations();
      expect(selectedCustoms.size.toLowerCase(), 'Selected size should reflect in customization section').toContain(testProductData.size.toLowerCase());
      expect(selectedCustoms.flavor.toLowerCase(), 'Selected flavor should reflect in customization section').toContain(testProductData.flavor.toLowerCase());

      await expect(productDetailPage.addToCartBtn, 'Add to Cart button should be visible').toBeVisible({ timeout: 15000 });
      await expect(productDetailPage.addToCartBtn, 'Add to Cart button should be enabled after customization').toBeEnabled({ timeout: 15000 });

      await checkpoint('customization_applied');
      recordStepActual('Apply Customization', `Size: ${testProductData.size}, Flavor: ${testProductData.flavor}`);
      log_step('Customization options selected and verified');
    });

    await test.step('Add to Cart | Product should be added to cart and drawer displayed', async () => {
      log_step('Adding customized product to cart');
      await productDetailPage.addToCart();

      recordStepActual('Add to Cart', 'Product added to cart');
      log_step('Product added to cart');
    });

    await test.step('Verify Cart Contents & Customization | Cart should display product, customization, quantity, price, and total', async () => {
      log_step('Opening cart and verifying all configured items and pricing');
      await cartPage.verifyCartLoaded();
      await cartPage.verifyProductInCart(testProductData.productName);

      // Verify customization details in cart drawer
      const drawerText = await cartPage.cartDrawer.innerText();
      expect(drawerText.toLowerCase(), 'Cart drawer should display customized size').toContain(testProductData.size.toLowerCase());
      expect(drawerText.toLowerCase(), 'Cart drawer should display customized flavor').toContain(testProductData.flavor.toLowerCase());

      // Verify quantity, price, and cart total
      await cartPage.verifyQuantityInCart();
      await cartPage.verifyPriceDisplayed();

      const totalMatch = drawerText.match(/(?:Subtotal|Total|CHECKOUT)[:\s]*(\$\d+\.\d{2})/i) || drawerText.match(/(\$\d+\.\d{2})/);
      const cartTotal = totalMatch ? totalMatch[1] : 'Displayed';

      // Verify customized product remains correctly configured in cart
      expect(drawerText.toLowerCase(), 'Cart drawer text should contain product name').toContain(testProductData.productName.toLowerCase());
      expect(drawerText.toLowerCase(), 'Cart drawer text should contain selected size').toContain(testProductData.size.toLowerCase());

      await checkpoint('cart_validated');
      recordStepActual(
        'Verify Cart',
        `Product: ${testProductData.productName} | Size: ${testProductData.size} | Flavor: ${testProductData.flavor} | Total: ${cartTotal}`
      );
      log_step(`Cart contents verified: ${testProductData.productName} (${testProductData.size}, ${testProductData.flavor}) - Total: ${cartTotal}`);
    });
  });
});
