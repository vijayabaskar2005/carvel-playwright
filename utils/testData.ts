import storesData from '../test-data/stores.json';
import productsData from '../test-data/products.json';
import usersData from '../test-data/users.json';

export interface PickupStore {
  name: string;
  address: string;
  searchQuery: string;
  zipCode: string;
  cityState: string;
}

export interface TestProduct {
  category: string;
  categoryName: string;
  productName: string;
  size: string;
  flavor: string;
  priceStarting: string;
}

export const testStoreData: PickupStore = storesData.pickupStore;
export const testProductData: TestProduct = productsData.testProduct;

export const getTestCredentials = () => {
  return {
    username: process.env[usersData.testUser.usernameEnvKey] || '',
    password: process.env[usersData.testUser.passwordEnvKey] || '',
  };
};
