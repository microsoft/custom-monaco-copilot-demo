/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const policySnippets = [
  // Access restriction policies
  {
    label: 'check-header',
    documentation: 'Enforces existence and/or value of an HTTP Header.',
    insertText: `
      <check-header name="header-name" failed-check-httpcode="http-status-code" failed-check-error-message="error-message">
        <value>header-value</value>
      </check-header>
    `.trim(),
    attributes: ['name', 'failed-check-httpcode', 'failed-check-error-message'],
    subElementAttributes: {
      value: []
    }
  },
  { 
    label: 'rate-limit',
    documentation: 'Prevents API usage spikes by limiting call rate, on a per subscription basis.',
    insertText: `
      <rate-limit calls="number-of-calls" renewal-period="renewal-period">
        <api name="api-name" />
      </rate-limit>
    `.trim(),
    attributes: ['calls', 'renewal-period'],
  },
  {
    label: 'ip-filter',
    documentation: 'Filters (allows/denies) calls from specific IP addresses and/or address ranges.',
    insertText: `
      <ip-filter action="allow-or-deny">
        <address>ip-address-or-range</address>
      </ip-filter>
    `.trim(),
    attributes: ['action'],
    subElementAttributes: {
      address: []
    }
  },
  {
    label: 'quota',
    documentation: 'Allows you to enforce a renewable or lifetime call volume and/or bandwidth quota, on a per subscription basis.',
    insertText: `
      <quota calls="number-of-calls" bandwidth="bandwidth-in-kilobytes" renewal-period="renewal-period">
        <api name="api-name" />
      </quota>
    `.trim(),
    attributes: ['calls', 'bandwidth', 'renewal-period'],
    subElementAttributes: {
      api: ['name']
    }
  },
  {
    label: 'validate-jwt',
    documentation: 'Enforces existence and validity of a JWT extracted from either a specified HTTP Header, query parameter, or token value.',
    insertText: `
      <validate-jwt header-name="header-name" failed-validation-httpcode="http-status-code" failed-validation-error-message="error-message">
        <openid-config url="openid-config-url" />
        <required-claims>
          <claim name="claim-name" match="all-or-any">
            <value>claim-value</value>
          </claim>
        </required-claims>
      </validate-jwt>
    `.trim(),
    attributes: ['header-name', 'failed-validation-httpcode', 'failed-validation-error-message'],
    subElementAttributes: {
      'openid-config': ['url'],
      'required-claims': [],
      claim: ['name', 'match'],
      value: []
    }
  },
  // Advanced policies
  {
    label: 'choose',
    documentation: 'Conditionally applies policy statements based on the results of the evaluation of Boolean expressions.',
    insertText: `
      <choose>
        <when condition="boolean-expression">
          <!-- Policy statements to apply if the above condition is true. -->
        </when>
        <otherwise>
          <!-- Policy statements to apply if none of the above conditions are true. -->
        </otherwise>
      </choose>
    `.trim(),
    attributes: [],
    subElementAttributes: {
      when: ['condition'],
      otherwise: []
    }
  },
  {
    label: 'mock-response',
    documentation: 'Aborts pipeline execution and returns a mocked response directly to the caller.',
    insertText: `
      <mock-response status-code="http-status-code" content-type="media-type">
        <headers>
          <header name="header-name" exists-action="override">
            <value>value</value>
          </header>
        </headers>
        <body>response-body</body>
      </mock-response>
    `.trim(),
    attributes: ['status-code', 'content-type'],
    subElementAttributes: {
      headers: [],
      header: ['name', 'exists-action'],
      value: [],
      body: []
    }
  },
  {
    label: 'retry',
    documentation: 'Retries execution of the enclosed policy statements, if and until the condition is met.',
    insertText: `
      <retry condition="boolean-expression" count="retry-count" interval="retry-interval">
        <!-- Policy statements to retry. -->
      </retry>
    `.trim(),
    attributes: ['condition', 'count', 'interval', 'delta', 'max-interval', 'first-fast-retry'],
    subElementAttributes: {}
  },
  {
    label: 'return-response',
    documentation: 'Aborts pipeline execution and returns the specified response directly to the caller.',
    insertText: `
      <return-response>
        <status code="http-status-code" reason="reason-phrase" />
        <headers>
          <header name="header-name" exists-action="override">
            <value>value</value>
          </header>
        </headers>
        <body>response-body</body>
      </return-response>
    `.trim(),
    attributes: [],
    subElementAttributes: {
      status: ['code', 'reason'],
      headers: [],
      header: ['name', 'exists-action'],
      value: [],
      body: []
    }
  },
  {
    label: 'send-request',
    documentation: 'Sends a request to the specified URL.',
    insertText: `
      <send-request mode="new-or-copy" response-variable-name="response-variable">
        <url>absolute-url</url>
        <method>HTTP-verb</method>
        <headers>
          <header name="header-name" exists-action="override">
            <value>value</value>
          </header>
        </headers>
        <body>request-body</body>
      </send-request>
    `.trim(),
    attributes: ['mode', 'response-variable-name'],
    subElementAttributes: {
      url: [],
      method: [],
      headers: [],
      header: ['name', 'exists-action'],
      value: [],
      body: []
    }
  },
  {
    label: 'set-variable',
    documentation: 'Persists a value in a named context variable for later access.',
    insertText: `
      <set-variable name="variable-name" value="variable-value" />
    `.trim(),
    attributes: ['name', 'value'],
    subElementAttributes: {}
  },
  // Authentication policies
  {
    label: 'authentication-basic',
    documentation: 'Authenticate with a backend service using Basic authentication.',
    insertText: `
      <authentication-basic username="username" password="password" />
    `.trim(),
    attributes: ['username', 'password'],
    subElementAttributes: {}
  },
  {
    label: 'authentication-certificate',
    documentation: 'Authenticate with a backend service using client certificates.',
    insertText: `
      <authentication-certificate thumbprint="thumbprint" certificate-id="certificate-id" />
    `.trim(),
    attributes: ['thumbprint', 'certificate-id'],
    subElementAttributes: {}
  },
  // Caching policies
  {
    label: 'cache-store',
    documentation: 'Caches response according to the specified cache control configuration.',
    insertText: `
      <cache-store duration="seconds" />
    `.trim(),
    attributes: ['duration'],
    subElementAttributes: {}
  },
  {
    label: 'cache-lookup',
    documentation: 'Perform cache lookup and return a valid cached response when available.',
    insertText: `
      <cache-lookup vary-by-developer="true-or-false" vary-by-developer-groups="true-or-false" downstream-caching-type="none-private-or-public">
        <vary-by-header>header-name</vary-by-header>
        <vary-by-query-parameter>parameter-name</vary-by-query-parameter>
      </cache-lookup>
    `.trim(),
    attributes: ['vary-by-developer', 'vary-by-developer-groups', 'downstream-caching-type'],
    subElementAttributes: {
      'vary-by-header': [],
      'vary-by-query-parameter': []
    }
  },
  // Cross-domain policies
  {
    label: 'allow-cross-domain-calls',
    documentation: 'Makes the API accessible from Adobe Flash and Microsoft Silverlight browser-based clients.',
    insertText: `
      <cross-domain />
    `.trim(),
    attributes: [],
    subElementAttributes: {}
  },
  {
    label: 'cors',
    documentation: 'Adds cross-origin resource sharing (CORS) support to an operation or an API to allow cross-domain calls from browser-based clients.',
    insertText: `
      <cors allow-credentials="true-or-false">
        <allowed-origins>
          <origin>origin-url</origin>
        </allowed-origins>
        <allowed-methods>
          <method>HTTP-verb</method>
        </allowed-methods>
        <allowed-headers>
          <header>header-name</header>
        </allowed-headers>
        <expose-headers>
          <header>header-name</header>
        </expose-headers>
      </cors>
    `.trim(),
    attributes: ['allow-credentials'],
    subElementAttributes: {
      'allowed-origins': [],
      origin: [],
      'allowed-methods': [],
      method: [],
      'allowed-headers': [],
      header: [],
      'expose-headers': []
    }
  },
  // Transformation policies
  {
    label: 'json-to-xml',
    documentation: 'Converts request or response body from JSON to XML.',
    insertText: `
      <json-to-xml apply="always-or-content-type-json" consider-accept-header="true-or-false">
        <output-xml-encoding>encoding</output-xml-encoding>
      </json-to-xml>
    `.trim(),
    attributes: ['apply', 'consider-accept-header'],
    subElementAttributes: {
      'output-xml-encoding': []
    }
  },
  {
    label: 'xml-to-json',
    documentation: 'Converts request or response body from XML to JSON.',
    insertText: `
      <xml-to-json kind="javascript-object-or-array" />
    `.trim(),
    attributes: ['kind'],
    subElementAttributes: {}
  },
  {
    label: 'find-and-replace',
    documentation: 'Finds a request or response substring and replaces it with a different substring.',
    insertText: `
      <find-and-replace from="original-string" to="replacement-string" />
    `.trim(),
    attributes: ['from', 'to'],
    subElementAttributes: {}
  },
  {
    label: 'set-body',
    documentation: 'Sets the message body for incoming and outgoing requests.',
    insertText: `
      <set-body>new-body-value</set-body>
    `.trim(),
    attributes: [],
    subElementAttributes: {}
  },
  {
    label: 'set-header',
    documentation: 'Assigns a value to an existing response and/or request header or adds a new response and/or request header.',
    insertText: `
      <set-header name="header-name" exists-action="override">
        <value>header-value</value>
      </set-header>
    `.trim(),
    attributes: ['name', 'exists-action'],
    subElementAttributes: {
      value: []
    }
  },
  {
    label: 'set-query-parameter',
    documentation: 'Adds, replaces value of, or deletes request query string parameter.',
    insertText: `
      <set-query-parameter name="param-name" exists-action="override">
        <value>parameter-value</value>
      </set-query-parameter>
    `.trim(),
    attributes: ['name', 'exists-action'],
    subElementAttributes: {
      value: []
    }
  },
  {
    label: 'rewrite-uri',
    documentation: 'Converts a request URL from its public form to the form expected by the web service, as shown in the example below.',
    insertText: `
      <rewrite-uri template="uri-template" />
    `.trim(),
    attributes: ['template'],
    subElementAttributes: {}
  },
  // Validation policies
  {
    label: 'validate-content',
    documentation: 'Validates the size or JSON schema of a request or response body against the API schema.',
    insertText: `
      <validate-content unspecified-content-type-action="ignore-or-prevent">
        <content type="media-type" validate-as="json-or-xml" schema-id="schema-id" />
      </validate-content>
    `.trim(),
    attributes: ['unspecified-content-type-action'],
    subElementAttributes: {
      content: ['type', 'validate-as', 'schema-id']
    }
  },
  {
    label: 'validate-parameters',
    documentation: 'Validates the request header, query, or path parameters against the API schema.',
    insertText: `
      <validate-parameters specified-parameter-action="ignore-or-prevent" unspecified-parameter-action="ignore-or-prevent">
        <headers specified-parameter-action="ignore-or-prevent" unspecified-parameter-action="ignore-or-prevent" />
        <query specified-parameter-action="ignore-or-prevent" unspecified-parameter-action="ignore-or-prevent" />
      </validate-parameters>
    `.trim(),
    attributes: ['specified-parameter-action', 'unspecified-parameter-action'],
    subElementAttributes: {
      headers: ['specified-parameter-action', 'unspecified-parameter-action'],
      query: ['specified-parameter-action', 'unspecified-parameter-action']
    }
  }
];

export default policySnippets;