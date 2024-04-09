/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

class EditorInitializer {
  constructor(monacoInstance, editorContainer, editorTheme, initialContent) {
    this.monaco = monacoInstance;
    this.editorContainer = editorContainer;
    this.editorTheme = editorTheme;
    this.initialContent = initialContent;
  }

  initialize() {
    const editor = this._createEditor();
    this._configureEditor(editor);
    this._applyTheme();

    return editor;
  }

  _createEditor() {
    return this.monaco.editor.create(this.editorContainer, {
      automaticLayout: true,
      fontSize: 16,
      language: 'xml',
      value: this.initialContent,
      minimap: { enabled: true },
    });
  }

  _configureEditor(editor) {
    const triggerSuggestCommand = this.monaco.KeyMod.Alt | this.monaco.KeyCode.Space;
    const contextCondition = 'editorTextFocus && !editorHasSelection && ' +
                             '!editorHasMultipleSelections && !editorTabMovesFocus && ' +
                             '!hasQuickSuggest';
    
    editor.addCommand(triggerSuggestCommand, () => {
      editor.trigger('', 'editor.action.triggerSuggest', '');
    }, contextCondition);
  }

  _applyTheme() {
    this.monaco.editor.defineTheme('customTheme', this.editorTheme);
    this.monaco.editor.setTheme('customTheme');
  }
}

export default EditorInitializer;
