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