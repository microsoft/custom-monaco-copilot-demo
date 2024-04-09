/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import policySnippets from './PolicySnippets';
import PositionCalculator from './PositionCalculator';

class XmlValidator {
  constructor(editor, monaco) {
    this.editor = editor;
    this.monaco = monaco;
    this.positionCalculator = new PositionCalculator();
  }

  validate() {
    const xmlDoc = this._parseXml();
    const errors = [
      ...this._validatePolicyAttributes(xmlDoc),
    ];

    this._setModelMarkers(errors);

    return errors;
  }

  _parseXml() {
    const xmlString = this.editor.getValue();
    return new DOMParser().parseFromString(xmlString, 'text/xml');
  }

  _validatePolicyAttributes(xmlDoc) {
    const errors = [];

    policySnippets.forEach(snippet => {
      const elements = xmlDoc.getElementsByTagName(snippet.label);
      Array.from(elements).forEach(element => {
        const allowedAttributes = snippet.attributes || [];
        Array.from(element.attributes).forEach(attribute => {
          if (!allowedAttributes.includes(attribute.name)) {
            errors.push(this._createAttributeError(element, attribute));
          }
        });
      });
    });

    return errors;
  }

  _createAttributeError(element, attribute) {
    const xmlString = this.editor.getValue();
    const lineNumber = this.positionCalculator.getLineNumber(xmlString, element);
    const startColumn = this.positionCalculator.getColumnNumber(xmlString, element, attribute.name);

    return {
      severity: this.monaco.MarkerSeverity.Error,
      message: `Unknown attribute: ${attribute.name}`,
      startLineNumber: lineNumber,
      startColumn: startColumn,
      endLineNumber: lineNumber,
      endColumn: startColumn + attribute.name.length,
    };
  }

  _setModelMarkers(errors) {
    this.monaco.editor.setModelMarkers(this.editor.getModel(), 'xml', errors);
  }
}

export default XmlValidator;