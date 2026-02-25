/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as monaco from 'monaco-editor';

class SyntaxHighlighter {
    constructor(monacoInstance, editor) {
        this.monaco = monacoInstance;
        this.editor = editor;
    }

    initialize() {
        // Define the theme first
        monaco.editor.defineTheme('apimPolicyTheme', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'tag', foreground: '436ea3' },
                { token: 'attribute', foreground: 'ff0000'},
                { token: 'string', foreground: '008000'},
                { token: 'comment', foreground: 'aaaaaa', fontStyle: 'italic'},
                { token: 'custom-inbound', foreground: 'FF4500'},
                { token: 'custom-backend', foreground: '2E8B57'},
                { token: 'custom-outbound', foreground: '1E90FF'},
                { token: 'custom-onerror', foreground: 'DAA520'},
            ],
            colors: {
                'editor.foreground': '#d4d4d4',
                'editor.background': '#1e1e1e',
                'editor.selectionBackground': '#264f78',
                'editor.lineHighlightBackground': '#2a2d2e'
            }
        });

        // Set the theme
        monaco.editor.setTheme('apimPolicyTheme');

        // Register the language after theme is set
        monaco.languages.register({ id: 'apimPolicies' });

        monaco.languages.setMonarchTokensProvider('apimPolicies', {
            tokenizer: {
                root: [
                    [/<\/?[a-zA-Z_-]+>/, "tag"],
                    [/([a-zA-Z0-9_-]+)=/, "attribute"],
                    [/"[^"]*"/, "string"],
                    [/<inbound>/, "custom-inbound"],
                    [/<backend>/, "custom-backend"],
                    [/<outbound>/, "custom-outbound"],
                    [/<on-error>/, "custom-onerror"],
                    [/<!--[\s\S]*?-->/, "comment"]
                ]
            }
        });
    }
}

export default SyntaxHighlighter;