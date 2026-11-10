import { DetailedFileMetadata, MetadataItem } from '../types/file-metadata.types';
import { formatFileSize } from '../utils/byte-conversion.utils';

export interface TextAdapterParams {
  toolId: 'base64-to-text' | 'text-to-base64' | 'hex-to-base64' | 'base64-to-hex' | 'url-to-base64' | 'html-to-base64' | 'css-to-base64';
  inputString: string;
  outputString: string;
  urlSafe?: boolean;
  isUtf8Valid?: boolean;
  inputSizeBytes?: number;
  outputSizeBytes?: number;
}

export function buildTextDetails(params: TextAdapterParams): DetailedFileMetadata {
  const { toolId, inputString, outputString, urlSafe, isUtf8Valid, inputSizeBytes, outputSizeBytes } = params;

  const isEncoder = toolId.endsWith('-to-base64');
  const inputCharCount = inputString.length;
  const outputCharCount = outputString.length;
  const inBytes = inputSizeBytes ?? new TextEncoder().encode(inputString).length;
  const outBytes = outputSizeBytes ?? new TextEncoder().encode(outputString).length;

  const sourceItems: MetadataItem[] = [
    { label: 'Character Count', value: `${inputCharCount.toLocaleString()} chars` },
    { label: 'Input Byte Size', value: `${formatFileSize(inBytes)} (${inBytes.toLocaleString()} bytes)` },
  ];

  if (toolId === 'text-to-base64' || toolId === 'base64-to-text') {
    sourceItems.push({
      label: 'Character Encoding',
      value: 'UTF-8 (Unicode & Emojis supported)',
    });
  }

  const outputItems: MetadataItem[] = [
    { label: 'Output Characters', value: `${outputCharCount.toLocaleString()} chars` },
    { label: 'Output Byte Size', value: `${formatFileSize(outBytes)} (${outBytes.toLocaleString()} bytes)` },
  ];

  if (isEncoder && urlSafe !== undefined) {
    outputItems.push({
      label: 'Base64 Alphabet',
      value: urlSafe ? 'URL-Safe (- and _)' : 'Standard (RFC 4648 + and /)',
      badge: urlSafe ? 'accent' : 'neutral',
    });
  }

  if (isUtf8Valid !== undefined) {
    outputItems.push({
      label: 'UTF-8 Validation',
      value: isUtf8Valid ? '100% Valid UTF-8' : 'Contains Non-UTF-8 Binary Bytes',
      badge: isUtf8Valid ? 'success' : 'warning',
    });
  }

  return {
    toolId,
    summary: {
      formatBadge: isEncoder ? 'BASE64' : 'TEXT',
      primaryMetric: `${outputCharCount.toLocaleString()} chars`,
      sizeString: formatFileSize(outBytes),
      statusBadge: {
        label: isEncoder ? 'Encoded' : 'Decoded',
        variant: 'success',
      },
    },
    sourceGroups: [{ title: 'Input Text Details', items: sourceItems }],
    outputGroups: [{ title: 'Processed Output Details', items: outputItems }],
    notes: !isUtf8Valid && !isEncoder
      ? ['Notice: Some decoded bytes did not form valid UTF-8 sequences. Unicode replacement characters (U+FFFD) were placed where necessary.']
      : undefined,
  };
}
