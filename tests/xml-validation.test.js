/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect } from '@playwright/test';
import { test, CONFIG, setupMockedTest } from './mock-utils';

test.describe('XML Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockedTest(page);
  });

  /**
   * Helper to set editor content
   */
  async function setEditorContent(page, content) {
    const editor = page.locator(CONFIG.SELECTORS.EDITOR_TEXTBOX);
    await editor.focus();
    await page.keyboard.press('Control+a');
    await page.keyboard.type(content);
    await page.waitForTimeout(1000);
  }

  test('should validate valid XML without errors', async ({ page }) => {
    await setEditorContent(
      page,
      '<policies>\n  <inbound>\n    <set-header name="X-Test" exists-action="override">\n      <value>test</value>\n    </set-header>\n  </inbound>\n</policies>'
    );

    // The propose fix button should NOT be visible when there are no errors
    const proposeFixButton = page.locator(CONFIG.SELECTORS.PROPOSE_FIX_BUTTON);
    await expect(proposeFixButton).toHaveCount(0);
  });

  test('should detect invalid attributes on policy elements', async ({ page }) => {
    await setEditorContent(
      page,
      '<policies>\n  <inbound>\n    <set-header name="X-Test" invalid-attr="bad">\n      <value>test</value>\n    </set-header>\n  </inbound>\n</policies>'
    );

    // Wait for validation to run
    await page.waitForTimeout(1500);

    // The propose fix button should appear when there are errors
    const proposeFixButton = page.locator(CONFIG.SELECTORS.PROPOSE_FIX_BUTTON);
    await expect(proposeFixButton).toBeVisible({ timeout: 5000 });
  });

  test('should show propose fix button when XML has errors', async ({ page }) => {
    await setEditorContent(
      page,
      '<policies>\n  <inbound>\n    <rate-limit calls="5" invalid-attribute="test" renewal-period="60" />\n  </inbound>\n</policies>'
    );

    await page.waitForTimeout(1500);

    const proposeFixButton = page.locator(CONFIG.SELECTORS.PROPOSE_FIX_BUTTON);
    await expect(proposeFixButton).toBeVisible({ timeout: 5000 });
  });

  test('should trigger chat when propose fix is clicked', async ({ page }) => {
    // Set up mock for the propose fix chat
    await page.route('**/v1/chat/completions', async (route) => {
      const body = `data: ${JSON.stringify({
        choices: [
          {
            delta: { content: 'Remove the invalid attribute from the rate-limit policy.' },
            finish_reason: null,
          },
        ],
      })}\n\ndata: [DONE]\n\n`;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await setEditorContent(
      page,
      '<policies>\n  <inbound>\n    <rate-limit calls="5" bad-attr="x" renewal-period="60" />\n  </inbound>\n</policies>'
    );

    await page.waitForTimeout(1500);

    const proposeFixButton = page.locator(CONFIG.SELECTORS.PROPOSE_FIX_BUTTON);
    await expect(proposeFixButton).toBeVisible({ timeout: 5000 });
    await proposeFixButton.click();

    // A user message should appear in chat requesting fix
    const userMessage = page.locator(CONFIG.SELECTORS.USER_MESSAGE);
    await expect(userMessage.first()).toBeVisible({ timeout: 5000 });
    await expect(userMessage.first()).toContainText('syntax errors');
  });

  test('should hide propose fix button after fixing errors', async ({ page }) => {
    // First add invalid content
    await setEditorContent(
      page,
      '<policies>\n  <inbound>\n    <set-header name="X" bad="y" exists-action="override">\n      <value>v</value>\n    </set-header>\n  </inbound>\n</policies>'
    );

    await page.waitForTimeout(1500);

    const proposeFixButton = page.locator(CONFIG.SELECTORS.PROPOSE_FIX_BUTTON);
    await expect(proposeFixButton).toBeVisible({ timeout: 5000 });

    // Now fix the content
    await setEditorContent(
      page,
      '<policies>\n  <inbound>\n    <set-header name="X" exists-action="override">\n      <value>v</value>\n    </set-header>\n  </inbound>\n</policies>'
    );

    await page.waitForTimeout(1500);

    // Propose fix button should be gone
    await expect(proposeFixButton).toHaveCount(0);
  });
});
