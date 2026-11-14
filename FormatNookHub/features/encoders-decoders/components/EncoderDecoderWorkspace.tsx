'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  encodeText,
  decodeToText,
  encodeHexToBase64,
  decodeBase64ToHex,
  encodeUrlToBase64,
  encodeHtmlToBase64,
  encodeCssToBase64,
} from '../services/text-encoding.service';
import {
  encodeFileToBase64,
  decodeBase64ToFile,
  validatePdfBytes,
} from '../services/file-encoding.service';
import { convertImageBlob } from '../services/image-conversion.service';
import { parseImageBytes } from '../services/image-detection.service';
import { extractAudioDuration, extractVideoMetadata } from '../services/file-metadata.service';
import { buildImageDetails } from '../adapters/image-details.adapter';
import { buildTextDetails } from '../adapters/text-details.adapter';
import { buildFileDetails } from '../adapters/file-details.adapter';
import { buildPdfDetails } from '../adapters/pdf-details.adapter';
import { buildAudioDetails } from '../adapters/audio-details.adapter';
import { buildVideoDetails } from '../adapters/video-details.adapter';
import { downloadFile } from '@/lib/download';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import { FileUploadZone } from './FileUploadZone';
import { FileMetadata } from './FileMetadata';
import { FilePreview } from './FilePreview';
import { ValidationMessage } from './ValidationMessage';
import { LargeOutputNotice } from './LargeOutputNotice';
import { ToolModeTabs } from './ToolModeTabs';
import { FormatSelector } from './FormatSelector';
import { FileDetailsPanel } from './FileDetailsPanel';
import {
  EncoderDecoderToolId,
  HexFormatOptions,
  FileMetadataInfo,
} from '../types/encoder-decoder.types';
import {
  ImageConversionOptions,
  ConversionResult,
  ParsedImageInfo,
  DetailedFileMetadata,
} from '../types/file-metadata.types';
import { base64ToBytes } from '../services/base64.service';
import { Base64InspectorView } from './Base64InspectorView';
import { Base64ValidatorView } from './Base64ValidatorView';
import { Base64RepairView } from './Base64RepairView';
import { DataUriWorkbenchView } from './DataUriWorkbenchView';
import { PayloadExtractorView } from './PayloadExtractorView';
import { HexViewer } from './HexViewer';
import { GzipBase64View } from './GzipBase64View';
import { BasicAuthWorkspace } from './BasicAuthWorkspace';
import {
  Binary,
  Search,
  ShieldCheck,
  Wrench,
  Link2,
  ScanSearch,
  FileCode,
  Archive,
  Lock,
  ArrowRightLeft,
  WrapText,
} from 'lucide-react';

export type WorkbenchViewTab =
  | 'editor'
  | 'inspect'
  | 'validate'
  | 'repair'
  | 'data-uri'
  | 'extractor'
  | 'hex-viewer'
  | 'gzip'
  | 'basic-auth';

interface EncoderDecoderWorkspaceProps {
  toolId: EncoderDecoderToolId;
  direction: 'encode' | 'decode';
  initialWorkbenchTab?: WorkbenchViewTab;
  pairedSlug?: string;
  pairedName?: string;
  acceptedExtensions?: string[];
  fileCategory?: 'image' | 'audio' | 'video' | 'pdf' | 'any';
  defaultSample?: string;
  outputFileName?: string;
  mimeType?: string;
}

