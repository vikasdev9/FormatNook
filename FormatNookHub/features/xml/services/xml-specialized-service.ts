import { SoapInfo, WsdlInfo, XsdInfo } from '../types/xml.types';

/**
 * Analyzes an XML document to determine if it is a SOAP envelope, WSDL document, or XSD schema.
 */
export function analyzeSpecializedXml(xml: string): {
  soap?: SoapInfo;
  wsdl?: WsdlInfo;
  xsd?: XsdInfo;
  detectedType: 'soap' | 'wsdl' | 'xsd' | 'standard';
} {
  if (!xml || !xml.trim()) {
    return { detectedType: 'standard' };
  }

  // 1. SOAP Detection
  const isSoap11 = xml.includes('schemas.xmlsoap.org/soap/envelope/') || /<[a-zA-Z0-9_:-]*Envelope\b[^>]*soap\/envelope/i.test(xml);
  const isSoap12 = xml.includes('www.w3.org/2003/05/soap-envelope') || /<[a-zA-Z0-9_:-]*Envelope\b[^>]*2003\/05\/soap-envelope/i.test(xml);

  if (isSoap11 || isSoap12) {
    const hasHeader = /<[a-zA-Z0-9_:-]*Header\b/i.test(xml);
    const hasBody = /<[a-zA-Z0-9_:-]*Body\b/i.test(xml);
    const hasFault = /<[a-zA-Z0-9_:-]*Fault\b/i.test(xml);

    let faultDetails: SoapInfo['faultDetails'] = undefined;
    if (hasFault) {
      const codeMatch = xml.match(/<[a-zA-Z0-9_:-]*(?:faultcode|Code)[^>]*>([\s\S]*?)<\/[a-zA-Z0-9_:-]*(?:faultcode|Code)>/i);
      const stringMatch = xml.match(/<[a-zA-Z0-9_:-]*(?:faultstring|Reason)[^>]*>([\s\S]*?)<\/[a-zA-Z0-9_:-]*(?:faultstring|Reason)>/i);
      const detailMatch = xml.match(/<[a-zA-Z0-9_:-]*detail[^>]*>([\s\S]*?)<\/[a-zA-Z0-9_:-]*detail>/i);

      faultDetails = {
        faultCode: codeMatch ? codeMatch[1].trim().replace(/<[^>]+>/g, '') : undefined,
        faultString: stringMatch ? stringMatch[1].trim().replace(/<[^>]+>/g, '') : undefined,
        detail: detailMatch ? detailMatch[1].trim() : undefined,
      };
    }

    return {
      detectedType: 'soap',
      soap: {
        isSoap: true,
        version: isSoap12 ? '1.2' : '1.1',
        hasHeader,
        hasBody,
        hasFault,
        faultDetails,
      },
    };
  }

  // 2. WSDL Detection
  const isWsdl = xml.includes('schemas.xmlsoap.org/wsdl/') || /<[a-zA-Z0-9_:-]*definitions\b/i.test(xml);
  if (isWsdl) {
    const nsMatch = xml.match(/targetNamespace=["']([^"']+)["']/i);
    const services = Array.from(xml.matchAll(/<[a-zA-Z0-9_:-]*service\b[^>]*name=["']([^"']+)["']/gi)).map((m) => m[1]);
    const bindings = Array.from(xml.matchAll(/<[a-zA-Z0-9_:-]*binding\b[^>]*name=["']([^"']+)["']/gi)).map((m) => m[1]);
    const portTypes = Array.from(xml.matchAll(/<[a-zA-Z0-9_:-]*portType\b[^>]*name=["']([^"']+)["']/gi)).map((m) => m[1]);
    const operations = Array.from(xml.matchAll(/<[a-zA-Z0-9_:-]*operation\b[^>]*name=["']([^"']+)["']/gi)).map((m) => m[1]);
    const messages = Array.from(xml.matchAll(/<[a-zA-Z0-9_:-]*message\b[^>]*name=["']([^"']+)["']/gi)).map((m) => m[1]);

    return {
      detectedType: 'wsdl',
      wsdl: {
        isWsdl: true,
        targetNamespace: nsMatch ? nsMatch[1] : undefined,
        services,
        bindings,
        portTypes,
        operations: Array.from(new Set(operations)),
        messages,
      },
    };
  }

  // 3. XSD Schema Detection
  const isXsd = xml.includes('www.w3.org/2001/XMLSchema') || /<[a-zA-Z0-9_:-]*schema\b/i.test(xml);
  if (isXsd) {
    const nsMatch = xml.match(/targetNamespace=["']([^"']+)["']/i);
    const elements: { name: string; type?: string }[] = [];
    const elementMatches = xml.matchAll(/<[a-zA-Z0-9_:-]*element\b[^>]*name=["']([^"']+)["'](?:[^>]*type=["']([^"']+)["'])?/gi);
    for (const m of elementMatches) {
      elements.push({ name: m[1], type: m[2] });
    }

    const complexTypes = Array.from(xml.matchAll(/<[a-zA-Z0-9_:-]*complexType\b[^>]*name=["']([^"']+)["']/gi)).map((m) => m[1]);
    const simpleTypes = Array.from(xml.matchAll(/<[a-zA-Z0-9_:-]*simpleType\b[^>]*name=["']([^"']+)["']/gi)).map((m) => m[1]);

    return {
      detectedType: 'xsd',
      xsd: {
        isXsd: true,
        targetNamespace: nsMatch ? nsMatch[1] : undefined,
        elements,
        complexTypes,
        simpleTypes,
      },
    };
  }

  return { detectedType: 'standard' };
}

