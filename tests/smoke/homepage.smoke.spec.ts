import { test, expect } from '../../fixtures/testFixtures';

test.describe('Smoke 1 – Homepage Verification', () => {
  test('smoke: user can open the carvel homepage and verify core elements', async ({ homePage, header, page }) => {
    await homePage.navigate();
    await homePage.verifyPageLoaded();

    await expect(page).toHaveURL(/car\.uat\.focusbrands\.com/);
    await expect(page).toHaveTitle(/Carvel/i);
    await expect(header.startOrderBtn).toBeVisible();
    await expect(header.logo).toBeVisible();
  });
});
