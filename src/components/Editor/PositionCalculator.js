/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

class PositionCalculator {
  getLineNumber(xmlString, node) {
    const nodePosition = xmlString.indexOf(node.outerHTML);
    const xmlSubstring = xmlString.substring(0, nodePosition);
    return xmlSubstring.split('\n').length;
  }

  getColumnNumber(xmlString, node, attributeName) {
    const nodePosition = xmlString.indexOf(node.outerHTML);
    const attributePosition = xmlString.indexOf(attributeName, nodePosition);
    const xmlSubstring = xmlString.substring(0, attributePosition);
    const linePosition = xmlSubstring.lastIndexOf('\n');
    return attributePosition - linePosition;
  }
}

export default PositionCalculator;