import { base64ToBytes, isLikelyUtf8Text } from './base64.service';
import { detectMimeFromBytes } from './mime-detection.service';

export interface ExtractedBase64Candidate {
  id: string;
  value: string;
  startIndex: number;
  endIndex: number;
  length: number;
  isValid: boolean;
  detectedMime: string;
  category: 'image' | 'audio' | 'video' | 'pdf' | 'text' | 'binary';
  estimatedBytes: number;
  confidence: 'high' | 'medium' | 'low';
  contextSnippet: string;
  previewText?: string;
}

/**
 * Extracts candidate Base64 strings embedded inside logs, JSON, curl requests, or mixed documents
 */
export function extractBase64Payloads(rawText: string): ExtractedBase64Candidate[] {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const candidates: ExtractedBase64Candidate[] = [];
  const seenValues = new Set<string>();

  // Regular expression to match candidate base64 sequences of at least 16 chars:
  // Can match Data URIs or standalone Base64 blocks
  const tokenRegex = /(?:data:[^;,]+(?:;charset=[^;,]+)?(?:;base64)?,)?(?:[A-Za-z0-9+/]{4}){3,}(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?|(?:[A-Za-z0-9\-_]{4}){3,}/g;

  let match: RegExpExecArray | null;
  let counter = 0;

  while ((match = tokenRegex.exec(rawText)) !== null) {
    const matchedStr = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + matchedStr.length;

    // Filter out obvious natural language words or numeric IDs
    if (matchedStr.length < 16) continue;
    if (/^[A-Za-z]+$/.test(matchedStr) && matchedStr.length < 24) continue; // single English word
    if (/^[0-9]+$/.test(matchedStr)) continue; // purely numeric sequence
    if (seenValues.has(matchedStr)) continue;
    seenValues.add(matchedStr);

    // Strip Data URI prefix for byte inspection
    let base64Only = matchedStr;
    const dataUriPrefixMatch = matchedStr.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(?:;base64)?,/i);
    let explicitMime: string | undefined;
    if (dataUriPrefixMatch) {
      explicitMime = dataUriPrefixMatch[1];
      base64Only = matchedStr.slice(dataUriPrefixMatch[0].length);
    }

    const { bytes, isValid } = base64ToBytes(base64Only);
    if (!isValid || bytes.length === 0) continue;

    const detectedMimeResult = detectMimeFromBytes(bytes);
    const mime = explicitMime || detectedMimeResult.mimeType;

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (dataUriPrefixMatch || detectedMimeResult.confidence === 'high') {
      confidence = 'high';
    } else if (isLikelyUtf8Text(bytes) || bytes.length > 32) {
      confidence = 'medium';
    }

    // Extract surrounding snippet
    const snippetStart = Math.max(0, startIndex - 20);
    const snippetEnd = Math.min(rawText.length, endIndex + 20);
    const contextSnippet = (snippetStart > 0 ? '...' : '') +
      rawText.slice(snippetStart, snippetEnd).replace(/\s+/g, ' ') +
      (snippetEnd < rawText.length ? '...' : '');

    let previewText: string | undefined;
    if (isLikelyUtf8Text(bytes)) {
      previewText = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 100));
    }

    counter++;
    candidates.push({
      id: `candidate-${counter}`,
      value: matchedStr,
      startIndex,
      endIndex,
      length: matchedStr.length,
      isValid: true,
      detectedMime: mime,
      category: detectedMimeResult.category,
      estimatedBytes: bytes.length,
      confidence,
      contextSnippet,
      previewText,
    });

    if (candidates.length >= 50) {
      // Limit to 50 candidates to preserve browser performance
      break;
    }
  }

  return candidates;
}

