/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as monaco from 'monaco-editor';
import { generateCodeSuggestion } from '../../api/openai';

class CodeSuggester {
  constructor(editor, apiKey, apiUrl, onSuggestionAccepted) {
    this.editor = editor;
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.onSuggestionAccepted = onSuggestionAccepted;
    this.suggestionDelay = 500; // Consider making this configurable if not already
  }

  async provideCompletionItems(model, position) {
    const textUntilPosition = this.getTextUntilPosition(model, position);

    if (textUntilPosition.length < 3) return { suggestions: [] };

    const suggestion = await this.generateContextAwareCodeSuggestion(
      textUntilPosition, 
      model.getValue(), 
      position
    );

    if (!suggestion) return { suggestions: [] };

    return this.buildCompletionSuggestion(suggestion, position);
  }

  getTextUntilPosition(model, position) {
    return model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });
  }

  buildCompletionSuggestion(suggestion, position) {
    return {
      suggestions: [{
        label: suggestion,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: suggestion,
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
      }],
    };
  }

  async generateContextAwareCodeSuggestion(prompt, context, position) {
    const model = this.editor.getModel();
    if (!model) return null;

    const surroundingCode = this.getSurroundingCode(position);
    const previousLine = model.getLineContent(position.lineNumber - 1);
    const nextLine = model.getLineContent(position.lineNumber + 1);

    const enhancedPrompt = this.formatPrompt(prompt, context, surroundingCode, previousLine, nextLine);

    return generateCodeSuggestion(enhancedPrompt, context, this.apiKey, this.apiUrl);
  }

  formatPrompt(prompt, context, surroundingCode, previousLine, nextLine) {
    return `
      Generate code suggestion for the following prompt in the context of the provided code snippet:

      Language: XML (Azure API Management policy code)

      Prompt: ${prompt}

      Context: ${context}

      Surrounding Code: ${surroundingCode}

      Previous Line: ${previousLine}

      Next Line: ${nextLine}

      Considerations:
      - Only reply with the code snippet, no comments, no explanations.
      - Only generate code that can be inserted as-is at the current position. Don't generate any surrounding code.
      - Ensure the generated code is syntactically correct and fits well within the existing code structure.
      - Use appropriate variable names, function names, and coding conventions based on the surrounding code.
      - Consider the context and purpose of the code snippet to provide meaningful suggestions.
      - If the prompt is ambiguous or lacks sufficient context, provide a best-effort suggestion or indicate that more information is needed.
      
      API Management policy (XML) may contain the following policies:
        - authentication-basic - [username, password]
        - authentication-certificate - [thumbprint, certificate-id]
        - cache-lookup - [vary-by-developer, vary-by-developer-groups, downstream-caching-type], {vary-by-header: [], vary-by-query-parameter: []}
        - cache-store - [duration]
        - check-header - [name, failed-check-httpcode, failed-check-error-message], {value: []}
        - choose - [], {when: [condition], otherwise: []}
        - cors - [allow-credentials], {allowed-origins: [], origin: [], allowed-methods: [], method: [], allowed-headers: [], header: [], expose-headers: []}
        - ip-filter - [action], {address: []}
        - json-to-xml - [apply, consider-accept-header], {'output-xml-encoding': []}
        - quota - [calls, bandwidth, renewal-period], {api: [name]}
        - rate-limit - [calls, renewal-period], {api: [name]}
        - retry - [condition, count, interval, delta, max-interval, first-fast-retry]
        - return-response - [], {status: [code, reason], headers: [], header: [name, exists-action], value: [], body: []}
        - send-request - [mode, response-variable-name], {url: [], method: [], headers: [], header: [name, exists-action], value: [], body: []}
        - set-body - []
        - set-header - [name, exists-action], {value: []}
        - set-query-parameter - [name, exists-action], {value: []}
        - validate-content - [unspecified-content-type-action], {content: [type, validate-as, schema-id]}
        - validate-jwt - [header-name, failed-validation-httpcode, failed-validation-error-message], {openid-config: [url], required-claims: [], claim: [name, match], value: []}
        - validate-parameters - [specified-parameter-action, unspecified-parameter-action], {headers: [specified-parameter-action, unspecified-parameter-action], query: [specified-parameter-action, unspecified-parameter-action]}
        - rewrite-uri - [template]
        - mock-response - [status-code, content-type], {headers: [], header: [name, exists-action], value: [], body: []}
        - xml-to-json - [kind]
        - find-and-replace - [from, to]
        - set-variable - [name, value]

    `;
  }

  getSurroundingCode(position) {
    const model = this.editor.getModel();
    const startLineNumber = Math.max(1, position.lineNumber - 5);
    const endLineNumber = Math.min(model.getLineCount(), position.lineNumber + 5);

    return model.getValueInRange({
      startLineNumber,
      startColumn: 1,
      endLineNumber,
      endColumn: model.getLineMaxColumn(endLineNumber),
    });
  }

  register() {
    this.completionItemProvider = monaco.languages.registerCompletionItemProvider('xml', {
      provideCompletionItems: (model, position) => this.provideCompletionItems(model, position),
    });

    this.editor.onDidChangeCursorSelection(({ selection }) => {
      const model = this.editor.getModel();
      const position = selection.getPosition();
      const word = model.getWordAtPosition(position);
      if (!word) return;

      const suggestion = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      });

      if (suggestion) this.onSuggestionAccepted(suggestion);
    });
  }

  dispose() {
    if (this.completionItemProvider) this.completionItemProvider.dispose();
  }
}

export default CodeSuggester;