/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useState, useCallback } from 'react';
import Message from './Message';
import './ChatBox.css';

const ChatBox = ({ onMessageSent, messages, hasErrors, onClearChat }) => {
  const [currentInput, setCurrentInput] = useState('');

  const isInputEmpty = useCallback(() => currentInput.trim() === '', [currentInput]);

  const handleInputChange = (event) => setCurrentInput(event.target.value);

  const sendMessage = useCallback(() => {
    if (isInputEmpty()) return;
    onMessageSent(currentInput);
    setCurrentInput('');
  }, [currentInput, onMessageSent, isInputEmpty]);

  const handleCodeCopy = useCallback((code) => {
    navigator.clipboard.writeText(code);
  }, []);

  const handleProposeFixClick = () => {
    onMessageSent("Help me review the code for any syntax errors.");
  };

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((message, index) => (
          <Message
            key={`${message.id}-${index}`}
            text={message.text}
            type={message.type}
            onCodeCopy={handleCodeCopy}
          />
        ))}
      </div>
      <form className="input-area" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          value={currentInput}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button type="button" className="clear-chat-button" onClick={onClearChat}>
          🗑️
        </button>
        {hasErrors && (
          <button type="button" className="propose-fix-button" onClick={handleProposeFixClick}>
            ✨ Propose Fix
          </button>
        )}
        <button type="submit" onClick={sendMessage}>Send</button>
      </form>
    </div>
  );
};

export default ChatBox;