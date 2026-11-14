'use client';

import React, { useState } from 'react';
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
  FileText,
  Image,
  Music,
  Video,
  Hash,
  FileUp,
  Code,
  Palette,
  Link,
} from 'lucide-react';

import { EncoderDecoderToolId } from '../types/encoder-decoder.types';
import { EncoderDecoderWorkspace } from './EncoderDecoderWorkspace';
import { Base64InspectorView } from './Base64InspectorView';
import { Base64ValidatorView } from './Base64ValidatorView';
import { Base64RepairView } from './Base64RepairView';
import { DataUriWorkbenchView } from './DataUriWorkbenchView';
import { PayloadExtractorView } from './PayloadExtractorView';
import { HexViewer } from './HexViewer';
import { GzipBase64View } from './GzipBase64View';
import { BasicAuthWorkspace } from './BasicAuthWorkspace';
import { base64ToBinaryBits, binaryBitsToBase64 } from '../services/binary-conversion.service';
import { base64ToBytes } from '../services/base64.service';
import { CopyButton } from '@/components/workspace/CopyButton';

export type Base64WorkbenchMode =
  | 'encode'
  | 'decode'
  | 'inspect'
  | 'validate'
  | 'repair'
  | 'data-uri'
  | 'extractor'
  | 'hex-viewer'
  | 'gzip'
  | 'basic-auth';

export type Base64FormatSubmode =
  | 'text'
  | 'file'
  | 'image'
  | 'pdf'
  | 'audio'
  | 'video'
  | 'hex'
  | 'binary'
  | 'html'
  | 'css'
  | 'url';

export interface Base64WorkbenchProps {
  initialMode?: Base64WorkbenchMode;
  initialSubmode?: Base64FormatSubmode;
  initialToolId?: EncoderDecoderToolId;
  initialSample?: string;
  outputFileName?: string;
  mimeType?: string;
}

