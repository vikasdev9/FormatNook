'use client';

import React, { useState } from 'react';
import { Upload, Image as ImageIcon, Copy, Download, RefreshCw, FileText } from 'lucide-react';
import { parseBase64ImageInput } from '../services/base64-service';
import { CopyButton } from '@/components/workspace/CopyButton';
import { DownloadButton } from '@/components/workspace/DownloadButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import { formatByteSize, readDataUrlFile } from '@/lib/file-reader';

interface ImageBase64WorkspaceProps {
  initialMode: 'image-to-base64' | 'base64-to-image';
}

export function ImageBase64Workspace({ initialMode }: ImageBase64WorkspaceProps) {
  const [mode, setMode] = useState<'image-to-base64' | 'base64-to-image'>(initialMode);

  // Image to Base64 state
  const [imgDataUri, setImgDataUri] = useState<string>('');
  const [imgFileName, setImgFileName] = useState<string>('');
  const [imgFileSize, setImgFileSize] = useState<number>(0);
  const [imgMimeType, setImgMimeType] = useState<string>('');
  const [outputType, setOutputType] = useState<'data-uri' | 'raw'>('data-uri');

  // Base64 to Image state
  const [pastedBase64, setPastedBase64] = useState<string>('');
  const [b64Error, setB64Error] = useState<string | null>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const result = await readDataUrlFile(file, { maxSizeInBytes: 15 * 1024 * 1024 });
        setImgDataUri(result.dataUrl);
        setImgFileName(result.name);
        setImgFileSize(result.size);
        setImgMimeType(result.mimeType);
      } catch (err: any) {
        alert(err?.message || 'Failed to read image.');
      }
    }
  };

  const rawBase64 = imgDataUri.replace(/^data:[^;]+;base64,/, '');
  const activeBase64Output = outputType === 'data-uri' ? imgDataUri : rawBase64;

  // Reconstructed image for Base64 to Image
  const parsedImage = parseBase64ImageInput(pastedBase64);

  return (
    <div className="tool-workspace-container">
      <div className="tool-toolbar">
        <div className="toolbar-group-left">
          <button
            className={`btn ${mode === 'image-to-base64' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('image-to-base64')}
          >
            <ImageIcon size={15} />
            <span>Image to Base64</span>
          </button>

          <button
            className={`btn ${mode === 'base64-to-image' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('base64-to-image')}
          >
            <FileText size={15} />
            <span>Base64 to Image</span>
          </button>
        </div>

        <div className="toolbar-group-right">
          <ResetButton
            onReset={() => {
              setImgDataUri('');
              setImgFileName('');
              setImgFileSize(0);
              setPastedBase64('');
              setB64Error(null);
            }}
          />
        </div>
      </div>

      {mode === 'image-to-base64' ? (
        <div className="editor-workspace-grid">
          {/* Upload and Preview Column */}
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-title-group">Select or Drop Image</span>
              {imgFileSize > 0 && <span className="panel-stats">{formatByteSize(imgFileSize)}</span>}
            </div>
            <div
              className="panel-body"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
            >
              {imgDataUri ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
                  <div
                    style={{
                      maxHeight: '260px',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'repeating-conic-gradient(#80808020 0% 25%, transparent 0% 50%) 50% / 16px 16px',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgDataUri}
                      alt={imgFileName || 'Uploaded preview'}
                      style={{ maxHeight: '250px', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    <div><strong>File:</strong> {imgFileName}</div>
                    <div><strong>Type:</strong> {imgMimeType} &bull; <strong>Size:</strong> {formatByteSize(imgFileSize)}</div>
                  </div>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    <Upload size={14} />
                    <span>Choose Different Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageFileChange}
                    />
                  </label>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    border: '2px dashed var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                >
                  <div className="category-card-icon" style={{ margin: 0 }}>
                    <Upload size={24} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      Click to Browse or Drag Image Here
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      PNG, JPG, SVG, WebP, GIF, ICO (Max 15MB)
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Base64 Output Column */}
          <div className="editor-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <span>Base64 String Output</span>
                {imgDataUri && (
                  <span className="panel-stats">
                    {formatByteSize(new Blob([activeBase64Output]).size)}
                  </span>
                )}
              </div>
              <div className="panel-actions">
                <div style={{ display: 'flex', gap: '0.25rem', marginRight: '0.5rem' }}>
                  <button
                    className={`btn btn-sm ${outputType === 'data-uri' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setOutputType('data-uri')}
                  >
                    Data URI
                  </button>
                  <button
                    className={`btn btn-sm ${outputType === 'raw' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setOutputType('raw')}
                  >
                    Raw Base64
                  </button>
                </div>
                <CopyButton text={activeBase64Output} label="Copy" />
                <DownloadButton
                  content={activeBase64Output}
                  fileName="image-base64.txt"
                />
              </div>
            </div>
            <div className="panel-body">
              <textarea
                className="editor-textarea"
                readOnly
                value={activeBase64Output}
                placeholder="Upload an image to generate Base64 or Data URI string..."
              />
            </div>
          </div>
        </div>
      ) : (
        /* Base64 to Image Mode */
        <div className="editor-workspace-grid">
          {/* Base64 Input Column */}
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-title-group">Paste Base64 or Data URI</span>
              <div className="panel-actions">
                <CopyButton text={pastedBase64} label="Copy" />
              </div>
            </div>
            <div className="panel-body">
              <textarea
                className="editor-textarea"
                value={pastedBase64}
                onChange={(e) => setPastedBase64(e.target.value)}
                placeholder="Paste raw Base64 string or data:image/...;base64,... here"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Reconstructed Image Preview Column */}
          <div className="editor-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <span>Image Preview</span>
                {parsedImage.isValid && (
                  <span className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>
                    {parsedImage.mimeType}
                  </span>
                )}
              </div>
              <div className="panel-actions">
                {parsedImage.isValid && (
                  <DownloadButton
                    content={parsedImage.dataUri}
                    fileName={`decoded-image.${parsedImage.mimeType.split('/')[1] || 'png'}`}
                    isDataUrl={true}
                    label="Download Image"
                  />
                )}
              </div>
            </div>
            <div
              className="panel-body"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
            >
              {parsedImage.isValid ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      maxHeight: '320px',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'repeating-conic-gradient(#80808020 0% 25%, transparent 0% 50%) 50% / 16px 16px',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={parsedImage.dataUri}
                      alt="Decoded base64 preview"
                      style={{ maxHeight: '300px', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Detected format: <strong>{parsedImage.mimeType}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  {pastedBase64.trim() ? (
                    <div style={{ color: 'var(--color-error)' }}>
                      {parsedImage.errorMessage || 'Invalid Base64 image payload.'}
                    </div>
                  ) : (
                    <div>Paste Base64 data on the left to render image preview.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
