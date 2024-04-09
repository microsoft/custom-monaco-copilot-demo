/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const generateCodeSuggestion = async (prompt, context, apiKey, apiUrl) => {
  const apiURL = apiUrl;
  const requestHeaders = {
      'Content-Type': 'application/json',
    };
  

  if (apiUrl !== 'https://api.openai.com/v1/chat/completions') {
    requestHeaders['api-key'] = apiKey;
  } else {
    requestHeaders['Authorization'] = `Bearer ${apiKey}`;
  }

  const requestBody = createRequestBody(prompt, context);

  try {
    const response = await postRequest(apiURL, requestHeaders, requestBody);
    return handleResponse(response);
  } catch (error) {
    console.error('Error generating code suggestion:', error);
    return null;
  }
};

const createRequestBody = (prompt, context) => {
  return JSON.stringify({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that provides code suggestions.',
      },
      {
        role: 'user',
        content: formatPrompt(prompt, context),
      },
    ],
    max_tokens: 100,
    n: 1,
    stop: null,
    temperature: 0.7,
  });
};

const formatPrompt = (prompt, context) => {
  return `Generate code suggestion for the following prompt:\n\n${prompt}\n\nContext:\n${context}`;
};

const postRequest = async (url, headers, body) => {
  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: body,
  });
};

const handleResponse = async (response) => {
  const data = await response.json();

  if (data.error) {
    console.error('Error generating code suggestion:', data.error);
    return null;
  }

  return data.choices && data.choices.length > 0
    ? data.choices[0].message.content.trim()
    : null;
};