export function Base64Workbench({
  initialMode = 'encode',
  initialSubmode = 'text',
  initialToolId,
  initialSample = '',
  outputFileName,
  mimeType,
}: Base64WorkbenchProps) {
  const [activeMode, setActiveMode] = useState<Base64WorkbenchMode>(initialMode);
  const [submode, setSubmode] = useState<Base64FormatSubmode>(initialSubmode);
  const [sharedPayload, setSharedPayload] = useState<string>(initialSample);

  // Binary Bits Workspace state
  const [binaryBitsInput, setBinaryBitsInput] = useState<string>(
    '01001000 01100101 01101100 01101100 01101111 00100001' // 'Hello!'
  );
  const [binaryBase64Input, setBinaryBase64Input] = useState<string>('SGVsbG8h');

  // Derive ToolId based on direction + submode
  const resolveToolId = (dir: 'encode' | 'decode', sub: Base64FormatSubmode): EncoderDecoderToolId => {
    if (dir === 'encode') {
      switch (sub) {
        case 'text':
          return 'text-to-base64';
        case 'image':
          return 'image-to-base64';
        case 'file':
          return 'file-to-base64';
        case 'pdf':
          return 'pdf-to-base64';
        case 'audio':
          return 'audio-to-base64';
        case 'video':
          return 'video-to-base64';
        case 'hex':
          return 'hex-to-base64';
        case 'html':
          return 'html-to-base64';
        case 'css':
          return 'css-to-base64';
        case 'url':
          return 'url-to-base64';
        default:
          return 'text-to-base64';
      }
    } else {
      switch (sub) {
        case 'text':
          return 'base64-to-text';
        case 'image':
          return 'base64-to-image';
        case 'file':
          return 'base64-to-file';
        case 'pdf':
          return 'base64-to-pdf';
        case 'audio':
          return 'base64-to-audio';
        case 'video':
          return 'base64-to-video';
        case 'hex':
          return 'base64-to-hex';
        default:
          return 'base64-to-text';
      }
    }
  };

  const handleInspectPayload = (payload: string) => {
    setSharedPayload(payload);
    setActiveMode('inspect');
  };

  const handleSendToDecode = (payload: string) => {
    setSharedPayload(payload);
    setActiveMode('decode');
    setSubmode('text');
  };

  const handleSendToRepair = (payload: string) => {
    setSharedPayload(payload);
    setActiveMode('repair');
  };

  const rawBytesForHexViewer = React.useMemo(() => {
    if (!sharedPayload) return null;
    const { bytes, isValid } = base64ToBytes(sharedPayload);
    return isValid ? bytes : null;
  }, [sharedPayload]);

  return (
    <div className="tool-workspace-container" style={{ width: '100%' }}>
      {/* Top Primary Navigation Bar */}
      <div className="workspace-tab-nav" role="tablist">
        <button
          role="tab"
          aria-selected={activeMode === 'encode'}
          className={`btn btn-sm ${activeMode === 'encode' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveMode('encode')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Binary size={14} />
          <span>Encode</span>
        </button>

        <button
          role="tab"
          aria-selected={activeMode === 'decode'}
          className={`btn btn-sm ${activeMode === 'decode' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveMode('decode')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <ArrowRightLeft size={14} />
          <span>Decode</span>
        </button>

        <button
          role="tab"
          aria-selected={activeMode === 'inspect'}
          className={`btn btn-sm ${activeMode === 'inspect' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveMode('inspect')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Search size={14} />
          <span>Smart Inspector</span>
        </button>

        <button
          role="tab"
          aria-selected={activeMode === 'validate'}
          className={`btn btn-sm ${activeMode === 'validate' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveMode('validate')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <ShieldCheck size={14} />
          <span>Validator</span>
        </button>

        <button
          role="tab"
          aria-selected={activeMode === 'repair'}
          className={`btn btn-sm ${activeMode === 'repair' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveMode('repair')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Wrench size={14} />
          <span>Repair & Normalize</span>
        </button>

        <button
          role="tab"
          aria-selected={activeMode === 'data-uri'}
          className={`btn btn-sm ${activeMode === 'data-uri' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveMode('data-uri')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Link2 size={14} />
          <span>Data URI</span>
        </button>

        <button
          role="tab"
          aria-selected={activeMode === 'extractor'}
          className={`btn btn-sm ${activeMode === 'extractor' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveMode('extractor')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <ScanSearch size={14} />
          <span>Payload Extractor</span>
        </button>

        <button
          role="tab"
          aria-selected={activeMode === 'hex-viewer'}
          className={`btn btn-sm ${activeMode === 'hex-viewer' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveMode('hex-viewer')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <FileCode size={14} />
          <span>Hex Viewer</span>
        </button>

        <button
          role="tab"
          aria-selected={activeMode === 'gzip'}
          className={`btn btn-sm ${activeMode === 'gzip' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveMode('gzip')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Archive size={14} />
          <span>Gzip Compression</span>
        </button>

        <button
          role="tab"
          aria-selected={activeMode === 'basic-auth'}
          className={`btn btn-sm ${activeMode === 'basic-auth' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveMode('basic-auth')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Lock size={14} />
          <span>Basic Auth</span>
        </button>
      </div>

      {/* Submode format switcher for Encode/Decode */}
      {(activeMode === 'encode' || activeMode === 'decode') && (
        <div className="workspace-format-submodes">
          <span style={{ fontSize: '0.75rem', color: '#A6B4C8', marginRight: '0.25rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Data Format:
          </span>

          <button
            type="button"
            className={`btn btn-sm ${submode === 'text' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setSubmode('text')}
          >
            <FileText size={13} />
            <span>Text</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${submode === 'image' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setSubmode('image')}
          >
            <Image size={13} />
            <span>Image</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${submode === 'file' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setSubmode('file')}
          >
            <FileUp size={13} />
            <span>File / Binary</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${submode === 'pdf' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setSubmode('pdf')}
          >
            <FileText size={13} />
            <span>PDF</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${submode === 'audio' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setSubmode('audio')}
          >
            <Music size={13} />
            <span>Audio</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${submode === 'video' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setSubmode('video')}
          >
            <Video size={13} />
            <span>Video</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${submode === 'hex' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setSubmode('hex')}
          >
            <Hash size={13} />
            <span>Hex</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${submode === 'binary' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setSubmode('binary')}
          >
            <Binary size={13} />
            <span>Binary Bits (0/1)</span>
          </button>

          {activeMode === 'encode' && (
            <>
              <button
                type="button"
                className={`btn btn-sm ${submode === 'html' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setSubmode('html')}
              >
                <Code size={13} />
                <span>HTML</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${submode === 'css' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setSubmode('css')}
              >
                <Palette size={13} />
                <span>CSS</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm ${submode === 'url' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setSubmode('url')}
              >
                <Link size={13} />
                <span>URL</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Workspace Mode Content */}
      {activeMode === 'inspect' && (
        <Base64InspectorView
          initialPayload={sharedPayload}
          onNavigateToMode={(mode, payload) => {
            if (payload) setSharedPayload(payload);
            if (mode === 'text' || mode === 'image' || mode === 'pdf' || mode === 'audio' || mode === 'video') {
              setActiveMode('decode');
              setSubmode(mode as Base64FormatSubmode);
            } else if (mode === 'hex-viewer') {
              setActiveMode('hex-viewer');
            } else if (mode === 'gzip') {
              setActiveMode('gzip');
            }
          }}
        />
      )}

      {activeMode === 'validate' && (
        <Base64ValidatorView
          initialPayload={sharedPayload}
          onSendToRepair={handleSendToRepair}
        />
      )}

      {activeMode === 'repair' && (
        <Base64RepairView
          initialPayload={sharedPayload}
          onSendToDecode={handleSendToDecode}
        />
      )}

      {activeMode === 'data-uri' && <DataUriWorkbenchView />}

      {activeMode === 'extractor' && (
        <PayloadExtractorView
          onInspectCandidate={handleInspectPayload}
          onDecodeCandidate={handleSendToDecode}
        />
      )}

      {activeMode === 'hex-viewer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-title-group">Base64 Payload to Inspect as Hex</span>
              <div className="panel-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setSharedPayload('SGVsbG8sIEZvcm1hdE5vb2sgRGV2ZWxvcGVyIQ==')}
                >
                  Load Sample
                </button>
              </div>
            </div>
            <div className="panel-body">
              <textarea
                className="editor-textarea wrap-text"
                rows={3}
                value={sharedPayload}
                onChange={(e) => setSharedPayload(e.target.value)}
                placeholder="Paste Base64 payload here to inspect its binary hex dump..."
                spellCheck="false"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  overflowY: 'auto',
                }}
              />
            </div>
          </div>
          <HexViewer bytes={rawBytesForHexViewer} />
        </div>
      )}

      {activeMode === 'gzip' && <GzipBase64View />}

      {activeMode === 'basic-auth' && <BasicAuthWorkspace />}

      {/* Binary Bits (0/1) Mode */}
      {(activeMode === 'encode' || activeMode === 'decode') && submode === 'binary' && (
        <div className="editor-workspace-grid">
          {activeMode === 'encode' ? (
            <>
              <div className="editor-panel">
                <div className="panel-header">
                  <span className="panel-title-group">Binary Bit String (0s and 1s)</span>
                  <div className="panel-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setBinaryBitsInput('01001000 01100101 01101100 01101100 01101111 00100001')}
                    >
                      Sample
                    </button>
                  </div>
                </div>
                <div className="panel-body">
                  <textarea
                    className="editor-textarea wrap-text"
                    value={binaryBitsInput}
                    onChange={(e) => setBinaryBitsInput(e.target.value)}
                    placeholder="Enter binary bits separated by spaces (e.g. 01001000 01100101)..."
                    spellCheck="false"
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      overflowY: 'auto',
                    }}
                  />
                </div>
              </div>

              <div className="editor-panel">
                <div className="panel-header">
                  <span className="panel-title-group">Encoded Base64 Output</span>
                  <div className="panel-actions">
                    <CopyButton
                      text={binaryBitsToBase64(binaryBitsInput).base64}
                      label="Copy Base64"
                    />
                  </div>
                </div>
                <div className="panel-body">
                  <textarea
                    className="editor-textarea wrap-text"
                    readOnly
                    value={binaryBitsToBase64(binaryBitsInput).base64}
                    placeholder="Base64 output will appear here..."
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      overflowY: 'auto',
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="editor-panel">
                <div className="panel-header">
                  <span className="panel-title-group">Base64 Input</span>
                  <div className="panel-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setBinaryBase64Input('SGVsbG8h')}
                    >
                      Sample
                    </button>
                  </div>
                </div>
                <div className="panel-body">
                  <textarea
                    className="editor-textarea wrap-text"
                    value={binaryBase64Input}
                    onChange={(e) => setBinaryBase64Input(e.target.value)}
                    placeholder="Paste Base64 to convert to binary bits (0s and 1s)..."
                    spellCheck="false"
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      overflowY: 'auto',
                    }}
                  />
                </div>
              </div>

              <div className="editor-panel">
                <div className="panel-header">
                  <span className="panel-title-group">Decoded Binary Bits (0/1)</span>
                  <div className="panel-actions">
                    <CopyButton
                      text={base64ToBinaryBits(binaryBase64Input).binaryString}
                      label="Copy Bits"
                    />
                  </div>
                </div>
                <div className="panel-body">
                  <textarea
                    className="editor-textarea wrap-text"
                    readOnly
                    value={base64ToBinaryBits(binaryBase64Input).binaryString}
                    placeholder="Binary bits output will appear here..."
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      overflowY: 'auto',
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Standard Formats (Text, Image, PDF, Audio, Video, File, Hex, HTML, CSS, URL) via existing EncoderDecoderWorkspace */}
      {(activeMode === 'encode' || activeMode === 'decode') && submode !== 'binary' && (
        <EncoderDecoderWorkspace
          toolId={initialToolId || resolveToolId(activeMode, submode)}
          direction={activeMode}
          defaultSample={sharedPayload || initialSample}
          outputFileName={outputFileName}
          mimeType={mimeType}
          acceptedExtensions={
            submode === 'image'
              ? activeMode === 'encode'
                ? ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']
                : ['.txt', '.b64']
              : submode === 'pdf'
              ? activeMode === 'encode'
                ? ['.pdf']
                : ['.txt', '.b64']
              : submode === 'audio'
              ? activeMode === 'encode'
                ? ['.mp3', '.wav', '.ogg', '.aac', '.m4a']
                : ['.txt', '.b64']
              : submode === 'video'
              ? activeMode === 'encode'
                ? ['.mp4', '.webm', '.ogv']
                : ['.txt', '.b64']
              : undefined
          }
          fileCategory={
            submode === 'image' || submode === 'pdf' || submode === 'audio' || submode === 'video'
              ? submode
              : 'any'
          }
        />
      )}
    </div>
  );
}

