const storesData = require('../test-data/stores.json');
const productsData = require('../test-data/products.json');
const usersData = require('../test-data/users.json');

const testStoreData = storesData.pickupStore;
const testProductData = productsData.testProduct;
const testCustomProductData = productsData.customProduct || productsData.testProduct;

const getTestCredentials = () => {
  return {
    username: process.env[usersData.testUser.usernameEnvKey] || '',
    password: process.env[usersData.testUser.passwordEnvKey] || '',
  };
};

module.exports = {
  testStoreData,
  testProductData,
  testCustomProductData,
  getTestCredentials,
};
