'use client';

import React, { useState, useMemo } from 'react';
import { Link2, Copy, Download, Code, Check, FileDown } from 'lucide-react';
import { parseDataUri, buildDataUriSnippets, dataUriToDownloadableFile, ParsedDataUri } from '../services/data-uri.service';
import { downloadFile } from '@/lib/download';
import { CopyButton } from '@/components/workspace/CopyButton';

const SAMPLE_DATA_URIS = [
  {
    name: '1x1 PNG Pixel',
    value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  },
  {
    name: 'Inline CSS',
    value: 'data:text/css;base64,LmJ0biB7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgcGFkZGluZzogOHB4IDE2cHg7IH0=',
  },
  {
    name: 'SVG Vector Icon',
    value: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjgiIGZpbGw9IiMyMkMzRUUiLz48L3N2Zz4=',
  },
];

export function DataUriWorkbenchView() {
  const [dataUriInput, setDataUriInput] = useState<string>(SAMPLE_DATA_URIS[0].value);

  const parsed = useMemo<ParsedDataUri>(() => {
    return parseDataUri(dataUriInput);
  }, [dataUriInput]);

  const snippets = useMemo(() => {
    if (!parsed.isValid) return null;
    return buildDataUriSnippets(dataUriInput, parsed.mimeType);
  }, [dataUriInput, parsed]);

  const handleDownload = () => {
    if (!parsed.isValid) return;
    const { blob, filename, mimeType } = dataUriToDownloadableFile(dataUriInput);
    downloadFile(blob, filename, mimeType);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Input panel */}
      <div className="editor-panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <Link2 size={16} />
            <span>RFC 2397 Data URI Inspector & Snippet Generator</span>
          </div>
          <div className="panel-actions" style={{ display: 'flex', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Samples:</span>
            {SAMPLE_DATA_URIS.map((s) => (
              <button
                key={s.name}
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setDataUriInput(s.value)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body">
          <textarea
            className="editor-textarea wrap-text"
            rows={4}
            value={dataUriInput}
            onChange={(e) => setDataUriInput(e.target.value)}
            placeholder="Paste complete Data URI (e.g. data:image/png;base64,iVBORw0...)"
            spellCheck="false"
            style={{
              minHeight: '100px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              overflowWrap: 'anywhere',
              overflowY: 'auto',
            }}
          />
        </div>
      </div>

      {/* Parsed Structure & Metadata */}
      {parsed.isValid ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Metadata Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div style={{ backgroundColor: '#151F31', border: '1px solid #263449', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>MIME Type</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
                {parsed.mimeType}
              </div>
            </div>

            <div style={{ backgroundColor: '#151F31', border: '1px solid #263449', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Media Category</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC', textTransform: 'capitalize' }}>
                {parsed.mediaType}
              </div>
            </div>

            <div style={{ backgroundColor: '#151F31', border: '1px solid #263449', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Encoding Scheme</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#22C3EE' }}>
                {parsed.isBase64 ? 'Base64' : 'Percent-Encoded'}
              </div>
            </div>

            <div style={{ backgroundColor: '#151F31', border: '1px solid #263449', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#A6B4C8' }}>Decoded Bytes</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
                {parsed.decodedBytesLength.toLocaleString()} B
              </div>
            </div>
          </div>

          {/* Quick Action: Download Decoded File */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleDownload}>
              <Download size={14} />
              <span>Download Decoded File</span>
            </button>
          </div>

          {/* Developer Code Snippets Section */}
          {snippets && (
            <div
              style={{
                backgroundColor: '#151F31',
                border: '1px solid #263449',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
              }}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={16} />
                <span>Ready-to-Use Developer Code Snippets</span>
              </div>

              {/* Snippet Row Helper */}
              {snippets.htmlImg && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600 }}>HTML Image Tag (&lt;img&gt;)</span>
                    <CopyButton text={snippets.htmlImg} label="Copy HTML" />
                  </div>
                  <pre style={{ backgroundColor: '#0B1120', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', color: '#22C3EE', overflowX: 'auto' }}>
                    {snippets.htmlImg}
                  </pre>
                </div>
              )}

              {snippets.cssBackground && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600 }}>CSS Background Image</span>
                    <CopyButton text={snippets.cssBackground} label="Copy CSS" />
                  </div>
                  <pre style={{ backgroundColor: '#0B1120', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', color: '#22C3EE', overflowX: 'auto' }}>
                    {snippets.cssBackground}
                  </pre>
                </div>
              )}

              {snippets.htmlAudio && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600 }}>HTML Audio Player</span>
                    <CopyButton text={snippets.htmlAudio} label="Copy Audio HTML" />
                  </div>
                  <pre style={{ backgroundColor: '#0B1120', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', color: '#22C3EE', overflowX: 'auto' }}>
                    {snippets.htmlAudio}
                  </pre>
                </div>
              )}

              {snippets.htmlVideo && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600 }}>HTML Video Player</span>
                    <CopyButton text={snippets.htmlVideo} label="Copy Video HTML" />
                  </div>
                  <pre style={{ backgroundColor: '#0B1120', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', color: '#22C3EE', overflowX: 'auto' }}>
                    {snippets.htmlVideo}
                  </pre>
                </div>
              )}

              {snippets.htmlLinkCss && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600 }}>HTML Stylesheet Link Tag</span>
                    <CopyButton text={snippets.htmlLinkCss} label="Copy Link Tag" />
                  </div>
                  <pre style={{ backgroundColor: '#0B1120', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', color: '#22C3EE', overflowX: 'auto' }}>
                    {snippets.htmlLinkCss}
                  </pre>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600 }}>JavaScript / TypeScript Constant</span>
                  <CopyButton text={snippets.jsConstant} label="Copy JS" />
                </div>
                <pre style={{ backgroundColor: '#0B1120', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', color: '#F8FAFC', overflowX: 'auto' }}>
                  {snippets.jsConstant.slice(0, 150)}...&quot;;
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : (
        dataUriInput.trim() && (
          <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F8FAFC', fontSize: '0.875rem' }}>
            {parsed.error || 'Invalid Data URI format. Must begin with data: scheme.'}
          </div>
        )
      )}
    </div>
  );
}

