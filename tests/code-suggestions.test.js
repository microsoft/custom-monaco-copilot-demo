/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { test } from './test-utils';
import { expect } from '@playwright/test';
import { setupTest } from './test-utils';

/**
 * Test suite for code suggestion functionality in the Monaco editor
 */
test.describe('Code Suggestions', () => {
  // Selectors
  const SELECTORS = {
    EDITOR: '.monaco-editor [role="textbox"]',
    SUGGESTION_WIDGET: '.monaco-editor .suggest-widget',
    SUGGESTION_ITEM: '.monaco-list-row',
  };

  // Test data
  const TEST_DATA = {
    SAMPLE_POLICY: `<policies>
  <inbound>
    <!-- set variable "foo" = "bar" -->

  </inbound>
</policies>`,
    EXPECTED_TIMEOUT: 10000,
    EDITOR_SETTLE_TIME: 200
  };

  test.beforeEach(async ({ page }) => {
    await setupTest(page);
  });

  /**
   * Helper function to initialize the editor with content
   * @param {Page} page - Playwright page object
   * @param {string} content - Content to initialize editor with
   */
  async function initializeEditor(page, content) {
    const editor = page.locator(SELECTORS.EDITOR);
    await editor.waitFor({ state: 'visible' });
    await editor.focus();
    await page.keyboard.type(content);
  }

  /**
   * Helper function to navigate to a specific line
   * @param {Page} page - Playwright page object
   * @param {number} lineNumber - Target line number (0-based)
   */
  async function navigateToLine(page, lineNumber) {
    await page.keyboard.press('Meta+Home');
    for (let i = 0; i < lineNumber; i++) {
      await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('End');
  }

  /**
   * Helper function to trigger code suggestions
   * @param {Page} page - Playwright page object
   */
  async function triggerSuggestions(page) {
    await page.waitForTimeout(TEST_DATA.EDITOR_SETTLE_TIME);
    await page.keyboard.press('Alt+Space');
  }

  test('should display code suggestions when triggered', async ({ page }) => {
    // Given: Editor is initialized with sample policy
    await initializeEditor(page, TEST_DATA.SAMPLE_POLICY);

    // When: Navigating to insertion point and triggering suggestions
    await navigateToLine(page, 3);
    await page.keyboard.press('Enter');
    await triggerSuggestions(page);

    // Then: Suggestion widget should be visible
    await expect(page.locator(SELECTORS.SUGGESTION_WIDGET)).toBeVisible({
      timeout: TEST_DATA.EXPECTED_TIMEOUT
    });
    await expect(page.locator(SELECTORS.EDITOR)).toBeFocused();
  });

  test('should maintain editor state after suggestion trigger', async ({ page }) => {
    // Given: Editor is initialized
    await initializeEditor(page, TEST_DATA.SAMPLE_POLICY);

    // When: Triggering suggestions multiple times
    await navigateToLine(page, 3);
    await triggerSuggestions(page);
    await page.keyboard.press('Escape');
    await triggerSuggestions(page);

    // Then: Editor should remain in a consistent state
    await expect(page.locator(SELECTORS.EDITOR)).toBeFocused();
    const suggestionWidget = page.locator(SELECTORS.SUGGESTION_WIDGET);
    await expect(suggestionWidget).toBeVisible({
      timeout: TEST_DATA.EXPECTED_TIMEOUT
    });
  });
});
