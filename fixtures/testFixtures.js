const { test: base, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { LoginPage } = require('../pages/LoginPage');
const { Header } = require('../pages/Header');
const { StoreLocatorPage } = require('../pages/StoreLocatorPage');
const { OrderTypePage } = require('../pages/OrderTypePage');
const { PickupPage } = require('../pages/PickupPage');
const { MenuPage } = require('../pages/MenuPage');
const { ProductListingPage } = require('../pages/ProductListingPage');
const { ProductDetailPage } = require('../pages/ProductDetailPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const { captureCheckpoint } = require('../utils/artifactManager');

const test = base.extend({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  header: async ({ page }, use) => {
    await use(new Header(page));
  },
  storeLocatorPage: async ({ page }, use) => {
    await use(new StoreLocatorPage(page));
  },
  orderTypePage: async ({ page }, use) => {
    await use(new OrderTypePage(page));
  },
  pickupPage: async ({ page }, use) => {
    await use(new PickupPage(page));
  },
  menuPage: async ({ page }, use) => {
    await use(new MenuPage(page));
  },
  productListingPage: async ({ page }, use) => {
    await use(new ProductListingPage(page));
  },
  productDetailPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  checkpoint: async ({ page }, use, testInfo) => {
    const cp = async (checkpointName) => {
      await captureCheckpoint(page, checkpointName, testInfo);
    };
    await use(cp);
  },
});

/**
 * Record dynamic step runtime values for inclusion in the Excel execution report.
 */
function recordStepActual(stepKeyword, actualValue) {
  test.info().annotations.push({
    type: `excel-actual:${stepKeyword.toLowerCase()}`,
    description: actualValue,
  });
}

module.exports = {
  test,
  expect,
  recordStepActual,
  captureCheckpoint,
};
