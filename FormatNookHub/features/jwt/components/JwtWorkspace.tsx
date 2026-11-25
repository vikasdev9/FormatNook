'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { JwtTabType } from '../types/jwt.types';
import { decodeJwt } from '../services/jwt-service';

import { JwtOverviewPanel } from './JwtOverviewPanel';
import { JwtHeaderPanel } from './JwtHeaderPanel';
import { JwtPayloadPanel } from './JwtPayloadPanel';
import { JwtExpiryPanel } from './JwtExpiryPanel';
import { JwtSignaturePanel } from './JwtSignaturePanel';
import { JwtReferencePanel } from './JwtReferencePanel';
import { JwtConverterPanel } from './JwtConverterPanel';
import { JwtCleanerPanel } from './JwtCleanerPanel';

import { CopyButton } from '@/components/workspace/CopyButton';
import { ResetButton } from '@/components/workspace/ResetButton';
import {
  FileText,
  Key,
  FileJson,
  Clock,
  Lock,
  BookOpen,
  ArrowRightLeft,
  Sparkles,
  Play,
  ClipboardPaste,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface JwtWorkspaceProps {
  initialTab?: JwtTabType;
}

// Sample dummy test token for initial demonstration (RFC 7519 compliant test token)
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2V5LTAxIn0.eyJpc3MiOiJmb3JtYXRub29rLmNvbSIsInN1YiI6InVzZXJfZGV2Xzg4MiIsImF1ZCI6WyJodHRwczovL2FwaS5mb3JtYXRub29rLmNvbSJdLCJleHAiOjE5MDM2OTg4MDAsIm5iZiI6MTY3MjUzMTIwMCwiaWF0IjoxNjcyNTMxMjAwLCJqdGkiOiJmOGUxMmEtOTYxMiIsIm5hbWUiOiJBZGEgTG92ZWxhY2UiLCJyb2xlcyI6WyJkZXZlbG9wZXIiLCJhZG1pbiJdfQ.4Z3d9kL7S9Y8i2mO0wP4rT6vX8yZ1aC3eE5gG7iI9kM';

export function JwtWorkspace({ initialTab = 'overview' }: JwtWorkspaceProps) {
  const [tokenInput, setTokenInput] = useState<string>(SAMPLE_JWT);
  const [activeTab, setActiveTab] = useState<JwtTabType>(initialTab);
  const [clockSkewSec, setClockSkewSec] = useState<number>(0);

  // Decode result memoized with clock skew
  const decoded = useMemo(
    () => decodeJwt(tokenInput, clockSkewSec),
    [tokenInput, clockSkewSec]
  );

  const handlePaste = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setTokenInput(text.trim());
        }
      }
    } catch {
      // Fallback: user can paste directly into textarea
    }
  }, []);

  const handleClear = useCallback(() => {
    setTokenInput('');
  }, []);

  const tabs: { id: JwtTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview & Claims', icon: <FileText size={15} /> },
    { id: 'header', label: 'Header (JOSE)', icon: <Key size={15} /> },
    { id: 'payload', label: 'Payload JSON', icon: <FileJson size={15} /> },
    { id: 'expiry', label: 'Expiration', icon: <Clock size={15} /> },
    { id: 'signature', label: 'Signature', icon: <Lock size={15} /> },
    { id: 'reference', label: 'Claims Ref', icon: <BookOpen size={15} /> },
    { id: 'converter', label: 'Timestamp Converter', icon: <ArrowRightLeft size={15} /> },
    { id: 'cleaner', label: 'Token Cleaner', icon: <Sparkles size={15} /> },
  ];

  return (
    <div className="jwt-workspace-wrapper" data-testid="jwt-workspace">
      {/* Top Input Section */}
      <div className="jwt-input-card">
        <div className="jwt-input-header">
          <div className="jwt-header-left">
            <span className="jwt-input-title">Encoded Token (Header.Payload.Signature)</span>
            {decoded.isValid ? (
              <span className="badge badge-success" data-testid="badge-jwt-valid">
                <CheckCircle2 size={12} /> Valid Format
              </span>
            ) : tokenInput ? (
              <span className="badge badge-error" data-testid="badge-jwt-invalid">
                <AlertCircle size={12} /> Malformed Token
              </span>
            ) : (
              <span className="badge badge-secondary">Ready for input</span>
            )}
            <span className="badge badge-accent hide-on-mobile">
              {decoded.segments.segmentCount} / 3 segments
            </span>
          </div>

          <div className="jwt-header-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handlePaste}
              title="Paste token from clipboard"
              aria-label="Paste token from clipboard"
              data-testid="btn-paste-jwt"
            >
              <ClipboardPaste size={14} />
              <span className="hide-on-mobile">Paste</span>
            </button>

            <CopyButton text={tokenInput} label="Copy Token" disabled={!tokenInput} />

            <ResetButton onReset={handleClear} label="Clear" disabled={!tokenInput} />
          </div>
        </div>

        <div className="jwt-input-body">
          <textarea
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste standard compact JWT (eyJhbGciOi...)"
            className="jwt-raw-textarea"
            data-testid="jwt-raw-input"
            rows={5}
            spellCheck="false"
          />
        </div>

        {/* Errors list if malformed */}
        {decoded.errors.length > 0 && tokenInput && (
          <div className="jwt-errors-box" data-testid="jwt-errors-container">
            {decoded.errors.map((err, i) => (
              <div key={i} className="jwt-error-line">
                <AlertCircle size={14} />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="workspace-tab-nav" role="tablist" aria-label="JWT Inspection Modules">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab View */}
      <div className="jwt-tab-content">
        {activeTab === 'overview' && <JwtOverviewPanel decoded={decoded} />}
        {activeTab === 'header' && (
          <JwtHeaderPanel
            header={decoded.header}
            headerJson={decoded.headerJson}
            isUnsigned={decoded.isUnsigned}
          />
        )}
        {activeTab === 'payload' && (
          <JwtPayloadPanel payload={decoded.payload} payloadJson={decoded.payloadJson} />
        )}
        {activeTab === 'expiry' && (
          <JwtExpiryPanel
            timestamps={decoded.timestamps}
            clockSkewSec={clockSkewSec}
            onClockSkewChange={setClockSkewSec}
          />
        )}
        {activeTab === 'signature' && (
          <JwtSignaturePanel
            signature={decoded.signature}
            alg={String(decoded.header?.alg || '')}
            isUnsigned={decoded.isUnsigned}
          />
        )}
        {activeTab === 'reference' && <JwtReferencePanel />}
        {activeTab === 'converter' && <JwtConverterPanel />}
        {activeTab === 'cleaner' && <JwtCleanerPanel onApplyToWorkspace={setTokenInput} />}
      </div>
    </div>
  );
}
