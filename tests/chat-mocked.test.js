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
  setupMockOpenAI,
  createStreamingResponse,
} from './mock-utils';

test.describe('Chat Functionality with Mocked OpenAI', () => {
  test.describe('Sending and Receiving Messages', () => {
    test.beforeEach(async ({ page }) => {
      await setupMockedTest(page, {
        chatResponse: 'Hello! I can help you with Azure API Management policies.',
      });
    });

    test('should display user message after sending', async ({ page }) => {
      await sendChatMessage(page, 'Hello AI');

      const userMessage = page.locator(CONFIG.SELECTORS.USER_MESSAGE);
      await expect(userMessage.first()).toBeVisible();
      await expect(userMessage.first()).toContainText('Hello AI');
    });

    test('should receive and display bot response', async ({ page }) => {
      await sendChatMessage(page, 'Help me with APIM');

      await waitForBotResponse(page);

      const botMessage = page.locator(CONFIG.SELECTORS.BOT_MESSAGE);
      await expect(botMessage.first()).toBeVisible();
      await expect(botMessage.first()).toContainText('Azure API Management');
    });

    test('should show both user and bot messages in order', async ({ page }) => {
      await sendChatMessage(page, 'Tell me about policies');

      await waitForBotResponse(page);

      const messages = page.locator(CONFIG.SELECTORS.MESSAGE);
      const messageCount = await messages.count();
      expect(messageCount).toBe(2);

      // First message should be user
      await expect(messages.nth(0)).toHaveClass(/user/);
      await expect(messages.nth(0)).toContainText('Tell me about policies');

      // Second message should be bot
      await expect(messages.nth(1)).toHaveClass(/bot/);
    });

    test('should clear input after sending message', async ({ page }) => {
      const chatInput = page.locator(CONFIG.SELECTORS.CHAT_INPUT);
      await chatInput.fill('Test message');
      await chatInput.press('Enter');

      const inputValue = await chatInput.inputValue();
      expect(inputValue).toBe('');
    });

    test('should handle multiple conversation turns', async ({ page }) => {
      // First message
      await sendChatMessage(page, 'First question');
      await waitForBotResponse(page);

      // Second message
      await sendChatMessage(page, 'Second question');

      // Wait for second bot response
      await expect(async () => {
        const botMessages = await page.locator(CONFIG.SELECTORS.BOT_MESSAGE).count();
        expect(botMessages).toBe(2);
      }).toPass({ timeout: 15000 });

      const allMessages = page.locator(CONFIG.SELECTORS.MESSAGE);
      const totalCount = await allMessages.count();
      expect(totalCount).toBe(4); // 2 user + 2 bot
    });

    test('should not send empty messages', async ({ page }) => {
      const chatInput = page.locator(CONFIG.SELECTORS.CHAT_INPUT);
      await chatInput.press('Enter');

      const messageCount = await page.locator(CONFIG.SELECTORS.MESSAGE).count();
      expect(messageCount).toBe(0);
    });

    test('should not send whitespace-only messages', async ({ page }) => {
      await sendChatMessage(page, '   ');

      // Should not create any messages (the app trims and checks)
      await page.waitForTimeout(500);
      const messageCount = await page.locator(CONFIG.SELECTORS.MESSAGE).count();
      expect(messageCount).toBe(0);
    });
  });

  test.describe('Streaming Response Behavior', () => {
    test('should stream response incrementally', async ({ page }) => {
      await setupMockedTest(page, {
        chatResponse: 'This is a long streaming response that arrives word by word to the user interface',
      });

      await sendChatMessage(page, 'Tell me something');

      // Wait for bot response to start appearing
      await waitForBotResponse(page);

      const botMessage = page.locator(CONFIG.SELECTORS.BOT_MESSAGE).first();
      const text = await botMessage.textContent();
      expect(text.length).toBeGreaterThan(0);
    });

    test('should handle response with special characters', async ({ page }) => {
      await setupMockedTest(page, {
        chatResponse: 'Use the `set-header` policy with name="Content-Type" & value="application/json"',
      });

      await sendChatMessage(page, 'How to set content type?');
      await waitForBotResponse(page);

      const botMessage = page.locator(CONFIG.SELECTORS.BOT_MESSAGE).first();
      await expect(botMessage).toContainText('set-header');
    });
  });

  test.describe('Markdown Rendering in Chat', () => {
    test('should render code blocks with syntax highlighting', async ({ page }) => {
      const codeResponse =
        'Here is an example:\n\n```xml\n<set-header name="X-Custom" exists-action="override">\n  <value>test</value>\n</set-header>\n```';

      await setupMockedTest(page, { chatResponse: codeResponse });

      await sendChatMessage(page, 'Show me a set-header policy');
      await waitForBotResponse(page);

      // Should have a code block
      const codeBlock = page.locator('.message.bot pre');
      await expect(codeBlock).toBeVisible({ timeout: 10000 });
    });

    test('should render inline code in markdown', async ({ page }) => {
      await setupMockedTest(page, {
        chatResponse: 'Use the `set-header` policy inside `inbound` section.',
      });

      await sendChatMessage(page, 'Where to use set-header?');
      await waitForBotResponse(page);

      const botMessage = page.locator(CONFIG.SELECTORS.BOT_MESSAGE).first();
      const codeElements = botMessage.locator('code');
      const count = await codeElements.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should display copy button for code blocks', async ({ page }) => {
      const codeResponse =
        'Example:\n\n```xml\n<set-header name="test" exists-action="override">\n  <value>val</value>\n</set-header>\n```';

      await setupMockedTest(page, { chatResponse: codeResponse });

      await sendChatMessage(page, 'Show code');
      await waitForBotResponse(page);

      const copyButton = page.locator(CONFIG.SELECTORS.COPY_BUTTON);
      await expect(copyButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('should render paragraphs in markdown', async ({ page }) => {
      await setupMockedTest(page, {
        chatResponse: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.',
      });

      await sendChatMessage(page, 'Tell me about policies');
      await waitForBotResponse(page);

      const botMessage = page.locator(CONFIG.SELECTORS.BOT_MESSAGE).first();
      const paragraphs = botMessage.locator('p');
      const count = await paragraphs.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Clear Chat', () => {
    test('should clear all messages when clear button is clicked', async ({ page }) => {
      await setupMockedTest(page);

      // Send a message first
      await sendChatMessage(page, 'Test message');
      await waitForBotResponse(page);

      // Verify messages exist
      let messageCount = await page.locator(CONFIG.SELECTORS.MESSAGE).count();
      expect(messageCount).toBeGreaterThan(0);

      // Click clear
      await page.click(CONFIG.SELECTORS.CLEAR_BUTTON);

      // Verify messages are cleared
      await expect(async () => {
        messageCount = await page.locator(CONFIG.SELECTORS.MESSAGE).count();
        expect(messageCount).toBe(0);
      }).toPass({ timeout: 5000 });
    });

    test('should be able to send messages after clearing', async ({ page }) => {
      await setupMockedTest(page);

      // Send, clear, send again
      await sendChatMessage(page, 'First message');
      await waitForBotResponse(page);
      await page.click(CONFIG.SELECTORS.CLEAR_BUTTON);

      await expect(async () => {
        const count = await page.locator(CONFIG.SELECTORS.MESSAGE).count();
        expect(count).toBe(0);
      }).toPass({ timeout: 5000 });

      await sendChatMessage(page, 'New message after clear');
      await waitForBotResponse(page);

      const messageCount = await page.locator(CONFIG.SELECTORS.MESSAGE).count();
      expect(messageCount).toBe(2); // user + bot
    });

    test('should work with no messages to clear', async ({ page }) => {
      await setupMockedTest(page);

      // Click clear with no messages - should not crash
      await page.click(CONFIG.SELECTORS.CLEAR_BUTTON);

      const messageCount = await page.locator(CONFIG.SELECTORS.MESSAGE).count();
      expect(messageCount).toBe(0);
    });
  });
});
