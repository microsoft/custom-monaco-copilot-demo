/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect } from '@playwright/test';
import {
  test,
  CONFIG,
  setupMockedTest,
  sendChatMessage,
  waitForBotResponse,
  setupMockOpenAIError,
} from './mock-utils';

test.describe('Error Handling with Mocked OpenAI', () => {
  test('should handle API error gracefully in chat', async ({ page }) => {
    await setupMockOpenAIError(page, 500, 'Internal Server Error');

    // Navigate and set up
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForSelector(CONFIG.SELECTORS.API_KEY_INPUT, { state: 'visible' });
    await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, 'sk-test-key');
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);
    await page.waitForSelector(CONFIG.SELECTORS.EDITOR, { state: 'visible' });
    await page.waitForTimeout(1000);

    // Send a message - should not crash the app
    const chatInput = page.locator(CONFIG.SELECTORS.CHAT_INPUT);
    await chatInput.fill('Test error handling');
    await chatInput.press('Enter');

    // Wait a moment for error to process
    await page.waitForTimeout(2000);

    // App should still be functional
    const editor = page.locator(CONFIG.SELECTORS.EDITOR).first();
    await expect(editor).toBeVisible();
  });

  test('should handle 401 unauthorized error', async ({ page }) => {
    await setupMockOpenAIError(page, 401, 'Invalid API key');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForSelector(CONFIG.SELECTORS.API_KEY_INPUT, { state: 'visible' });
    await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, 'sk-invalid');
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);
    await page.waitForSelector(CONFIG.SELECTORS.EDITOR, { state: 'visible' });
    await page.waitForTimeout(1000);

    const chatInput = page.locator(CONFIG.SELECTORS.CHAT_INPUT);
    await chatInput.fill('Test with invalid key');
    await chatInput.press('Enter');

    await page.waitForTimeout(2000);

    // App should still be functional - editor visible
    await expect(page.locator(CONFIG.SELECTORS.EDITOR).first()).toBeVisible();
  });

  test('should handle 429 rate limit error', async ({ page }) => {
    await setupMockOpenAIError(page, 429, 'Rate limit exceeded');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForSelector(CONFIG.SELECTORS.API_KEY_INPUT, { state: 'visible' });
    await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, 'sk-test');
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);
    await page.waitForSelector(CONFIG.SELECTORS.EDITOR, { state: 'visible' });
    await page.waitForTimeout(1000);

    const chatInput = page.locator(CONFIG.SELECTORS.CHAT_INPUT);
    await chatInput.fill('Test rate limit');
    await chatInput.press('Enter');

    await page.waitForTimeout(2000);

    // App should still be functional
    await expect(page.locator(CONFIG.SELECTORS.EDITOR).first()).toBeVisible();
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Simulate a hanging request
    await page.route('**/v1/chat/completions', async (route) => {
      // Don't fulfill - simulate timeout
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: [DONE]\n\n',
      });
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForSelector(CONFIG.SELECTORS.API_KEY_INPUT, { state: 'visible' });
    await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, 'sk-test');
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);
    await page.waitForSelector(CONFIG.SELECTORS.EDITOR, { state: 'visible' });
    await page.waitForTimeout(1000);

    const chatInput = page.locator(CONFIG.SELECTORS.CHAT_INPUT);
    await chatInput.fill('Test timeout');
    await chatInput.press('Enter');

    // User message should still appear immediately
    const userMessage = page.locator(CONFIG.SELECTORS.USER_MESSAGE);
    await expect(userMessage.first()).toBeVisible({ timeout: 5000 });
    await expect(userMessage.first()).toContainText('Test timeout');
  });

  test('should handle empty response from API', async ({ page }) => {
    await page.route('**/v1/chat/completions', async (route) => {
      const body = 'data: [DONE]\n\n';
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForSelector(CONFIG.SELECTORS.API_KEY_INPUT, { state: 'visible' });
    await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, 'sk-test');
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);
    await page.waitForSelector(CONFIG.SELECTORS.EDITOR, { state: 'visible' });
    await page.waitForTimeout(1000);

    const chatInput = page.locator(CONFIG.SELECTORS.CHAT_INPUT);
    await chatInput.fill('Empty response test');
    await chatInput.press('Enter');

    await page.waitForTimeout(2000);

    // User message should still be present
    const userMessage = page.locator(CONFIG.SELECTORS.USER_MESSAGE);
    await expect(userMessage.first()).toContainText('Empty response test');

    // App should not crash
    await expect(page.locator(CONFIG.SELECTORS.EDITOR).first()).toBeVisible();
  });

  test('should handle malformed JSON in SSE stream', async ({ page }) => {
    await page.route('**/v1/chat/completions', async (route) => {
      const body = [
        `data: ${JSON.stringify({
          choices: [{ delta: { content: 'Valid part' }, finish_reason: null }],
        })}`,
        '',
        'data: {invalid json here',
        '',
        `data: ${JSON.stringify({
          choices: [{ delta: { content: ' still works' }, finish_reason: null }],
        })}`,
        '',
        'data: [DONE]',
        '',
      ].join('\n');

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForSelector(CONFIG.SELECTORS.API_KEY_INPUT, { state: 'visible' });
    await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, 'sk-test');
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);
    await page.waitForSelector(CONFIG.SELECTORS.EDITOR, { state: 'visible' });
    await page.waitForTimeout(1000);

    const chatInput = page.locator(CONFIG.SELECTORS.CHAT_INPUT);
    await chatInput.fill('Malformed JSON test');
    await chatInput.press('Enter');

    await page.waitForTimeout(2000);

    // App should remain functional
    await expect(page.locator(CONFIG.SELECTORS.EDITOR).first()).toBeVisible();

    // The valid parts should be rendered
    const botMessage = page.locator(CONFIG.SELECTORS.BOT_MESSAGE).first();
    await expect(botMessage).toContainText('Valid part');
  });
});
