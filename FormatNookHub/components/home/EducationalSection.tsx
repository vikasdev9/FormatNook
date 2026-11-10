import React from 'react';
import { Shield, Zap, Lock, Terminal, Sparkles, Laptop } from 'lucide-react';

export function EducationalSection() {
  return (
    <section className="home-section" aria-label="Why Choose FormatNook">
      <div className="container">
        <div className="home-section-header">
          <div className="home-section-title-wrap">
            <h2 className="home-section-title">Built with Zero Compromises</h2>
            <p className="home-section-desc">Why engineering teams trust FormatNook for their daily workflow.</p>
          </div>
        </div>

        <div className="value-props-grid">
          <div className="value-prop-card">
            <div className="value-prop-icon">
              <Lock size={22} />
            </div>
            <h3 className="value-prop-title">100% Client-Side Privacy</h3>
            <p className="value-prop-desc">
              Your source code, JSON logs, SQL queries, and Base64 payloads are processed entirely inside your local browser runtime. Zero data is transmitted to external servers or logged.
            </p>
          </div>

          <div className="value-prop-card">
            <div className="value-prop-icon" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
              <Zap size={22} />
            </div>
            <h3 className="value-prop-title">Instantaneous Execution</h3>
            <p className="value-prop-desc">
              No server cold starts, network latency, or API quotas. Tools run on optimized JavaScript parsers with instant reactivity as you type, paste, or drag and drop.
            </p>
          </div>

          <div className="value-prop-card">
            <div className="value-prop-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
              <Terminal size={22} />
            </div>
            <h3 className="value-prop-title">Strict Spec Compliance</h3>
            <p className="value-prop-desc">
              From RFC 8259 JSON validation to standard YAML 1.2 parsing and ANSI SQL formatting, our utilities uphold strict language specifications with pinpoint error line locations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
