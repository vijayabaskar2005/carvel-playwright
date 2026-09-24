import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { Header } from '../pages/Header';
import { StoreLocatorPage } from '../pages/StoreLocatorPage';
import { OrderTypePage } from '../pages/OrderTypePage';
import { PickupPage } from '../pages/PickupPage';
import { MenuPage } from '../pages/MenuPage';
import { ProductListingPage } from '../pages/ProductListingPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

type CustomFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  header: Header;
  storeLocatorPage: StoreLocatorPage;
  orderTypePage: OrderTypePage;
  pickupPage: PickupPage;
  menuPage: MenuPage;
  productListingPage: ProductListingPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<CustomFixtures>({
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
});

export { expect } from '@playwright/test';
