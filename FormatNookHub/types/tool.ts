export type ToolCategory =
  | 'json'
  | 'xml'
  | 'yaml'
  | 'base64'
  | 'beautifiers'
  | 'image'
  | 'text'
  | 'developer'
  | 'css-design'
  | 'converters'
  | 'encoders-decoders';

export type ToolStatus = 'implemented' | 'beta' | 'planned';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  step: number;
  title: string;
  description: string;
}

export interface ToolExample {
  title: string;
  input: string;
  output: string;
  description?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ToolCategory;
  icon: string; // Lucide icon name
  keywords: string[];
  searchAliases: string[];
  route: string;
  relatedToolIds: string[];
  status: ToolStatus;
  seoTitle: string;
  seoDescription: string;
  supportsFileUpload: boolean;
  supportsDownload: boolean;
  processesLocally: boolean;
  fileExtensions?: string[];
  mimeType?: string;
  outputFileName?: string;
  educationalContent?: {
    overview: string;
    howTo: HowToStep[];
    examples: ToolExample[];
    faqs: FAQItem[];
  };
}

export interface CategoryDefinition {
  id: ToolCategory;
  name: string;
  slug: string;
  description: string;
  icon: string;
  shortDescription: string;
}

export type IndentOption = '2' | '3' | '4' | '6' | '8' | 'tab';

export interface ValidationIssue {
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ToolExecutionResult {
  output: string;
  isValid: boolean;
  issues: ValidationIssue[];
  executionTimeMs?: number;
  inputSize?: number;
  outputSize?: number;
}
