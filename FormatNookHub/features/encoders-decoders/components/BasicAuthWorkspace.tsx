'use client';

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Eye, EyeOff, Copy, Key, Lock, Trash2 } from 'lucide-react';
import { decodeBasicAuth } from '../services/text-encoding.service';
import { CopyButton } from '@/components/workspace/CopyButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import { ValidationMessage } from './ValidationMessage';
import { FileDetailsPanel } from './FileDetailsPanel';
import { buildBasicAuthDetails } from '../adapters/basic-auth-details.adapter';

export function BasicAuthWorkspace() {
  const [input, setInput] = useState('Basic YWRtaW46c2VjcmV0cGFzc3dvcmQxMjM=');
  const [showPassword, setShowPassword] = useState(false);

  const creds = decodeBasicAuth(input);

  const handleReset = () => {
    setInput('');
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
            Decoded credentials are processed <strong>100% locally in your browser memory</strong>. Credentials are never transmitted to our servers, logged, or saved to your browser&apos;s recent history or local storage. Always exercise caution when handling production secrets.
          </div>
        </div>
      </div>

      <div className="tool-toolbar">
        <div className="toolbar-group-left">
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            HTTP Basic Authorization Header Decoder
          </span>
        </div>
        <div className="toolbar-group-right">
          <ResetButton onReset={handleReset} />
        </div>
      </div>

      {creds.error && (
        <ValidationMessage
          isValid={false}
          issues={[{ message: creds.error, severity: 'error' }]}
        />
      )}

      <div className="editor-workspace-grid">
        {/* Input Panel */}
        <div className="editor-panel">
          <div className="panel-header">
            <span className="panel-title-group">Authorization Header or Base64 Token</span>
            <div className="panel-actions">
              <CopyButton text={input} label="Copy" />
            </div>
          </div>
          <div className="panel-body">
            <textarea
              className="editor-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste 'Authorization: Basic <token>' or raw credentials here..."
              spellCheck="false"
              autoComplete="off"
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

      {/* Non-sensitive, Zero-Knowledge Privacy Details Panel */}
      {creds.isValid && (
        <FileDetailsPanel
          metadata={buildBasicAuthDetails({
            isValid: creds.isValid,
            hasAuthorizationPrefix: input.trim().toLowerCase().startsWith('basic '),
            tokenLength: creds.base64Token.length,
            hasPasswordDefined: Boolean(creds.hasPassword),
          })}
        />
      )}
    </div>
  );
}

