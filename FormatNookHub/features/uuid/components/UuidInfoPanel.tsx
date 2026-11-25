'use client';

import React from 'react';
import { ShieldCheck, Info, Sparkles, Hash } from 'lucide-react';

export function UuidInfoPanel() {
  return (
    <div className="uuid-info-container" data-testid="uuid-info-panel">
      {/* Anatomy Diagram */}
      <div className="uuid-anatomy-card">
        <div className="anatomy-header">
          <Hash size={18} className="text-accent-icon" />
          <span className="anatomy-title">UUID v4 RFC 4122 Structure</span>
        </div>
        <div className="anatomy-diagram">
          <code className="anatomy-code">
            <span className="part-time">xxxxxxxx</span>-<span className="part-time">xxxx</span>-
            <span className="part-ver">4xxx</span>-<span className="part-var">yxxx</span>-
            <span className="part-node">xxxxxxxxxxxx</span>
          </code>
        </div>
        <div className="anatomy-legend">
          <div className="legend-item">
            <span className="legend-dot dot-ver" />
            <span>
              <strong>Version (4):</strong> Fixed digit <code>4</code> (binary <code>0100</code>) indicating random UUID.
            </span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-var" />
            <span>
              <strong>Variant (y):</strong> One of <code>8</code>, <code>9</code>, <code>a</code>, or <code>b</code> (binary <code>10xx</code>), indicating RFC 4122 / DCE 1.1 format.
            </span>
          </div>
          <div className="legend-item">
            <span className="legend-dot dot-random" />
            <span>
              <strong>Random Bits:</strong> Exactly 122 bits of cryptographically secure random entropy.
            </span>
          </div>
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="uuid-specs-grid">
        <div className="spec-card">
          <span className="spec-label">Total Bit Length</span>
          <span className="spec-val">128 bits</span>
          <span className="spec-sub">16 octets / bytes</span>
        </div>
        <div className="spec-card">
          <span className="spec-label">Hexadecimal Length</span>
          <span className="spec-val">32 chars</span>
          <span className="spec-sub">36 chars including 4 hyphens</span>
        </div>
        <div className="spec-card">
          <span className="spec-label">Random Entropy</span>
          <span className="spec-val">122 bits</span>
          <span className="spec-sub">2^122 unique permutations</span>
        </div>
        <div className="spec-card">
          <span className="spec-label">Randomness Source</span>
          <span className="spec-val text-success">CSPRNG</span>
          <span className="spec-sub">crypto.randomUUID / getRandomValues</span>
        </div>
      </div>

      {/* Collision Probability Note */}
      <div className="uuid-collision-card">
        <div className="collision-header">
          <ShieldCheck size={18} className="text-success" />
          <span className="collision-title">Collision Probability & Uniqueness</span>
        </div>
        <p className="collision-text">
          UUIDs are not mathematically guaranteed to be strictly unique, but collisions are astronomically unlikely.
          With 122 bits of random entropy, there are approximately <strong>5.3 × 10³⁶</strong> possible UUIDs.
        </p>
        <p className="collision-sub">
          To have a 50% chance of a single collision (the birthday paradox), you would need to generate approximately
          <strong> 2.71 quintillion UUIDs</strong> (2.71 × 10¹⁸). Even generating 1 billion UUIDs every second for 85 years
          would yield less than a one in a billion collision probability.
        </p>
      </div>
    </div>
  );
}
