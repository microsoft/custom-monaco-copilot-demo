/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { test as base, expect } from '@playwright/test';

// Configuration constants
const CONFIG = {
  SERVER_URL: 'http://localhost:3000',
  VIEWPORT: { width: 1280, height: 720 },
  MOCK_API_KEY: 'sk-mock-test-key-12345',
  MOCK_API_URL: 'https://api.openai.com/v1/chat/completions',
  TIMEOUTS: {
    PAGE_LOAD: 10000,
    RETRY_INTERVAL: 2000,
    EDITOR_STABILIZATION: 1000,
  },
  MAX_RETRIES: 5,
  SELECTORS: {
    API_KEY_INPUT: '.api-key-input',
    API_URL_INPUT: '.api-url-input',
    API_KEY_SUBMIT: '.api-key-submit',
    EDITOR: '.monaco-editor',
    EDITOR_TEXTBOX: '.monaco-editor [role="textbox"]',
    EDITOR_LINES: '.monaco-editor .view-lines',
    CHAT_INPUT: '.input-area input',
    CHAT_SEND: '.input-area button[type="submit"]',
    MESSAGES: '.messages',
    MESSAGE: '.messages .message',
    USER_MESSAGE: '.messages .message.user',
    BOT_MESSAGE: '.messages .message.bot',
    CLEAR_BUTTON: '.clear-chat-button',
    PROPOSE_FIX_BUTTON: '.propose-fix-button',
    CODE_BLOCK: 'pre code',
    COPY_BUTTON: '.copy-button',
    SUGGESTION_WIDGET: '.monaco-editor .suggest-widget',
  },
};

/**
 * Creates a streaming SSE response body for chat completions
 * @param {string} content - The content to stream
 * @returns {string} SSE formatted response body
 */
function createStreamingResponse(content) {
  const chunks = [];
  // Split content into small chunks to simulate streaming
  const words = content.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = (i > 0 ? ' ' : '') + words[i];
    chunks.push(
      `data: ${JSON.stringify({
        id: 'chatcmpl-mock',
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            delta: { content: word },
            finish_reason: null,
          },
        ],
      })}\n\n`
    );
  }
  chunks.push('data: [DONE]\n\n');
  return chunks.join('');
}

/**
 * Creates a non-streaming JSON response for completions (code suggestions)
 * @param {string} content - The suggestion content
 * @returns {object} JSON response body
 */
function createCompletionResponse(content) {
  return {
    id: 'chatcmpl-mock',
    object: 'chat.completion',
    created: Date.now(),
    model: 'gpt-4',
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
  };
}

/**
 * Sets up a mock OpenAI API route on the page.
 * Intercepts fetch requests to the OpenAI chat completions endpoint.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {string} [options.chatResponse] - Default chat response content
 * @param {string} [options.codeResponse] - Default code suggestion response
 * @param {Function} [options.handler] - Custom handler function(route, request)
 */
async function setupMockOpenAI(page, options = {}) {
  const {
    chatResponse = 'This is a mocked response from the AI assistant.',
    codeResponse = '<set-header name="X-Custom" exists-action="override">\n  <value>custom-value</value>\n</set-header>',
    handler,
  } = options;

  await page.route('**/v1/chat/completions', async (route) => {
    if (handler) {
      return handler(route, route.request());
    }

    const request = route.request();
    const postData = request.postDataJSON();
    const isStreaming = postData?.stream === true;

    if (isStreaming) {
      // Streaming response for chat
      const body = createStreamingResponse(chatResponse);
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    } else {
      // Non-streaming response for code suggestions
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createCompletionResponse(codeResponse)),
      });
    }
  });
}

/**
 * Sets up a mock that returns an error response
 * @param {import('@playwright/test').Page} page
 * @param {number} statusCode
 * @param {string} errorMessage
 */
async function setupMockOpenAIError(page, statusCode = 401, errorMessage = 'Invalid API key') {
  await page.route('**/v1/chat/completions', async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          message: errorMessage,
          type: 'invalid_request_error',
          code: 'invalid_api_key',
        },
      }),
    });
  });
}

/**
 * Attempts to connect to the development server with retries
 */
const waitForServer = async (page, retries = CONFIG.MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(CONFIG.SERVER_URL, {
        timeout: CONFIG.TIMEOUTS.PAGE_LOAD,
        waitUntil: 'networkidle',
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
      await new Promise((resolve) => setTimeout(resolve, CONFIG.TIMEOUTS.RETRY_INTERVAL));
    }
  }
};

/**
 * Extended test fixture with custom viewport and mocked OpenAI
 */
const test = base.extend({
  page: async ({ page }, use) => {
    await page.setViewportSize(CONFIG.VIEWPORT);
    await use(page);
  },
});

/**
 * Sets up the test environment with mocked OpenAI API
 * @param {import('@playwright/test').Page} page
 * @param {object} [mockOptions] - Options for the OpenAI mock
 */
const setupMockedTest = async (page, mockOptions = {}) => {
  // Set up the mock before navigating
  await setupMockOpenAI(page, mockOptions);

  // Navigate to the app
  await waitForServer(page);

  // Configure API key using the mock key
  await page.waitForSelector(CONFIG.SELECTORS.API_KEY_INPUT, { state: 'visible' });
  await page.fill(CONFIG.SELECTORS.API_KEY_INPUT, CONFIG.MOCK_API_KEY);
  await page.click(CONFIG.SELECTORS.API_KEY_SUBMIT);

  // Wait for editor initialization
  await page.waitForSelector(CONFIG.SELECTORS.EDITOR, { state: 'visible' });
  await page.waitForSelector(CONFIG.SELECTORS.EDITOR_LINES, { state: 'visible' });

  // Ensure editor stability
  await page.waitForTimeout(CONFIG.TIMEOUTS.EDITOR_STABILIZATION);
};

/**
 * Sends a chat message via the UI
 * @param {import('@playwright/test').Page} page
 * @param {string} message
 */
const sendChatMessage = async (page, message) => {
  const chatInput = await page.waitForSelector(CONFIG.SELECTORS.CHAT_INPUT, {
    state: 'visible',
  });
  await chatInput.fill(message);
  await chatInput.press('Enter');
};

/**
 * Waits for a bot response message to appear
 * @param {import('@playwright/test').Page} page
 * @param {number} timeout
 */
const waitForBotResponse = async (page, timeout = 15000) => {
  await expect(page.locator(CONFIG.SELECTORS.BOT_MESSAGE).first()).toBeVisible({
    timeout,
  });
};

export {
  test,
  CONFIG,
  setupMockedTest,
  setupMockOpenAI,
  setupMockOpenAIError,
  sendChatMessage,
  waitForBotResponse,
  createStreamingResponse,
  createCompletionResponse,
};
