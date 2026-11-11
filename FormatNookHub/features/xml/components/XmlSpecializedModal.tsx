'use client';

import React, { useMemo } from 'react';
import {
  X,
  Cpu,
  Layers,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { analyzeSpecializedXml } from '../services/xml-specialized-service';
import { XML_SAMPLES } from '../services/xml-samples';

interface XmlSpecializedModalProps {
  isOpen: boolean;
  onClose: () => void;
  xmlInput: string;
  onLoadSample: (sampleData: string) => void;
}

export function XmlSpecializedModal({
  isOpen,
  onClose,
  xmlInput,
  onLoadSample,
}: XmlSpecializedModalProps) {
  const specialized = useMemo(() => {
    return analyzeSpecializedXml(xmlInput);
  }, [xmlInput]);

  if (!isOpen) return null;

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
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>SOAP / WSDL / XSD Specialized Inspector</h3>
          </div>
          <button type="button" className="btn-icon-subtle" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Analysis Banner */}
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
              <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                  {specialized.detectedType === 'soap' && `SOAP ${specialized.soap?.version} Envelope`}
                  {specialized.detectedType === 'wsdl' && 'WSDL Web Service Definition'}
                  {specialized.detectedType === 'xsd' && 'XML Schema Definition (XSD)'}
                  {specialized.detectedType === 'standard' && 'Standard XML Document'}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {specialized.detectedType === 'soap' && 'Web service messaging protocol envelope with body/header detection.'}
                  {specialized.detectedType === 'wsdl' && 'Interface and operations specification for network services.'}
                  {specialized.detectedType === 'xsd' && 'W3C XML Schema describing element types and restrictions.'}
                  {specialized.detectedType === 'standard' && 'Standard markup document (not identified as SOAP, WSDL, or XSD).'}
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
                textTransform: 'uppercase',
              }}
            >
              {specialized.detectedType}
            </span>
          </div>

          {/* SOAP Inspector */}
          {specialized.soap && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h5 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>SOAP Breakdown</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Protocol Version</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '2px' }}>SOAP {specialized.soap.version}</div>
                </div>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SOAP Header</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '2px' }}>{specialized.soap.hasHeader ? 'Present' : 'None'}</div>
                </div>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SOAP Body</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '2px' }}>{specialized.soap.hasBody ? 'Present' : 'Missing'}</div>
                </div>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SOAP Fault</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: specialized.soap.hasFault ? 'var(--status-error)' : 'var(--text-primary)', marginTop: '2px' }}>
                    {specialized.soap.hasFault ? 'Fault Detected' : 'No Fault'}
                  </div>
                </div>
              </div>

              {specialized.soap.faultDetails && (
                <div style={{ padding: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--status-error)', fontSize: '0.8125rem', marginBottom: '4px' }}>
                    Fault Details:
                  </div>
                  {specialized.soap.faultDetails.faultCode && (
                    <div style={{ fontSize: '0.8125rem' }}>Code: <code>{specialized.soap.faultDetails.faultCode}</code></div>
                  )}
                  {specialized.soap.faultDetails.faultString && (
                    <div style={{ fontSize: '0.8125rem', marginTop: '2px' }}>Reason: {specialized.soap.faultDetails.faultString}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WSDL Inspector */}
          {specialized.wsdl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h5 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>WSDL Web Service Structure</h5>
              {specialized.wsdl.targetNamespace && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Target Namespace: <code>{specialized.wsdl.targetNamespace}</code>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Services</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{specialized.wsdl.services.length} ({specialized.wsdl.services.join(', ') || '—'})</div>
                </div>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Operations</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{specialized.wsdl.operations.length}</div>
                </div>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Port Types</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{specialized.wsdl.portTypes.length}</div>
                </div>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bindings</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{specialized.wsdl.bindings.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* XSD Inspector */}
          {specialized.xsd && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h5 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>XML Schema (XSD) Types</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Declared Elements</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{specialized.xsd.elements.length}</div>
                </div>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Complex Types</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{specialized.xsd.complexTypes.length}</div>
                </div>
                <div style={{ padding: '0.625rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simple Types</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{specialized.xsd.simpleTypes.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Sample Presets */}
          <div>
            <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Load Enterprise XML Samples
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
              {XML_SAMPLES.map((sample) => (
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
                    {sample.description && (
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sample.description}</p>
                    )}
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
