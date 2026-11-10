import React from 'react';
import { ToolDefinition } from '@/types/tool';
import { ToolFAQ } from './ToolFAQ';

interface ToolDescriptionProps {
  tool: ToolDefinition;
}

export function ToolDescription({ tool }: ToolDescriptionProps) {
  const edu = tool.educationalContent;
  if (!edu) return null;

  return (
    <article className="educational-section" aria-label={`How to use ${tool.name}`}>
      <h2 className="educational-title">About {tool.name}</h2>
      <p className="educational-p">{edu.overview}</p>

      {edu.howTo && edu.howTo.length > 0 && (
        <>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2rem' }}>
            Step-by-Step Usage Guide
          </h3>
          <div className="steps-grid">
            {edu.howTo.map((item) => (
              <div key={item.step} className="step-card">
                <div className="step-number">{item.step}</div>
                <div className="step-title">{item.title}</div>
                <div className="step-desc">{item.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {edu.examples && edu.examples.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Real-World Example
          </h3>
          {edu.examples.map((ex, i) => (
            <div key={i} style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{ex.title}</h4>
              {ex.description && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{ex.description}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)' }}>RAW INPUT</span>
                  <pre style={{ margin: '0.25rem 0 0', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>{ex.input}</pre>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-success)' }}>FORMATTED OUTPUT</span>
                  <pre style={{ margin: '0.25rem 0 0', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>{ex.output}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {edu.faqs && <ToolFAQ faqs={edu.faqs} />}
    </article>
  );
}
