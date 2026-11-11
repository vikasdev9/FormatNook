export interface XmlSampleItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  data: string;
}

export const XML_SAMPLES: XmlSampleItem[] = [
  {
    id: 'catalog',
    name: 'Book Catalog (Standard)',
    category: 'standard',
    description: 'Bookstore catalog with nested elements and attributes',
    data: `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <genre>Computer</genre>
    <price>44.95</price>
    <publish_date>2024-10-01</publish_date>
    <description>An in-depth guide to developing applications with XML.</description>
  </book>
  <book id="bk102">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <genre>Fantasy</genre>
    <price>5.95</price>
    <publish_date>2024-12-16</publish_date>
    <description>A former architect battles corporate intrigue.</description>
  </book>
</catalog>`,
  },
  {
    id: 'soap-request',
    name: 'SOAP 1.1 Request Envelope',
    category: 'soap',
    data: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthHeader xmlns="http://tempuri.org/">
      <Token>Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9</Token>
    </AuthHeader>
  </soap:Header>
  <soap:Body>
    <GetStockPrice xmlns="http://tempuri.org/">
      <StockTicker>GOOGL</StockTicker>
      <Currency>USD</Currency>
    </GetStockPrice>
  </soap:Body>
</soap:Envelope>`,
  },
  {
    id: 'soap-fault',
    name: 'SOAP 1.2 Fault Response',
    category: 'soap',
    data: `<?xml version="1.0" encoding="utf-8"?>
<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">
  <env:Body>
    <env:Fault>
      <env:Code>
        <env:Value>env:Sender</env:Value>
        <env:Subcode>
          <env:Value xmlns:m="http://example.org/errors">m:InvalidTickerSymbol</env:Value>
        </env:Subcode>
      </env:Code>
      <env:Reason>
        <env:Text xml:lang="en-US">The specified ticker symbol does not exist in registry.</env:Text>
      </env:Reason>
      <env:Detail>
        <errorDetails xmlns="http://example.org/errors">
          <errorCode>404</errorCode>
          <message>Ticker symbol 'UNKNOWN' could not be resolved.</message>
        </errorDetails>
      </env:Detail>
    </env:Fault>
  </env:Body>
</env:Envelope>`,
  },
  {
    id: 'wsdl',
    name: 'WSDL Service Definition',
    category: 'wsdl',
    data: `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="WeatherService"
             targetNamespace="http://example.com/weather.wsdl"
             xmlns="http://schemas.xmlsoap.org/wsdl/"
             xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
             xmlns:tns="http://example.com/weather.wsdl"
             xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <message name="GetForecastRequest">
    <part name="zipCode" type="xsd:string"/>
  </message>
  <message name="GetForecastResponse">
    <part name="temperature" type="xsd:float"/>
  </message>
  <portType name="WeatherPortType">
    <operation name="GetForecast">
      <input message="tns:GetForecastRequest"/>
      <output message="tns:GetForecastResponse"/>
    </operation>
  </portType>
  <binding name="WeatherBinding" type="tns:WeatherPortType">
    <soap:binding style="rpc" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="GetForecast">
      <soap:operation soapAction="http://example.com/GetForecast"/>
    </operation>
  </binding>
  <service name="WeatherService">
    <port name="WeatherPort" binding="tns:WeatherBinding">
      <soap:address location="http://example.com/weather/api"/>
    </port>
  </service>
</definitions>`,
  },
  {
    id: 'xsd',
    name: 'XML Schema (XSD)',
    category: 'xsd',
    data: `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="https://formatnook.com/schema"
           xmlns="https://formatnook.com/schema"
           elementFormDefault="qualified">
  <xs:element name="user" type="UserType"/>
  <xs:complexType name="UserType">
    <xs:sequence>
      <xs:element name="id" type="xs:integer"/>
      <xs:element name="username" type="xs:string"/>
      <xs:element name="email" type="xs:string"/>
      <xs:element name="created_at" type="xs:dateTime"/>
    </xs:sequence>
    <xs:attribute name="status" type="xs:string" use="required"/>
  </xs:complexType>
</xs:schema>`,
  },
  {
    id: 'rss',
    name: 'RSS 2.0 Feed',
    category: 'standard',
    data: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>FormatNook Developer Updates</title>
    <link>https://formatnook.com</link>
    <description>Latest client-side utilities and browser developer tools.</description>
    <language>en-us</language>
    <item>
      <title>Advanced XML Workspace Launch</title>
      <link>https://formatnook.com/tools/xml-formatter</link>
      <description><![CDATA[FormatNook released an upgraded XML workspace with XPath querying and SOAP inspection.]]></description>
      <pubDate>Wed, 11 Nov 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`,
  },
  {
    id: 'svg',
    name: 'SVG Vector Graphic',
    category: 'standard',
    data: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Brand Hexagon Icon -->
  <polygon points="50 3, 90 25, 90 75, 50 97, 10 75, 10 25" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
  <text x="50" y="58" font-size="24" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold">FN</text>
</svg>`,
  },
];

