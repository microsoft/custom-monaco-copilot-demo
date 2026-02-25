/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect } from '@playwright/test';
import { test, CONFIG, setupMockedTest } from './mock-utils';

test.describe('API Key Configuration', () => {
  test('should save API key when form is submitted', async ({ page }) => {
    await setupMockedTest(page);

    // Fill in a new API key
    await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, 'sk-new-test-key');
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);

    // Verify key was saved to localStorage
    const savedKey = await page.evaluate(() => localStorage.getItem('apiKey'));
    expect(savedKey).toBe('sk-new-test-key');
  });

  test('should save API URL when form is submitted', async ({ page }) => {
    await setupMockedTest(page);

    const customUrl = 'https://custom-api.example.com/v1/chat/completions';
    await page.fill(CONFIG.SELECTORS.API_URL_INPUT, customUrl);

    // Submit the API key form (which also saves the URL)
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);

    const savedUrl = await page.evaluate(() => localStorage.getItem('apiUrl'));
    expect(savedUrl).toBe(customUrl);
  });

  test('should persist API key across page reloads', async ({ page }) => {
    await setupMockedTest(page);

    await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, 'sk-persist-test');
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);

    // Reload and check
    await page.reload();
    await page.waitForSelector(CONFIG.SELECTORS.API_KEY_INPUT, { state: 'visible' });

    const inputValue = await page.locator(CONFIG.SELECTORS.API_KEY_INPUT).inputValue();
    expect(inputValue).toBe('sk-persist-test');
  });

  test('should use default OpenAI URL if none provided', async ({ page }) => {
    // Clear localStorage
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.removeItem('apiUrl');
      localStorage.removeItem('apiKey');
    });
    await page.reload();
    await page.waitForSelector(CONFIG.SELECTORS.API_URL_INPUT, { state: 'visible' });

    const urlValue = await page.locator(CONFIG.SELECTORS.API_URL_INPUT).inputValue();
    expect(urlValue).toBe('https://api.openai.com/v1/chat/completions');
  });

  test('should accept empty API key without crashing', async ({ page }) => {
    await setupMockedTest(page);

    await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, '');
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);

    // App should still be functional
    const editor = page.locator(CONFIG.SELECTORS.EDITOR).first();
    await expect(editor).toBeVisible();
  });
});
