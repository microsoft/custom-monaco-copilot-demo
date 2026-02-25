/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  /* Only run the mocked tests by default */
  testMatch: [
    'app-loading.test.js',
    'api-key-config.test.js',
    'chat-mocked.test.js',
    'editor-mocked.test.js',
    'code-suggestions-mocked.test.js',
    'integration-mocked.test.js',
    'error-handling.test.js',
    'ui-layout.test.js',
    'xml-validation.test.js',
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    }
  ],
});