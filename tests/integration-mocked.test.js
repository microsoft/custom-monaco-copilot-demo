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

test.describe('Chat and Editor Integration', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockedTest(page, {
      chatResponse:
        'Here is a set-header policy:\n\n```xml\n<set-header name="Authorization" exists-action="override">\n  <value>Bearer token123</value>\n</set-header>\n```',
    });
  });

  test('should send current editor content as context in chat', async ({ page }) => {
    let capturedBody = null;

    await page.route('**/v1/chat/completions', async (route) => {
      const request = route.request();
      capturedBody = request.postDataJSON();
      const body = `data: ${JSON.stringify({
        choices: [{ delta: { content: 'Response' }, finish_reason: null }],
      })}\n\ndata: [DONE]\n\n`;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    // Type content in editor
    const editor = page.locator(CONFIG.SELECTORS.EDITOR_TEXTBOX);
    await editor.focus();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('<policies><inbound></inbound></policies>');
    await page.waitForTimeout(500);

    // Send a chat message
    await sendChatMessage(page, 'Explain this code');
    await waitForBotResponse(page);

    // Verify the request body included editor content
    expect(capturedBody).toBeTruthy();
    expect(capturedBody.messages).toBeDefined();

    const userMessage = capturedBody.messages.find((m) => m.role === 'user');
    expect(userMessage.content).toContain('policies');
  });

  test('should send streaming request for chat messages', async ({ page }) => {
    let capturedBody = null;

    await page.route('**/v1/chat/completions', async (route) => {
      capturedBody = route.request().postDataJSON();
      const body = `data: ${JSON.stringify({
        choices: [{ delta: { content: 'Streamed response' }, finish_reason: null }],
      })}\n\ndata: [DONE]\n\n`;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await sendChatMessage(page, 'Test streaming');
    await waitForBotResponse(page);

    expect(capturedBody).toBeTruthy();
    expect(capturedBody.stream).toBe(true);
  });

  test('should include system prompt in chat requests', async ({ page }) => {
    let capturedBody = null;

    await page.route('**/v1/chat/completions', async (route) => {
      capturedBody = route.request().postDataJSON();
      const body = `data: ${JSON.stringify({
        choices: [{ delta: { content: 'OK' }, finish_reason: null }],
      })}\n\ndata: [DONE]\n\n`;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await sendChatMessage(page, 'Help me');
    await waitForBotResponse(page);

    const systemMessage = capturedBody.messages.find((m) => m.role === 'system');
    expect(systemMessage).toBeTruthy();
    expect(systemMessage.content).toContain('Azure API Management');
  });

  test('should use gpt-4 model in chat requests', async ({ page }) => {
    let capturedBody = null;

    await page.route('**/v1/chat/completions', async (route) => {
      capturedBody = route.request().postDataJSON();
      const body = `data: ${JSON.stringify({
        choices: [{ delta: { content: 'Response' }, finish_reason: null }],
      })}\n\ndata: [DONE]\n\n`;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await sendChatMessage(page, 'Test model');
    await waitForBotResponse(page);

    expect(capturedBody.model).toBe('gpt-4');
  });

  test('should switch between editor and chat without issues', async ({ page }) => {
    // Type in editor
    const editor = page.locator(CONFIG.SELECTORS.EDITOR_TEXTBOX);
    await editor.focus();
    await page.keyboard.type('<!-- test comment -->');

    // Switch to chat
    await sendChatMessage(page, 'What is this code?');
    await waitForBotResponse(page);

    // Switch back to editor
    await editor.focus();
    await expect(editor).toBeFocused();

    // Both should have their content
    const messageCount = await page.locator(CONFIG.SELECTORS.MESSAGE).count();
    expect(messageCount).toBe(2);
  });
});
