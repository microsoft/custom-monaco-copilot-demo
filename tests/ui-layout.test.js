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
} from './mock-utils';

test.describe('UI Layout and Responsiveness', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockedTest(page);
  });

  test('should have proper layout with editor and chat side by side', async ({ page }) => {
    const editorContainer = page.locator('.editor');
    const chatContainer = page.locator('.chat');

    await expect(editorContainer).toBeVisible();
    await expect(chatContainer).toBeVisible();

    // Both should be in the same row
    const editorBox = await editorContainer.boundingBox();
    const chatBox = await chatContainer.boundingBox();

    expect(editorBox).toBeTruthy();
    expect(chatBox).toBeTruthy();

    // Editor should be to the left of chat
    expect(editorBox.x).toBeLessThan(chatBox.x);
  });

  test('should have dark theme applied', async ({ page }) => {
    const body = page.locator('body');
    const backgroundColor = await body.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    // Should be dark (#1e1e1e = rgb(30, 30, 30))
    expect(backgroundColor).toBe('rgb(30, 30, 30)');
  });

  test('should have API configuration at the top', async ({ page }) => {
    const apiContainer = page.locator('.api-key-container');
    const editorChat = page.locator('.editor-chat-container');

    const apiBox = await apiContainer.boundingBox();
    const editorChatBox = await editorChat.boundingBox();

    expect(apiBox).toBeTruthy();
    expect(editorChatBox).toBeTruthy();

    // API container should be above editor/chat
    expect(apiBox.y).toBeLessThan(editorChatBox.y);
  });

  test('should have chat input at the bottom of chat panel', async ({ page }) => {
    const chatBox = page.locator('.chat-box');
    const inputArea = page.locator('.input-area');

    const chatBoxBounds = await chatBox.boundingBox();
    const inputBounds = await inputArea.boundingBox();

    expect(chatBoxBounds).toBeTruthy();
    expect(inputBounds).toBeTruthy();

    // Input area should be near the bottom of the chat box
    const inputBottom = inputBounds.y + inputBounds.height;
    const chatBottom = chatBoxBounds.y + chatBoxBounds.height;
    expect(Math.abs(inputBottom - chatBottom)).toBeLessThan(5);
  });

  test('should show messages area above input', async ({ page }) => {
    await sendChatMessage(page, 'Test layout');
    await waitForBotResponse(page);

    const messagesArea = page.locator(CONFIG.SELECTORS.MESSAGES);
    const inputArea = page.locator('.input-area');

    const messagesBounds = await messagesArea.boundingBox();
    const inputBounds = await inputArea.boundingBox();

    expect(messagesBounds).toBeTruthy();
    expect(inputBounds).toBeTruthy();

    // Messages should be above input
    expect(messagesBounds.y).toBeLessThan(inputBounds.y);
  });

  test('should style user messages differently from bot messages', async ({ page }) => {
    await sendChatMessage(page, 'Check styling');
    await waitForBotResponse(page);

    const userMessage = page.locator(CONFIG.SELECTORS.USER_MESSAGE).first();
    const botMessage = page.locator(CONFIG.SELECTORS.BOT_MESSAGE).first();

    const userBg = await userMessage.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    const botBg = await botMessage.evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );

    // They should have different background colors
    expect(userBg).not.toBe(botBg);
  });
});
