'use client';

import React, { useMemo } from 'react';
import {
  X,
  Cpu,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  FileCode,
  Layers,
  Container,
  Workflow,
  Terminal,
} from 'lucide-react';
import { analyzeYamlConfig } from '../services/yaml-analyzer-service';
import { YAML_SAMPLES, YamlSampleItem } from '../services/yaml-samples';

interface YamlInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  yamlInput: string;
  onLoadSample: (sampleData: string) => void;
}

export function YamlInspectorModal({
  isOpen,
  onClose,
  yamlInput,
  onLoadSample,
}: YamlInspectorModalProps) {
  const analysis = useMemo(() => {
    return analyzeYamlConfig(yamlInput);
  }, [yamlInput]);

  if (!isOpen) return null;

  const getIconForType = () => {
    switch (analysis.type) {
      case 'kubernetes':
        return <Layers size={20} style={{ color: 'var(--accent-primary)' }} />;
      case 'compose':
        return <Container size={20} style={{ color: 'var(--accent-primary)' }} />;
      case 'github-actions':
        return <Workflow size={20} style={{ color: 'var(--accent-primary)' }} />;
      case 'ansible':
        return <Terminal size={20} style={{ color: 'var(--accent-primary)' }} />;
      default:
        return <FileCode size={20} style={{ color: 'var(--accent-primary)' }} />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '840px', width: '95%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Cpu size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Config Inspector & Structural Linter</h3>
          </div>
          <button type="button" className="btn-icon-subtle" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Detected Config Card */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {getIconForType()}
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{analysis.title}</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Detected type: <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{analysis.type}</span>
                </p>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {analysis.summary.documentsCount} {analysis.summary.documentsCount === 1 ? 'Doc' : 'Docs'}
            </span>
          </div>

          {/* Key Details Grid */}
          {analysis.details.length > 0 && (
            <div>
              <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Configuration Details
              </h5>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {analysis.details.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.625rem 0.85rem',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {String(item.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings Section */}
          {analysis.warnings.length > 0 && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#eab308', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                <AlertTriangle size={15} />
                <span>Structural Warnings ({analysis.warnings.length})</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {analysis.warnings.map((w, idx) => (
                  <li key={idx} style={{ marginTop: '0.25rem' }}>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions Section */}
          {analysis.suggestions.length > 0 && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                <Lightbulb size={15} />
                <span>Best Practice Recommendations</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {analysis.suggestions.map((s, idx) => (
                  <li key={idx} style={{ marginTop: '0.25rem' }}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Sample Presets */}
          <div>
            <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Load Standard Developer Samples
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
              {YAML_SAMPLES.map((sample) => (
                <div
                  key={sample.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {sample.category}
                    </span>
                    <h6 style={{ margin: '2px 0 4px', fontSize: '0.8125rem', fontWeight: 600 }}>{sample.name}</h6>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sample.description}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
                    onClick={() => {
                      onLoadSample(sample.data);
                      onClose();
                    }}
                  >
                    Load Sample
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer Note */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
            Note: Structural linting verifies standard field presence client-side without connecting to any external cloud API or Kubernetes cluster.
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

