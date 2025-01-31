/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { test, waitForElementWithRetry } from './test-utils';
import { expect } from '@playwright/test';
import { setupTest } from './test-utils';

test.describe('Chat Interface', () => {
  // Selectors for better maintainability
  const SELECTORS = {
    CHAT_INPUT: '.input-area input',
    MESSAGES: '.messages',
    MESSAGE: '.messages .message',
    CLEAR_BUTTON: '.clear-chat-button'
  };

  // Test configuration
  const CONFIG = {
    TIMEOUTS: {
      API_RESPONSE: 30000,
      MESSAGE_VISIBLE: 10000,
      CLEAR_CHECK: 5000
    }
  };

  const TEST_DATA = {
    CODE_BLOCK_MESSAGE: 'Show me how to write a set-header policy in APIM'
  };

  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  /**
   * Helper to send a chat message
   * @param {Page} page - Playwright page object
   * @param {string} message - Message to send
   */
  async function sendChatMessage(page, message) {
    const chatInput = await page.waitForSelector(SELECTORS.CHAT_INPUT, { 
      state: 'visible' 
    });
    await chatInput.type(message);
    await chatInput.press('Enter');
  }

  /**
   * Helper to verify message visibility
   * @param {Page} page - Playwright page object
   * @param {string} text - Text to look for
   * @param {number} timeout - Timeout in milliseconds
   */
  async function verifyMessageVisible(page, text, timeout) {
    const messages = page.locator(SELECTORS.MESSAGES);
    await expect(messages).toBeVisible();
    await expect(
      messages.filter({ hasText: text })
    ).toBeVisible({ timeout });
  }

  /**
   * Helper to check for markdown code block formatting
   */
  async function verifyCodeBlockFormatting(page) {
    const codeBlock = page.locator('pre code');
    await expect(codeBlock).toBeVisible();
    const classes = await codeBlock.evaluate(el => Array.from(el.classList));
    expect(classes).toContain('language-xml');
  }

  test('should get response for API Management policy questions', async ({ page }) => {
    // Given: Chat interface is ready
    await waitForElementWithRetry(page, SELECTORS.CHAT_INPUT);

    // When: User asks about header settings
    await sendChatMessage(page, 'How can I set a header in APIM?');

    // Then: Response should contain relevant policy information
    await verifyMessageVisible(page, 'set-header', CONFIG.TIMEOUTS.API_RESPONSE);
  });

  test('should clear chat history effectively', async ({ page }) => {
    // Given: A message exists in chat
    await sendChatMessage(page, 'Test message');
    await verifyMessageVisible(page, 'Test message', CONFIG.TIMEOUTS.MESSAGE_VISIBLE);

    // When: Clear button is clicked
    const clearButton = await page.waitForSelector(SELECTORS.CLEAR_BUTTON, { 
      state: 'visible' 
    });
    await clearButton.click();

    // Then: Messages should be cleared
    await expect(async () => {
      const messageCount = await page.locator(SELECTORS.MESSAGE).count();
      expect(messageCount).toBe(0);
    }).toPass({ timeout: CONFIG.TIMEOUTS.CLEAR_CHECK });
  });

  test('should handle empty messages gracefully', async ({ page }) => {
    // Given: Chat input is ready
    const chatInput = await page.waitForSelector(SELECTORS.CHAT_INPUT, { 
      state: 'visible' 
    });

    // When: Attempting to send empty message
    await chatInput.press('Enter');

    // Then: No new message should appear
    const messageCount = await page.locator(SELECTORS.MESSAGE).count();
    expect(messageCount).toBe(0);
  });

  test('should properly format code blocks in responses', async ({ page }) => {
    // Given: Chat is ready
    await waitForElementWithRetry(page, SELECTORS.CHAT_INPUT);

    // When: Asking for a code example
    await sendChatMessage(page, TEST_DATA.CODE_BLOCK_MESSAGE);

    // Then: Response should contain formatted code block
    await verifyMessageVisible(page, '<set-header', CONFIG.TIMEOUTS.API_RESPONSE);
    await verifyCodeBlockFormatting(page);
  });
});
