/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { expect } from '@playwright/test';
import { test, CONFIG, setupMockedTest } from './mock-utils';

test.describe('Monaco Editor Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockedTest(page);
  });

  test('should allow typing in the editor', async ({ page }) => {
    const editor = page.locator(CONFIG.SELECTORS.EDITOR_TEXTBOX);
    await editor.focus();

    // Select all and replace
    await page.keyboard.press('Control+a');
    await page.keyboard.type('<policies>\n  <inbound>\n  </inbound>\n</policies>');

    await page.waitForTimeout(500);
    // Editor saves content to localStorage on change
    const savedContent = await page.evaluate(() => localStorage.getItem('editorContent'));
    expect(savedContent).toContain('policies');
  });

  test('should maintain focus when clicking in editor', async ({ page }) => {
    const editor = page.locator(CONFIG.SELECTORS.EDITOR_TEXTBOX);
    await editor.focus();
    await expect(editor).toBeFocused();
  });

  test('should persist editor content to localStorage', async ({ page }) => {
    const editor = page.locator(CONFIG.SELECTORS.EDITOR_TEXTBOX);
    await editor.focus();

    // Type some content
    await page.keyboard.press('Control+a');
    await page.keyboard.type('<policies><inbound></inbound></policies>');

    await page.waitForTimeout(1000);

    const savedContent = await page.evaluate(() => localStorage.getItem('editorContent'));
    expect(savedContent).toBeTruthy();
    expect(savedContent).toContain('policies');
  });

  test('should restore editor content from localStorage on reload', async ({ page }) => {
    const testContent = '<policies><inbound><!-- persisted --></inbound></policies>';
    await page.evaluate(
      (content) => localStorage.setItem('editorContent', content),
      testContent
    );

    await page.reload();
    await setupMockedTest(page);

    await page.waitForTimeout(1000);
    const editorContent = await page.locator('.monaco-editor .view-lines').textContent();
    expect(editorContent).toContain('persisted');
  });

  test('should have default XML content when no saved content exists', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('editorContent'));
    await page.reload();
    await setupMockedTest(page);

    const editorContent = await page.locator('.monaco-editor .view-lines').textContent();
    expect(editorContent).toContain('policies');
    expect(editorContent).toContain('inbound');
    expect(editorContent).toContain('backend');
    expect(editorContent).toContain('outbound');
    expect(editorContent).toContain('on-error');
  });

  test('should display line numbers', async ({ page }) => {
    const lineNumbers = page.locator('.monaco-editor .line-numbers');
    const count = await lineNumbers.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display minimap', async ({ page }) => {
    const minimap = page.locator('.monaco-editor .minimap');
    await expect(minimap).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    const editor = page.locator(CONFIG.SELECTORS.EDITOR_TEXTBOX);
    await editor.focus();

    // Use keyboard shortcuts
    await page.keyboard.press('Control+Home'); // Go to start
    await page.keyboard.press('End'); // Go to end of line
    await page.keyboard.press('ArrowDown'); // Move down

    // Editor should still be focused
    await expect(editor).toBeFocused();
  });

  test('should handle multi-line content', async ({ page }) => {
    const editor = page.locator(CONFIG.SELECTORS.EDITOR_TEXTBOX);
    await editor.focus();

    await page.keyboard.press('Control+a');
    const multiLineContent = [
      '<policies>',
      '  <inbound>',
      '    <set-header name="X-Test" exists-action="override">',
      '      <value>test-value</value>',
      '    </set-header>',
      '  </inbound>',
      '  <backend>',
      '    <forward-request />',
      '  </backend>',
      '  <outbound />',
      '  <on-error />',
      '</policies>',
    ].join('\n');
    await page.keyboard.type(multiLineContent);

    await page.waitForTimeout(500);
    const savedContent = await page.evaluate(() => localStorage.getItem('editorContent'));
    expect(savedContent).toContain('set-header');
    expect(savedContent).toContain('forward-request');
  });
});
