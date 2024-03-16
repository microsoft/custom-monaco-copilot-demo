

<div id="top"></div>

<br />
<div align="center">
  <img src="https://github.com/microsoft/custom-monaco-copilot-demo/blob/main/demo.png"> 

  <h1 align="center">Custom Copilot for Monaco (Sample Code)</h1>
  <p align="center">
    This repository contains a sample implementation of an AI-assisted code editor that provides intelligent code suggestions, XML validation, error highlighting, theme customization, and chat integration. The editor leverages the Monaco editor and the OpenAI API to enhance the coding experience. 
    <br />
    <br />
    👉 Live Demo (coming soon)
    ·
    🐞 <a href="https://github.com/microsoft/custom-monaco-opilot-demo/issues">Report Bug</a>
    ·
    💡 <a href="https://github.com/microsoft/custom-monaco-copilot-demo/issues">Request Feature</a>
  </p>
</div>
<br />


## Key Features

### 1. Trigger Code Suggestions (Ctrl + Space)

Users can trigger code suggestions using a keyboard shortcut (Alt + Space on Mac and Ctrl Space on Windows). This is implemented in the `EditorInitializer` class ([src/components/Editor/EditorInitializer.js](https://github.com/microsoft/custom-monaco-copilot-demo/blob/main/src/components/Editor/EditorInitializer.js#L22-L29)).

``` javascript
const triggerSuggestCommand = this.monaco.KeyMod.Alt | this.monaco.KeyCode.Space;
const contextCondition = 'editorTextFocus && !editorHasSelection && ' +
                         '!editorHasMultipleSelections && !editorTabMovesFocus && ' +
                         '!hasQuickSuggest';

editor.addCommand(triggerSuggestCommand, () => {
  editor.trigger('', 'editor.action.triggerSuggest', '');
}, contextCondition);
``` 

### 2. Model Validation

The `ModelValidation` feature performs XML validation on the editor content and highlights errors. It is implemented in the `XmlValidator` class ([src/components/Editor/XmlValidator.js](src/components/Editor/XmlValidator.js)).

``` javascript
validate() {
  const xmlDoc = this._parseXml();
  const errors = [
    ...this._validatePolicyAttributes(xmlDoc),
  ];

  this._setModelMarkers(errors);

  return errors;
}
``` 

### 3. Theme Customization

`ThemeCustomization` applies a custom theme to the Monaco editor. The custom theme is defined in the `MonacoTheme` object ([src/components/Editor/MonacoTheme.js](src/components/Editor/MonacoTheme.js)).

``` javascript
_applyTheme() {
  this.monaco.editor.defineTheme('customTheme', this.editorTheme);
  this.monaco.editor.setTheme('customTheme');
}
``` 

### 4. Code Suggestions

The `CodeSuggestions` feature provides context-aware code completion suggestions using the OpenAI API. It is implemented in the `CodeSuggester` class ([src/components/Editor/CodeSuggester.js](src/components/Editor/CodeSuggester.js)).

``` javascript
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
``` 

### 5. Chat Integration

The ChatIntegration feature enhances your coding experience by allowing you to ask questions about your code and utilize the chat interface to diagnose and fix syntax errors. It is implemented in the `ChatBox` component ([src/components/Chat/ChatBox.js](src/components/Chat/ChatBox.js)).

``` javascript
const handleMessageSent = async (message) => {
  setMessages((prevMessages) => [...prevMessages, { type: 'user', text: message }]);
  setIsStreaming(true);
  setHasErrors(false);
  const currentModel = monaco.editor.getModels()[0];
  const currentCode = currentModel.getValue();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant that helps with coding and Azure API Management policy development. Provide helpful suggestions and answers based on the code context and user messages.',
        },
        {
          role: 'user',
          content: `Here's the current code:\n\n${currentCode}\n\nUser message: ${message}`,
        },
      ],
      max_tokens: 500,
      n: 1,
      stream: true,
      temperature: 0.7,
    }),
  });

  // Process the response and update the chat messages
  // ...
};
``` 

## Usage
> [!NOTE]
> This is strictly for demonstration and educational purposes, and is not intended or appropriate for production use.
To use the AI-assisted code editor:

- Clone the repository: `git clone https://github.com/microsoft/custom-monaco-copilot-demo.git`
- Install the dependencies: `npm install`
- Run it: : `npm start`
- Open the browser and set up your OpenAI API key in the App

## Contributors
<p float="left">
  <a href="https://github.com/aymenfurter">
    <img src="https://github.com/aymenfurter.png" width="100" height="100" alt="aymenfurter" style="border-radius:50%;"/>
  </a>
  <a href="https://github.com/curia-damiano">
    <img src="https://github.com/curia-damiano.png" width="100" height="100" alt="curia-damiano" style="border-radius:50%;"/>
  </a>
  <a href="https://github.com/frarin">
    <img src="https://github.com/frarin.png" width="100" height="100" alt="frarin" style="border-radius:50%;"/>
  </a>
  <a href="https://github.com/yasminSarbaoui93">
    <img src="https://github.com/yasminSarbaoui93.png" width="100" height="100" alt="yasminSarbaoui93" style="border-radius:50%;"/>
  </a>
  <a href="https://github.com/crgarcia12">
    <img src="https://github.com/crgarcia12.png" width="100" height="100" alt="crgarcia12" style="border-radius:50%;"/>
  </a>
</p>

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
