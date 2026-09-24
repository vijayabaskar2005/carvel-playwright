import { test, expect } from '../../fixtures/testFixtures';

test.describe('Smoke 3 – Navigation Header & Start Order', () => {
  test('smoke: user can initiate order from homepage header', async ({ homePage, header, page }) => {
    await homePage.navigate();
    await header.clickStartOrder();

    await expect(page).toHaveURL(/store-search|menu|\//);
    await expect(page.locator('#btn_pickup, button:has-text("PICKUP"), input[placeholder*="Street"]')).toBeVisible({ timeout: 15000 });
  });
});
