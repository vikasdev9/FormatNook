'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Search, ShieldCheck, Zap } from 'lucide-react';
import { CommandMenu } from '@/components/shared/CommandMenu';

export function HeroSection() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <section className="hero-section">
        <div className="container">
          <div className="hero-pill-badge">
            <Sparkles size={14} />
            <span>Next-Generation Developer Toolkit</span>
          </div>

          <h1 className="hero-title">
            All-in-One Developer Utilities,{' '}
            <span className="hero-gradient-text">100% Private in Your Browser</span>
          </h1>

          <p className="hero-subtitle">
            Format JSON, XML, YAML, beautify SQL, HTML, CSS, JavaScript, and encode/decode Base64.
            High-speed, zero latency, zero server uploads. Your data never leaves your device.
          </p>

          <div className="hero-search-wrapper">
            <div
              className="hero-search-input-box"
              onClick={() => setIsSearchOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsSearchOpen(true)}
            >
              <Search size={20} color="var(--accent-primary)" />
              <input
                type="text"
                className="hero-search-input"
                placeholder="Find any tool (e.g. JSON Formatter, Base64 Image, SQL Beautifier)..."
                readOnly
              />
              <kbd className="search-shortcut-badge" style={{ padding: '0.2rem 0.5rem' }}>
                Ctrl + K
              </kbd>
            </div>
          </div>

          <div className="hero-privacy-badge">
            <ShieldCheck size={18} color="var(--color-success)" />
            <span>Client-side sandbox &bull; No cookies &bull; Free forever</span>
          </div>
        </div>
      </section>

      <CommandMenu isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
