'use client';

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Eye, EyeOff, Copy, Key, Lock, ArrowRight, Code } from 'lucide-react';
import { decodeBasicAuth, encodeBasicAuth } from '../services/text-encoding.service';
import { CopyButton } from '@/components/workspace/CopyButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import { ValidationMessage } from './ValidationMessage';
import { FileDetailsPanel } from './FileDetailsPanel';
import { buildBasicAuthDetails } from '../adapters/basic-auth-details.adapter';
import { ToolModeTabs } from './ToolModeTabs';

export function BasicAuthWorkspace() {
  const [mode, setMode] = useState<'decode' | 'encode'>('decode');

  // Decode states
  const [decodeInput, setDecodeInput] = useState('Basic YWRtaW46c2VjcmV0cGFzc3dvcmQxMjM=');
  const [showPassword, setShowPassword] = useState(false);

  // Encode states
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('secretpassword123');

  const creds = decodeBasicAuth(decodeInput);
  const encoded = encodeBasicAuth(usernameInput, passwordInput);

  const handleReset = () => {
    if (mode === 'decode') {
      setDecodeInput('');
    } else {
      setUsernameInput('');
      setPasswordInput('');
    }
  };

  return (
    <div className="tool-workspace-container">
      {/* Prominent Privacy & Security Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.875rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
        }}
        role="alert"
      >
        <div style={{ color: 'var(--color-error)', marginTop: '0.15rem' }}>
          <ShieldAlert size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-error)', fontSize: '0.9375rem' }}>
            Security & Zero-Knowledge Privacy Notice
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
            Decoded credentials and generated headers are processed <strong>100% locally in your browser memory</strong>. Credentials are never transmitted to our servers, logged, or saved to your browser&apos;s recent history or local storage. Remember: Base64 is an encoding scheme, not encryption.
          </div>
        </div>
      </div>

      <ToolModeTabs
        currentSlug="basic-auth-decoder"
        pairedSlug="text-to-base64"
        pairedName="Text to Base64"
        activeDirection={mode === 'decode' ? 'decode' : 'encode'}
      />

      <div className="tool-toolbar">
        <div className="toolbar-group-left">
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className={`btn btn-sm ${mode === 'decode' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMode('decode')}
            >
              Decode Header
            </button>
            <button
              className={`btn btn-sm ${mode === 'encode' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMode('encode')}
            >
              Generate Header
            </button>
          </div>
        </div>
        <div className="toolbar-group-right">
          <ResetButton onReset={handleReset} />
        </div>
      </div>

      {mode === 'decode' && creds.error && (
        <ValidationMessage
          isValid={false}
          issues={[{ message: creds.error, severity: 'error' }]}
        />
      )}

      {mode === 'decode' ? (
        /* Decode View */
        <div className="editor-workspace-grid">
          {/* Input Panel */}
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-title-group">Authorization Header or Base64 Token</span>
              <div className="panel-actions">
                <CopyButton text={decodeInput} label="Copy" />
              </div>
            </div>
            <div className="panel-body">
              <textarea
                className="editor-textarea wrap-text"
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                placeholder="Paste 'Authorization: Basic <token>' or raw credentials here..."
                spellCheck="false"
                autoComplete="off"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere',
                  overflowY: 'auto',
                }}
              />
            </div>
          </div>

          {/* Decoded Credentials Panel */}
          <div className="editor-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <Key size={16} />
                <span>Decoded Credentials</span>
              </div>
              {creds.isValid && (
                <span className="badge badge-success">Valid Format</span>
              )}
            </div>
            <div
              className="panel-body"
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
            >
              {creds.isValid ? (
                <>
                  {/* Username Field */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Username
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="text"
                        readOnly
                        value={creds.username}
                        className="select-control"
                        style={{ flex: 1, height: '40px', fontSize: '0.9375rem', fontFamily: 'var(--font-mono)' }}
                      />
                      <CopyButton text={creds.username} label="Copy User" />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Password
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        readOnly
                        value={creds.password || ''}
                        className="select-control"
                        style={{ flex: 1, height: '40px', fontSize: '0.9375rem', fontFamily: 'var(--font-mono)' }}
                      />
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        <span>{showPassword ? 'Hide' : 'Show'}</span>
                      </button>
                      <CopyButton text={creds.password || ''} label="Copy Pass" />
                    </div>
                  </div>

                  {/* Full Pair Raw Display */}
                  <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>RAW PAIR (username:password)</span>
                      <CopyButton text={`${creds.username}:${creds.password || ''}`} label="Copy Pair" />
                    </div>
                    <pre style={{ margin: 0, padding: '0.625rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                      {creds.username}:{showPassword ? (creds.password || '') : '••••••••••••'}
                    </pre>
                  </div>
                </>
              ) : (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Paste Basic Authentication header to extract username and password.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Encode View */
        <div className="editor-workspace-grid">
          {/* Input Panel for Username & Password */}
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-title-group">Enter Credentials</span>
            </div>
            <div className="panel-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#A6B4C8', marginBottom: '0.35rem' }}>
                  USERNAME
                </label>
                <input
                  type="text"
                  className="select-control"
                  style={{ width: '100%', height: '40px' }}
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. admin"
                  autoComplete="off"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#A6B4C8', marginBottom: '0.35rem' }}>
                  PASSWORD
                </label>
                <input
                  type="password"
                  className="select-control"
                  style={{ width: '100%', height: '40px' }}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Generated Header & Code Snippets */}
          <div className="editor-panel">
            <div className="panel-header">
              <span className="panel-title-group">HTTP Authorization Header</span>
              <div className="panel-actions">
                <CopyButton text={encoded.authorizationHeader} label="Copy Header" />
              </div>
            </div>
            <div className="panel-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600 }}>HTTP Header</span>
                <pre style={{ margin: '0.25rem 0 0', padding: '0.625rem', backgroundColor: '#0B1120', borderRadius: '4px', fontSize: '0.8125rem', color: '#22C3EE', overflowX: 'auto' }}>
                  {encoded.authorizationHeader}
                </pre>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600 }}>cURL Command</span>
                  <CopyButton text={encoded.curlExample} label="Copy cURL" />
                </div>
                <pre style={{ margin: '0.25rem 0 0', padding: '0.625rem', backgroundColor: '#0B1120', borderRadius: '4px', fontSize: '0.75rem', color: '#F8FAFC', overflowX: 'auto' }}>
                  {encoded.curlExample}
                </pre>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#A6B4C8', fontWeight: 600 }}>JavaScript fetch()</span>
                  <CopyButton text={encoded.fetchExample} label="Copy Fetch" />
                </div>
                <pre style={{ margin: '0.25rem 0 0', padding: '0.625rem', backgroundColor: '#0B1120', borderRadius: '4px', fontSize: '0.75rem', color: '#F8FAFC', overflowX: 'auto' }}>
                  {encoded.fetchExample}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Non-sensitive, Zero-Knowledge Privacy Details Panel */}
      {mode === 'decode' && creds.isValid && (
        <FileDetailsPanel
          metadata={buildBasicAuthDetails({
            isValid: creds.isValid,
            hasAuthorizationPrefix: decodeInput.trim().toLowerCase().startsWith('basic '),
            tokenLength: creds.base64Token.length,
            hasPasswordDefined: Boolean(creds.hasPassword),
          })}
        />
      )}
    </div>
  );
}
