/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const MonacoTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    // Editor main colors
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    
    // Line numbers
    'editorLineNumber.foreground': '#858585',
    
    // Cursor and selection
    'editorCursor.foreground': '#d4d4d4',
    'editor.selectionBackground': '#264f78',
    'editor.inactiveSelectionBackground': '#3a3d41',
    
    // Editor widgets (e.g., find, replace)
    'editorWidget.background': '#252526',
    'editorWidget.border': '#454545',
    
    // Suggestion widget
    'editorSuggestWidget.background': '#252526',
    'editorSuggestWidget.border': '#454545',
    'editorSuggestWidget.foreground': '#d4d4d4',
    'editorSuggestWidget.highlightForeground': '#0097fb',
    'editorSuggestWidget.selectedBackground': '#264f78',
    
    // Hover widget
    'editorHoverWidget.background': '#252526',
    'editorHoverWidget.border': '#454545',
    
    // Gutter (left side line modification indicators)
    'editorGutter.background': '#1e1e1e',
    'editorGutter.modifiedBackground': '#0097fb',
    'editorGutter.addedBackground': '#487e02',
    'editorGutter.deletedBackground': '#f44747',
  },
};

export default MonacoTheme;