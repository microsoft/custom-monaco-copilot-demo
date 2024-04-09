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
        monaco.languages.register({ id: 'apimPolicies' });

        monaco.languages.setMonarchTokensProvider('apimPolicies', {
            tokenizer: {
                root: [
                    // Match XML Tags
                    [/<\/?[a-zA-Z_-]+>/, "tag"],

                    // Match XML Attributes
                    [/([a-zA-Z0-9_-]+)=/, "attribute"],

                    // Match strings (attribute values)
                    [/\"[^\"]*\"/, "string"],

                    // Specific highlighting for commonly used policy sections
                    [/<inbound>/, "custom-inbound"],
                    [/<backend>/, "custom-backend"],
                    [/<outbound>/, "custom-outbound"],
                    [/<on-error>/, "custom-onerror"],

                    // Comments
                    [/<!--[\s\S]*?-->/, "comment"]
                ]
            }
        });

        monaco.editor.defineTheme('apimPolicyTheme', {
            base: 'vs-dark', // can also be vs-dark or hc-black
            inherit: true, // inherits the base theme's styles
            rules: [
                { token: 'tag', foreground: '436ea3' }, // Blue for XML tags
                { token: 'attribute', foreground: 'ff0000'}, // Red for attributes
                { token: 'string', foreground: '008000'}, // Green for attribute values
                { token: 'comment', foreground: 'aaaaaa', fontStyle: 'italic'}, // Grey and italic for comments
                // Custom colors for specific policy sections
                { token: 'custom-inbound', foreground: 'FF4500'}, // Orangered for <inbound>
                { token: 'custom-backend', foreground: '2E8B57'}, // Seagreen for <backend>
                { token: 'custom-outbound', foreground: '1E90FF'}, // Dodgerblue for <outbound>
                { token: 'custom-onerror', foreground: 'DAA520'}, // Goldenrod for <on-error>
            ]
        });

        monaco.editor.setTheme('apimPolicyTheme');
    }
}

export default SyntaxHighlighter;