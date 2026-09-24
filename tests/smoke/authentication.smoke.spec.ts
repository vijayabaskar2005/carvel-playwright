import { test, expect } from '../../fixtures/testFixtures';
import { getTestCredentials } from '../../utils/testData';

test.describe('Smoke 2 – Authentication', () => {
  test('smoke: user can navigate to login page and attempt sign in securely', async ({ loginPage, page }) => {
    await loginPage.navigate();
    await loginPage.verifyLoginPageLoaded();

    const { username, password } = getTestCredentials();
    if (username && password) {
      await loginPage.login(username, password);
    } else {
      console.log('[INFO] Valid credentials not set in .env. Authentication test verified login page readiness.');
      await expect(loginPage.emailInput).toBeVisible();
    }
  });
});
