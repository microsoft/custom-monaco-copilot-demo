/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { test as base } from '@playwright/test';

// Configuration constants
const CONFIG = {
  SERVER_URL: 'http://localhost:3000',
  VIEWPORT: { width: 1280, height: 720 },
  TIMEOUTS: {
    PAGE_LOAD: 10000,
    RETRY_INTERVAL: 2000,
    EDITOR_STABILIZATION: 1000
  },
  MAX_RETRIES: 5,
  SELECTORS: {
    API_KEY_INPUT: '.api-key-input',
    API_KEY_SUBMIT: '.api-key-submit',
    EDITOR: '.monaco-editor',
    EDITOR_TEXTBOX: '.monaco-editor [role="textbox"]'
  }
};

/**
 * Attempts to connect to the development server with retries
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} retries - Number of connection attempts
 * @returns {Promise<boolean>} - Connection success status
 * @throws {Error} If server connection fails after all retries
 */
const waitForServer = async (page, retries = CONFIG.MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(CONFIG.SERVER_URL, { 
        timeout: CONFIG.TIMEOUTS.PAGE_LOAD,
        waitUntil: 'networkidle'
      });
      return true;
    } catch (e) {
      console.log(`Attempt ${i + 1}/${retries} to connect to server failed. Retrying...`);
      if (i === retries - 1) {
        throw new Error(
          `Server not ready after ${retries} attempts. ` +
          `Make sure 'npm start' is running.\nError: ${e.message}`
        );
      }
      await new Promise(resolve => setTimeout(resolve, CONFIG.TIMEOUTS.RETRY_INTERVAL));
    }
  }
};

/**
 * Extended test fixture with custom viewport settings
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.setViewportSize(CONFIG.VIEWPORT);
    await use(page);
  },
});

/**
 * Sets up the test environment including server connection and API key configuration
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @throws {Error} If OPENAI_API_KEY is not set or if setup fails
 */
export const setupTest = async (page) => {
  // Ensure server is running and accessible
  await waitForServer(page);
  
  // Validate API key presence
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  try {
    // Configure API key
    await page.waitForSelector(CONFIG.SELECTORS.API_KEY_INPUT, { state: 'visible' });
    await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, apiKey);
    await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);
    
    // Wait for editor initialization
    await page.waitForSelector(CONFIG.SELECTORS.EDITOR, { state: 'visible' });
    await page.waitForSelector(CONFIG.SELECTORS.EDITOR_TEXTBOX, {
      state: 'visible'
    });
    
    // Ensure editor stability
    await page.waitForTimeout(CONFIG.TIMEOUTS.EDITOR_STABILIZATION);
  } catch (error) {
    throw new Error(`Test setup failed: ${error.message}`);
  }
}

/**
 * Helper function to wait for element with retry
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Element selector
 * @param {Object} options - Wait options
 */
export const waitForElementWithRetry = async (page, selector, options = {}) => {
  const { timeout = 10000, state = 'visible' } = options;
  await page.waitForSelector(selector, { state, timeout });
};
