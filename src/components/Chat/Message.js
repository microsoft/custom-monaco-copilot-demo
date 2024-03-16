import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language, children, onCodeCopy, ...props }) => {
  const content = String(children).replace(/\n$/, '');
  return (
    <div className="code-block">
      <SyntaxHighlighter style={tomorrow} language={language} PreTag="div" {...props}>
        {content}
      </SyntaxHighlighter>
      <button className="copy-button" onClick={() => onCodeCopy(content)}>
        Copy
      </button>
    </div>
  );
};

const InlineCode = ({ className, children, ...props }) => (
  <code className={className} {...props}>
    {children}
  </code>
);

const CodeComponent = ({ node, inline, className, children, onCodeCopy, ...props }) => {
  const languageMatch = /language-(\w+)/.exec(className || '');
  if (!inline && languageMatch) {
    return <CodeBlock language={languageMatch[1]} onCodeCopy={onCodeCopy} {...props}>{children}</CodeBlock>;
  }
  return <InlineCode className={className} {...props}>{children}</InlineCode>;
};

const Message = ({ text, type, onCodeCopy }) => (
  <div className={`message ${type}`}>
    <ReactMarkdown
      components={{
        code: (props) => <CodeComponent {...props} onCodeCopy={onCodeCopy} />,
      }}
    >
      {text}
    </ReactMarkdown>
  </div>
);

export default Message;