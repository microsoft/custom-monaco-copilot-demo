/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect } from '@playwright/test';
import { test, CONFIG, setupMockedTest } from './mock-utils';

test.describe('App Loading and Initial State', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockedTest(page);
  });

  test('should load the application successfully', async ({ page }) => {
    await expect(page).toHaveTitle('Custom Copilot Demo');
  });

  test('should display the API key input form', async ({ page }) => {
    const apiKeyInput = page.locator(CONFIG.SELECTORS.API_KEY_INPUT);
    await expect(apiKeyInput).toBeVisible();
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  test('should display the API URL input', async ({ page }) => {
    const apiUrlInput = page.locator(CONFIG.SELECTORS.API_URL_INPUT);
    await expect(apiUrlInput).toBeVisible();
  });

  test('should display the Save button', async ({ page }) => {
    const submitButton = page.locator(CONFIG.SELECTORS.API_KEY_SUBMIT);
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveText('Save');
  });

  test('should display the Monaco editor', async ({ page }) => {
    const editor = page.locator(CONFIG.SELECTORS.EDITOR).first();
    await expect(editor).toBeVisible();
  });

  test('should display the editor textbox', async ({ page }) => {
    // In Monaco v0.55+, the textbox uses EditContext API and is a hidden div.
    // We verify it exists and is attached (even though not visually visible).
    const editorTextbox = page.locator(CONFIG.SELECTORS.EDITOR_TEXTBOX);
    await expect(editorTextbox).toBeAttached();
  });

  test('should display the chat area', async ({ page }) => {
    const chatBox = page.locator('.chat-box');
    await expect(chatBox).toBeVisible();
  });

  test('should display the chat input field', async ({ page }) => {
    const chatInput = page.locator(CONFIG.SELECTORS.CHAT_INPUT);
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toHaveAttribute('placeholder', 'Type a message...');
  });

  test('should display the Send button', async ({ page }) => {
    const sendButton = page.locator(CONFIG.SELECTORS.CHAT_SEND);
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toHaveText('Send');
  });

  test('should display the clear chat button', async ({ page }) => {
    const clearButton = page.locator(CONFIG.SELECTORS.CLEAR_BUTTON);
    await expect(clearButton).toBeVisible();
  });

  test('should have default XML policy content in editor', async ({ page }) => {
    // Clear localStorage to get default content
    await page.evaluate(() => localStorage.removeItem('editorContent'));
    await page.reload();
    await setupMockedTest(page);

    const editorContent = await page.locator('.monaco-editor .view-lines').textContent();
    expect(editorContent).toContain('policies');
    expect(editorContent).toContain('inbound');
  });

  test('should have no chat messages initially', async ({ page }) => {
    const messageCount = await page.locator(CONFIG.SELECTORS.MESSAGE).count();
    expect(messageCount).toBe(0);
  });

  test('should not display propose fix button when no errors', async ({ page }) => {
    const proposeFixButton = page.locator(CONFIG.SELECTORS.PROPOSE_FIX_BUTTON);
    await expect(proposeFixButton).toHaveCount(0);
  });
});
