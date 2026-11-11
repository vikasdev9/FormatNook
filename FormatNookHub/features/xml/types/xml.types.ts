import { IndentOption, ValidationIssue } from '@/types/tool';

export type XmlViewMode = 'code' | 'tree' | 'structured';

export type XmlNodeType =
  | 'element'
  | 'text'
  | 'cdata'
  | 'comment'
  | 'declaration'
  | 'pi';

export interface XmlTreeNode {
  id: string;
  name: string;
  type: XmlNodeType;
  value?: string;
  attributes?: Record<string, string>;
  children?: XmlTreeNode[];
  xpath: string;
  depth: number;
}

export interface XPathMatch {
  xpath: string;
  nodeName: string;
  value: string;
  xml: string;
}

export interface XPathQueryResult {
  query: string;
  isValid: boolean;
  error?: string;
  matchCount: number;
  matches: XPathMatch[];
}

export type XmlConversionFormat =
  | 'json'
  | 'yaml'
  | 'csv'
  | 'tsv'
  | 'string'
  | 'html';

export interface XmlConversionResult {
  output: string;
  format: XmlConversionFormat;
  error?: string;
  notes?: string;
}

export interface SoapInfo {
  isSoap: boolean;
  version?: '1.1' | '1.2';
  hasHeader: boolean;
  hasBody: boolean;
  hasFault: boolean;
  faultDetails?: {
    faultCode?: string;
    faultString?: string;
    detail?: string;
  };
}

export interface WsdlInfo {
  isWsdl: boolean;
  targetNamespace?: string;
  services: string[];
  bindings: string[];
  portTypes: string[];
  operations: string[];
  messages: string[];
}

export interface XsdInfo {
  isXsd: boolean;
  targetNamespace?: string;
  elements: { name: string; type?: string }[];
  complexTypes: string[];
  simpleTypes: string[];
}