export function EncoderDecoderWorkspace({
  toolId,
  direction,
  pairedSlug,
  pairedName,
  acceptedExtensions,
  fileCategory = 'any',
  defaultSample = '',
  outputFileName = 'output.txt',
  mimeType = 'text/plain',
  initialWorkbenchTab = 'editor',
}: EncoderDecoderWorkspaceProps) {
  // Navigation tab state
  const [workbenchTab, setWorkbenchTab] = useState<WorkbenchViewTab>(initialWorkbenchTab);
  const [hexBytes, setHexBytes] = useState<Uint8Array | null>(null);

  // Input states
  const [textInput, setTextInput] = useState<string>(defaultSample);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<FileMetadataInfo | null>(null);

  // General options
  const [urlSafe, setUrlSafe] = useState(false);
  const [dataUriMode, setDataUriMode] = useState<'raw' | 'data-uri'>('data-uri');
  const [hexOptions, setHexOptions] = useState<HexFormatOptions>({ uppercase: true, grouping: 'space' });
  const [customFilename, setCustomFilename] = useState(outputFileName);
  const [wrapText, setWrapText] = useState(true);
  const [mobileTab, setMobileTab] = useState<'both' | 'input' | 'output'>('both');

  // Dynamic Image Output Format Switcher states (for Base64 to Image)
  const [imageFormatOptions, setImageFormatOptions] = useState<ImageConversionOptions>({
    format: 'auto',
    quality: 0.92,
    backgroundColor: '#FFFFFF',
  });
  const [convertedImage, setConvertedImage] = useState<ConversionResult | null>(null);
  const [isConvertingImage, setIsConvertingImage] = useState<boolean>(false);
  const [parsedSourceImage, setParsedSourceImage] = useState<ParsedImageInfo | null>(null);

  // Extracted media metadata states
  const [audioDuration, setAudioDuration] = useState<number | undefined>(undefined);
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | undefined>(undefined);
  const [hasPdfSignature, setHasPdfSignature] = useState<boolean>(false);

  // Output states
  const [outputString, setOutputString] = useState<string>('');
  const [dataUriString, setDataUriString] = useState<string>('');
  const [decodedBlob, setDecodedBlob] = useState<Blob | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [detectedMime, setDetectedMime] = useState<string>(mimeType);
  const [isLargeOutput, setIsLargeOutput] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean | null; issues: any[] }>({
    isValid: null,
    issues: [],
  });

  // Keep hex dump bytes synced with current content
  useEffect(() => {
    if (decodedBlob) {
      decodedBlob.arrayBuffer().then((buf) => setHexBytes(new Uint8Array(buf)));
    } else if (outputString.trim()) {
      const res = base64ToBytes(outputString);
      if (res.isValid && res.bytes.length > 0) {
        setHexBytes(res.bytes);
      } else if (textInput.trim()) {
        const textRes = base64ToBytes(textInput);
        setHexBytes(textRes.isValid ? textRes.bytes : new TextEncoder().encode(textInput));
      } else {
        setHexBytes(null);
      }
    } else if (textInput.trim()) {
      const res = base64ToBytes(textInput);
      setHexBytes(res.isValid ? res.bytes : new TextEncoder().encode(textInput));
    } else {
      setHexBytes(null);
    }
  }, [decodedBlob, textInput, outputString]);

  // Track active Object URLs for revocation
  const activeObjectUrls = useRef<string[]>([]);
  const registerObjectUrl = (url?: string | null) => {
    if (url) {
      activeObjectUrls.current.push(url);
    }
  };
  const revokeAllObjectUrls = () => {
    activeObjectUrls.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    });
    activeObjectUrls.current = [];
  };

  useEffect(() => {
    return () => {
      revokeAllObjectUrls();
    };
  }, []);

  // Re-synchronize workspace state when toolId, direction, or defaultSample changes
  useEffect(() => {
    setTextInput(defaultSample || '');
    setSelectedFile(null);
    setFileMetadata(null);
    setOutputString('');
    setDataUriString('');
    setDecodedBlob(null);
    setMediaPreviewUrl(null);
    setConvertedImage(null);
    setParsedSourceImage(null);
    setCustomFilename(outputFileName);
    setDetectedMime(mimeType);
    setValidation({ isValid: null, issues: [] });
    setWorkbenchTab(initialWorkbenchTab);
  }, [toolId, direction, defaultSample, outputFileName, mimeType, initialWorkbenchTab]);

  // Execute conversion whenever input, settings, or active tool change
  useEffect(() => {
    executeJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolId, direction, textInput, selectedFile, urlSafe, hexOptions, dataUriMode, imageFormatOptions]);

  const executeJob = async () => {
    // 1. Text to Base64
    if (toolId === 'text-to-base64') {
      const res = encodeText(textInput, urlSafe);
      setOutputString(res.output);
      setIsLargeOutput(Boolean(res.isTruncatedForDisplay));
      setValidation({ isValid: res.isValid, issues: res.issues });
      return;
    }

    // 2. Base64 to Text
    if (toolId === 'base64-to-text') {
      if (!textInput.trim()) {
        setOutputString('');
        setValidation({ isValid: null, issues: [] });
        return;
      }
      const res = decodeToText(textInput);
      setOutputString(res.output);
      setIsLargeOutput(Boolean(res.isTruncatedForDisplay));
      setValidation({ isValid: res.isValid, issues: res.issues });
      return;
    }

    // 3. Hex to Base64
    if (toolId === 'hex-to-base64') {
      if (!textInput.trim()) {
        setOutputString('');
        setValidation({ isValid: null, issues: [] });
        return;
      }
      const res = encodeHexToBase64(textInput, urlSafe);
      setOutputString(res.output);
      setValidation({ isValid: res.isValid, issues: res.issues });
      return;
    }

    // 4. Base64 to Hex
    if (toolId === 'base64-to-hex') {
      if (!textInput.trim()) {
        setOutputString('');
        setValidation({ isValid: null, issues: [] });
        return;
      }
      const res = decodeBase64ToHex(textInput, hexOptions);
      setOutputString(res.output);
      setIsLargeOutput(Boolean(res.isTruncatedForDisplay));
      setValidation({ isValid: res.isValid, issues: res.issues });
      return;
    }

    // 5. URL to Base64
    if (toolId === 'url-to-base64') {
      const res = encodeUrlToBase64(textInput, urlSafe);
      setOutputString(res.output);
      setValidation({ isValid: res.isValid, issues: res.issues });
      return;
    }

    // 6. HTML to Base64
    if (toolId === 'html-to-base64') {
      const res = encodeHtmlToBase64(textInput);
      setOutputString(dataUriMode === 'data-uri' ? res.dataUri : res.output);
      setDataUriString(res.dataUri);
      setIsLargeOutput(Boolean(res.isTruncatedForDisplay));
      setValidation({ isValid: res.isValid, issues: res.issues });
      return;
    }

    // 7. CSS to Base64
    if (toolId === 'css-to-base64') {
      const res = encodeCssToBase64(textInput);
      setOutputString(dataUriMode === 'data-uri' ? res.dataUri : res.output);
      setDataUriString(res.dataUri);
      setIsLargeOutput(Boolean(res.isTruncatedForDisplay));
      setValidation({ isValid: res.isValid, issues: res.issues });
      return;
    }

    // 8. File-based Encoders (File / Image / Audio / Video / PDF to Base64)
    if (
      toolId === 'file-to-base64' ||
      toolId === 'image-to-base64' ||
      toolId === 'audio-to-base64' ||
      toolId === 'video-to-base64' ||
      toolId === 'pdf-to-base64'
    ) {
      if (!selectedFile) {
        setOutputString('');
        setDataUriString('');
        return;
      }

      try {
        const res = await encodeFileToBase64(selectedFile);
        setDataUriString(res.dataUri);
        setOutputString(dataUriMode === 'data-uri' ? res.dataUri : res.output);
        setIsLargeOutput(Boolean(res.isTruncatedForDisplay));
        setValidation({ isValid: true, issues: [] });
      } catch (err: any) {
        setValidation({
          isValid: false,
          issues: [{ message: err?.message || 'Failed to encode file.', severity: 'error' }],
        });
      }
      return;
    }

    // 9. Base64 to Media/File Decoders
    if (
      toolId === 'base64-to-file' ||
      toolId === 'base64-to-image' ||
      toolId === 'base64-to-audio' ||
      toolId === 'base64-to-video' ||
      toolId === 'base64-to-pdf'
    ) {
      if (!textInput.trim()) {
        setDecodedBlob(null);
        setMediaPreviewUrl(null);
        setConvertedImage(null);
        setParsedSourceImage(null);
        setValidation({ isValid: null, issues: [] });
        return;
      }

      const decoded = decodeBase64ToFile(textInput, mimeType, customFilename);
      if (!decoded.isValid || !decoded.blob) {
        setDecodedBlob(null);
        setMediaPreviewUrl(null);
        setConvertedImage(null);
        setParsedSourceImage(null);
        setValidation({
          isValid: false,
          issues: [{ message: decoded.error || 'Invalid Base64 sequence.', severity: 'error' }],
        });
        return;
      }

      const rawBlob = decoded.blob;
      setDecodedBlob(rawBlob);
      setDetectedMime(decoded.detectedMime.mimeType);
      setCustomFilename(decoded.suggestedFilename);

      // Check PDF header
      if (toolId === 'base64-to-pdf') {
        const buf = await rawBlob.arrayBuffer();
        const pdfCheck = validatePdfBytes(new Uint8Array(buf));
        setHasPdfSignature(pdfCheck.isValid);
        if (!pdfCheck.isValid) {
          setValidation({
            isValid: false,
            issues: [{ message: pdfCheck.error!, severity: 'error' }],
          });
          return;
        }
      }

      // Check Base64 to Image format conversion
      if (toolId === 'base64-to-image') {
        const buf = await rawBlob.arrayBuffer();
        const parsed = parseImageBytes(new Uint8Array(buf));
        setParsedSourceImage(parsed);

        setIsConvertingImage(true);
        try {
          const conv = await convertImageBlob(rawBlob, imageFormatOptions, decoded.suggestedFilename);
          registerObjectUrl(conv.objectUrl);
          setConvertedImage(conv);
          setMediaPreviewUrl(conv.objectUrl);
          setDetectedMime(conv.mimeType);
          setCustomFilename(conv.suggestedFilename);
          setValidation({ isValid: true, issues: [] });
        } catch (err: any) {
          setValidation({
            isValid: false,
            issues: [{ message: err?.message || 'Failed to convert image format.', severity: 'error' }],
          });
        } finally {
          setIsConvertingImage(false);
        }
        return;
      }

      // Other media (Audio, Video, File, PDF)
      registerObjectUrl(decoded.objectUrl);
      setMediaPreviewUrl(decoded.objectUrl);

      // Extract async audio/video metadata
      if (toolId === 'base64-to-audio' && decoded.objectUrl) {
        extractAudioDuration(decoded.objectUrl).then((dur) => setAudioDuration(dur));
      }
      if (toolId === 'base64-to-video' && decoded.objectUrl) {
        extractVideoMetadata(decoded.objectUrl).then((meta) => {
          if (meta) {
            setVideoDuration(meta.duration);
            if (meta.width && meta.height) {
              setVideoDimensions({ width: meta.width, height: meta.height });
            }
          }
        });
      }

      setValidation({ isValid: true, issues: [] });
    }
  };

  // Live Image Format Selector handler (without re-pasting Base64)
  const handleImageFormatChange = async (newOptions: ImageConversionOptions) => {
    setImageFormatOptions(newOptions);
    if (!decodedBlob) return;

    setIsConvertingImage(true);
    try {
      const conv = await convertImageBlob(decodedBlob, newOptions, customFilename);
      registerObjectUrl(conv.objectUrl);
      setConvertedImage(conv);
      setMediaPreviewUrl(conv.objectUrl);
      setDetectedMime(conv.mimeType);
      setCustomFilename(conv.suggestedFilename);
      setValidation({ isValid: true, issues: [] });
    } catch (err: any) {
      setValidation({
        isValid: false,
        issues: [{ message: err?.message || 'Failed to convert image format.', severity: 'error' }],
      });
    } finally {
      setIsConvertingImage(false);
    }
  };

  const handleFileDrop = async (file: File) => {
    setSelectedFile(file);
    const meta: FileMetadataInfo = {
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
    };

    // If image, parse dimensions and headers
    if (file.type.startsWith('image/')) {
      try {
        const buf = await file.arrayBuffer();
        const parsed = parseImageBytes(new Uint8Array(buf));
        setParsedSourceImage(parsed);
        if (parsed?.dimensions) {
          meta.dimensions = { width: parsed.dimensions.width, height: parsed.dimensions.height };
        }
      } catch {
        // ignore
      }
    }

    setFileMetadata(meta);
  };

  const handleReset = () => {
    revokeAllObjectUrls();
    setTextInput('');
    setSelectedFile(null);
    setFileMetadata(null);
    setOutputString('');
    setDataUriString('');
    setDecodedBlob(null);
    setConvertedImage(null);
    setParsedSourceImage(null);
    setMediaPreviewUrl(null);
    setAudioDuration(undefined);
    setVideoDuration(undefined);
    setVideoDimensions(undefined);
    setHasPdfSignature(false);
    setValidation({ isValid: null, issues: [] });
  };

  const handleDownloadOutput = () => {
    if (toolId === 'base64-to-image' && convertedImage) {
      downloadFile(convertedImage.blob, convertedImage.suggestedFilename, convertedImage.mimeType);
    } else if (decodedBlob) {
      downloadFile(decodedBlob, customFilename, detectedMime);
    } else if (outputString) {
      downloadFile(outputString, outputFileName, 'text/plain;charset=utf-8');
    }
  };

  const isFileInput =
    toolId === 'file-to-base64' ||
    toolId === 'image-to-base64' ||
    toolId === 'audio-to-base64' ||
    toolId === 'video-to-base64' ||
    toolId === 'pdf-to-base64';

  const isMediaDecoder =
    toolId === 'base64-to-image' ||
    toolId === 'base64-to-audio' ||
    toolId === 'base64-to-video' ||
    toolId === 'base64-to-pdf' ||
    toolId === 'base64-to-file';

  // Construct Detailed Metadata for Active Tool
  let detailedMetadata: DetailedFileMetadata | null = null;
  const hasActiveContent = Boolean(
    textInput.trim() || selectedFile || outputString || decodedBlob || convertedImage
  );

  if (hasActiveContent) {
    if (toolId === 'base64-to-image') {
      detailedMetadata = buildImageDetails({
        toolId: 'base64-to-image',
        sourceInfo: {
          mimeType: parsedSourceImage?.mimeType || detectedMime,
          sizeBytes: decodedBlob ? decodedBlob.size : 0,
          parsed: parsedSourceImage,
        },
        outputResult: {
          conversion: convertedImage,
        },
      });
    } else if (toolId === 'image-to-base64') {
      detailedMetadata = buildImageDetails({
        toolId: 'image-to-base64',
        sourceInfo: selectedFile
          ? {
              filename: selectedFile.name,
              mimeType: selectedFile.type,
              sizeBytes: selectedFile.size,
              parsed: parsedSourceImage,
              dimensions: fileMetadata?.dimensions,
            }
          : undefined,
        outputResult: {
          dataUriMode,
          base64String: outputString,
        },
      });
    } else if (
      toolId === 'text-to-base64' ||
      toolId === 'base64-to-text' ||
      toolId === 'hex-to-base64' ||
      toolId === 'base64-to-hex' ||
      toolId === 'url-to-base64' ||
      toolId === 'html-to-base64' ||
      toolId === 'css-to-base64'
    ) {
      detailedMetadata = buildTextDetails({
        toolId,
        inputString: textInput,
        outputString,
        urlSafe,
        isUtf8Valid: validation.isValid ?? undefined,
      });
    } else if (toolId === 'file-to-base64' || toolId === 'base64-to-file') {
      detailedMetadata = buildFileDetails({
        toolId,
        filename: selectedFile ? selectedFile.name : customFilename,
        sizeBytes: selectedFile ? selectedFile.size : (decodedBlob ? decodedBlob.size : 0),
        mimeType: selectedFile ? selectedFile.type : detectedMime,
        outputFilename: customFilename,
        outputSize: outputString ? outputString.length : (decodedBlob ? decodedBlob.size : 0),
      });
    } else if (toolId === 'pdf-to-base64' || toolId === 'base64-to-pdf') {
      detailedMetadata = buildPdfDetails({
        toolId,
        filename: selectedFile ? selectedFile.name : customFilename,
        sizeBytes: selectedFile ? selectedFile.size : (decodedBlob ? decodedBlob.size : 0),
        hasPdfSignature,
        outputSize: outputString ? outputString.length : (decodedBlob ? decodedBlob.size : 0),
      });
    } else if (toolId === 'audio-to-base64' || toolId === 'base64-to-audio') {
      detailedMetadata = buildAudioDetails({
        toolId,
        filename: selectedFile ? selectedFile.name : customFilename,
        sizeBytes: selectedFile ? selectedFile.size : (decodedBlob ? decodedBlob.size : 0),
        mimeType: selectedFile ? selectedFile.type : detectedMime,
        duration: audioDuration,
        outputSize: outputString ? outputString.length : (decodedBlob ? decodedBlob.size : 0),
      });
    } else if (toolId === 'video-to-base64' || toolId === 'base64-to-video') {
      detailedMetadata = buildVideoDetails({
        toolId,
        filename: selectedFile ? selectedFile.name : customFilename,
        sizeBytes: selectedFile ? selectedFile.size : (decodedBlob ? decodedBlob.size : 0),
        mimeType: selectedFile ? selectedFile.type : detectedMime,
        duration: videoDuration,
        dimensions: videoDimensions,
        outputSize: outputString ? outputString.length : (decodedBlob ? decodedBlob.size : 0),
      });
    }
  }

  return (
    <div className="tool-workspace-container">
      {/* Primary Base64 Developer Suite Tabs */}
      <div className="workspace-tab-nav" role="tablist">
        <button
          role="tab"
          aria-selected={workbenchTab === 'editor'}
          className={`btn btn-sm ${workbenchTab === 'editor' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setWorkbenchTab('editor')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Binary size={14} />
          <span>Workspace</span>
        </button>

        <button
          role="tab"
          aria-selected={workbenchTab === 'inspect'}
          className={`btn btn-sm ${workbenchTab === 'inspect' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setWorkbenchTab('inspect')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Search size={14} />
          <span>Smart Inspector</span>
        </button>

        <button
          role="tab"
          aria-selected={workbenchTab === 'validate'}
          className={`btn btn-sm ${workbenchTab === 'validate' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setWorkbenchTab('validate')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <ShieldCheck size={14} />
          <span>Validator</span>
        </button>

        <button
          role="tab"
          aria-selected={workbenchTab === 'repair'}
          className={`btn btn-sm ${workbenchTab === 'repair' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setWorkbenchTab('repair')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Wrench size={14} />
          <span>Repair & Normalize</span>
        </button>

        <button
          role="tab"
          aria-selected={workbenchTab === 'data-uri'}
          className={`btn btn-sm ${workbenchTab === 'data-uri' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setWorkbenchTab('data-uri')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Link2 size={14} />
          <span>Data URI</span>
        </button>

        <button
          role="tab"
          aria-selected={workbenchTab === 'extractor'}
          className={`btn btn-sm ${workbenchTab === 'extractor' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setWorkbenchTab('extractor')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <ScanSearch size={14} />
          <span>Payload Extractor</span>
        </button>

        <button
          role="tab"
          aria-selected={workbenchTab === 'hex-viewer'}
          className={`btn btn-sm ${workbenchTab === 'hex-viewer' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setWorkbenchTab('hex-viewer')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <FileCode size={14} />
          <span>Hex Viewer</span>
        </button>

        <button
          role="tab"
          aria-selected={workbenchTab === 'gzip'}
          className={`btn btn-sm ${workbenchTab === 'gzip' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setWorkbenchTab('gzip')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Archive size={14} />
          <span>Gzip Compression</span>
        </button>

        <button
          role="tab"
          aria-selected={workbenchTab === 'basic-auth'}
          className={`btn btn-sm ${workbenchTab === 'basic-auth' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setWorkbenchTab('basic-auth')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Lock size={14} />
          <span>Basic Auth</span>
        </button>
      </div>

      {workbenchTab === 'inspect' && (
        <Base64InspectorView
          initialPayload={textInput || outputString}
          onNavigateToMode={(mode, payload) => {
            if (payload) setTextInput(payload);
            setWorkbenchTab('editor');
          }}
        />
      )}

      {workbenchTab === 'validate' && (
        <Base64ValidatorView
          initialPayload={textInput || outputString}
          onSendToRepair={(payload) => {
            setTextInput(payload);
            setWorkbenchTab('repair');
          }}
        />
      )}

      {workbenchTab === 'repair' && (
        <Base64RepairView
          initialPayload={textInput || outputString}
          onSendToDecode={(payload) => {
            setTextInput(payload);
            setWorkbenchTab('editor');
          }}
        />
      )}

      {workbenchTab === 'data-uri' && <DataUriWorkbenchView />}

      {workbenchTab === 'extractor' && (
        <PayloadExtractorView
          onInspectCandidate={(payload) => {
            setTextInput(payload);
            setWorkbenchTab('inspect');
          }}
          onDecodeCandidate={(payload) => {
            setTextInput(payload);
            setWorkbenchTab('editor');
          }}
        />
      )}

      {workbenchTab === 'hex-viewer' && (
        <HexViewer bytes={hexBytes} filename={customFilename || outputFileName} />
      )}

      {workbenchTab === 'gzip' && <GzipBase64View />}

      {workbenchTab === 'basic-auth' && <BasicAuthWorkspace />}

      {workbenchTab === 'editor' && (
        <>
          <ToolModeTabs
            currentSlug={toolId}
            pairedSlug={pairedSlug}
            pairedName={pairedName}
            activeDirection={direction}
          />

          {/* Main Action Bar */}
          <div className="tool-toolbar">
            <div className="toolbar-group-left">
              {/* URL-Safe checkbox for text & hex */}
              {(toolId === 'text-to-base64' || toolId === 'hex-to-base64' || toolId === 'url-to-base64') && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={urlSafe}
                    onChange={(e) => setUrlSafe(e.target.checked)}
                  />
                  <span>URL-Safe (- and _)</span>
                </label>
              )}

              {/* Data URI vs Raw Base64 for file encoders */}
              {(isFileInput || toolId === 'html-to-base64' || toolId === 'css-to-base64') && (
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    className={`btn btn-sm ${dataUriMode === 'data-uri' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setDataUriMode('data-uri')}
                  >
                    Data URI
                  </button>
                  <button
                    className={`btn btn-sm ${dataUriMode === 'raw' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setDataUriMode('raw')}
                  >
                    Raw Base64
                  </button>
                </div>
              )}

              {/* Hex formatting options */}
              {toolId === 'base64-to-hex' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <input
                      type="checkbox"
                      checked={hexOptions.uppercase}
                      onChange={(e) => setHexOptions({ ...hexOptions, uppercase: e.target.checked })}
                    />
                    <span>Uppercase</span>
                  </label>

                  <select
                    className="select-control"
                    value={hexOptions.grouping}
                    onChange={(e) => setHexOptions({ ...hexOptions, grouping: e.target.value as any })}
                  >
                    <option value="none">No Space</option>
                    <option value="space">Space Separated</option>
                    <option value="colon">Colon (:) Separated</option>
                    <option value="hyphen">Hyphen (-) Separated</option>
                  </select>
                </div>
              )}

              {/* Custom Filename for Base64 to File */}
              {toolId === 'base64-to-file' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                  <label htmlFor="custom-fname">Save As:</label>
                  <input
                    id="custom-fname"
                    type="text"
                    className="select-control"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    style={{ width: '160px' }}
                  />
                </div>
              )}
            </div>

            <div className="toolbar-group-right" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => executeJob()}
                title={direction === 'encode' ? 'Encode to Base64' : 'Decode Base64'}
              >
                {direction === 'encode' ? <Binary size={14} /> : <ArrowRightLeft size={14} />}
                <span>{direction === 'encode' ? 'Encode to Base64' : 'Decode Payload'}</span>
              </button>
              <ResetButton onReset={handleReset} />
            </div>
          </div>

          <ValidationMessage
            isValid={validation.isValid}
            issues={validation.issues}
            successMessage={`Successfully ${direction === 'encode' ? 'Encoded to Base64' : 'Decoded'}`}
          />

          {isLargeOutput && (
            <LargeOutputNotice
              totalBytes={outputString.length}
              onDownload={handleDownloadOutput}
              fileName={outputFileName}
            />
          )}

          {/* Mobile Panel Switcher for Touch Viewports */}
          <div className="workspace-mobile-tabs" role="tablist" aria-label="Editor panel selection">
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'both'}
              className={`workspace-mobile-tab ${mobileTab === 'both' ? 'active' : ''}`}
              onClick={() => setMobileTab('both')}
            >
              Both Panels
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'input'}
              className={`workspace-mobile-tab ${mobileTab === 'input' ? 'active' : ''}`}
              onClick={() => setMobileTab('input')}
            >
              {isFileInput ? 'File Upload' : 'Input'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobileTab === 'output'}
              className={`workspace-mobile-tab ${mobileTab === 'output' ? 'active' : ''}`}
              onClick={() => setMobileTab('output')}
            >
              Output Result
            </button>
          </div>

          {/* Workspace Panels */}
          <div className="editor-workspace-grid">
            {/* Left Column: Input (File or Text) */}
            <div className={`editor-panel ${mobileTab === 'output' ? 'mobile-panel-hidden' : ''}`}>
              <div className="panel-header">
                <span className="panel-title-group">
                  {isFileInput ? 'Select or Drop File' : 'Input'}
                </span>
                <div className="panel-actions">
                  {!isFileInput && (
                    <>
                      <button
                        type="button"
                        onClick={() => setWrapText(!wrapText)}
                        className={`btn btn-xs ${wrapText ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.75rem', gap: '0.25rem', padding: '0.2rem 0.5rem' }}
                        title={wrapText ? 'Disable Word Wrap' : 'Enable Word Wrap'}
                        aria-pressed={wrapText}
                      >
                        <WrapText size={13} />
                        <span>Wrap</span>
                      </button>
                      <CopyButton text={textInput} label="Copy" />
                    </>
                  )}
                </div>
              </div>

              <div className="panel-body" style={{ padding: isFileInput ? '1.25rem' : '0' }}>
                {isFileInput ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    {fileMetadata && <FileMetadata metadata={fileMetadata} />}
                    <FileUploadZone
                      onFileSelect={handleFileDrop}
                      acceptedExtensions={acceptedExtensions}
                      label={`Drop ${fileCategory !== 'any' ? fileCategory : 'file'} or click to browse`}
                    />
                  </div>
                ) : (
                  <textarea
                    className={`editor-textarea ${wrapText ? 'wrap-text' : ''}`}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste input here..."
                    spellCheck="false"
                    style={{
                      whiteSpace: wrapText ? 'pre-wrap' : 'pre',
                      wordBreak: wrapText ? 'break-all' : 'normal',
                      overflowWrap: wrapText ? 'anywhere' : 'normal',
                      overflowY: 'auto',
                      overflowX: wrapText ? 'hidden' : 'auto',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Output (Media Preview or Text) */}
            <div className={`editor-panel ${mobileTab === 'input' ? 'mobile-panel-hidden' : ''}`}>
              <div className="panel-header">
                <span className="panel-title-group">
                  {isMediaDecoder ? 'Decoded Media Preview' : 'Output'}
                </span>
                <div className="panel-actions">
                  {!isMediaDecoder && (
                    <>
                      <button
                        type="button"
                        onClick={() => setWrapText(!wrapText)}
                        className={`btn btn-xs ${wrapText ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.75rem', gap: '0.25rem', padding: '0.2rem 0.5rem' }}
                        title={wrapText ? 'Disable Word Wrap' : 'Enable Word Wrap'}
                        aria-pressed={wrapText}
                      >
                        <WrapText size={13} />
                        <span>Wrap</span>
                      </button>
                      <CopyButton text={outputString} label="Copy Output" />
                    </>
                  )}
                  <DownloadButton
                    content={
                      toolId === 'base64-to-image' && convertedImage
                        ? convertedImage.blob
                        : outputString || decodedBlob || ''
                    }
                    fileName={
                      toolId === 'base64-to-image' && convertedImage
                        ? convertedImage.suggestedFilename
                        : customFilename || outputFileName
                    }
                    mimeType={
                      toolId === 'base64-to-image' && convertedImage
                        ? convertedImage.mimeType
                        : detectedMime
                    }
                    onDownload={handleDownloadOutput}
                    disabled={!outputString && !decodedBlob && !convertedImage}
                  />
                </div>
              </div>

              <div className="panel-body" style={{ padding: isMediaDecoder ? '1.25rem' : '0' }}>
                {/* Dynamic Output Format Switcher Toolbar for Base64 to Image */}
                {toolId === 'base64-to-image' && decodedBlob && (
                  <FormatSelector
                    options={imageFormatOptions}
                    onChange={handleImageFormatChange}
                    detectedMime={parsedSourceImage?.mimeType || detectedMime}
                    disabled={isConvertingImage}
                  />
                )}

                {isMediaDecoder ? (
                  mediaPreviewUrl ? (
                    <FilePreview
                      mediaUrl={mediaPreviewUrl}
                      mimeType={detectedMime}
                      fileName={convertedImage?.suggestedFilename || customFilename}
                      fileSize={convertedImage ? convertedImage.sizeBytes : decodedBlob ? decodedBlob.size : 0}
                      dimensions={convertedImage?.width && convertedImage?.height ? { width: convertedImage.width, height: convertedImage.height } : parsedSourceImage?.dimensions}
                      isConverting={isConvertingImage}
                      onDownload={handleDownloadOutput}
                    />
                  ) : (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Paste Base64 data on the left to decode and preview.
                    </div>
                  )
                ) : (
                  <textarea
                    className={`editor-textarea ${wrapText ? 'wrap-text' : ''}`}
                    readOnly
                    value={outputString}
                    placeholder="Result will appear here..."
                    style={{
                      whiteSpace: wrapText ? 'pre-wrap' : 'pre',
                      wordBreak: wrapText ? 'break-all' : 'normal',
                      overflowWrap: wrapText ? 'anywhere' : 'normal',
                      overflowY: 'auto',
                      overflowX: wrapText ? 'hidden' : 'auto',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Feature-Driven Expandable File Details Section */}
          {detailedMetadata && (
            <FileDetailsPanel metadata={detailedMetadata} defaultExpanded={false} />
          )}
        </>
      )}
    </div>
  );
}
