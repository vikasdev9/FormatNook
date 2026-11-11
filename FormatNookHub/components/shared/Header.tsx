'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Layers, ShieldCheck } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { ThemeToggle } from './ThemeToggle';
import { CommandMenu } from './CommandMenu';

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <div className="logo-group">
            <Link href="/" className="logo" aria-label="FormatNook Hub Home">
              <span className="logo-icon">
                <img
                  src="/brand-icon.png"
                  alt="FormatNook Brand Icon"
                  width={34}
                  height={34}
                  className="logo-image"
                />
              </span>
              <span>{siteConfig.name}</span>
              <span className="logo-badge">Hub</span>
            </Link>
          </div>

          <nav className="header-nav">
            <Link href="/category/json" className="nav-link">JSON</Link>
            <Link href="/category/xml" className="nav-link">XML</Link>
            <Link href="/category/yaml" className="nav-link">YAML</Link>
            <Link href="/tools/diff-checker" className="nav-link">Diff Checker</Link>
            <Link href="/tools/encoders-decoders" className="nav-link">Encoders & Decoders</Link>
            <Link href="/category/beautifiers" className="nav-link">Beautifiers</Link>
          </nav>

          <div className="header-actions">
            <button
              className="search-trigger-btn"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search dialog"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={14} />
                <span className="search-trigger-label">Search utilities...</span>
              </div>
              <kbd className="search-shortcut-badge">Ctrl+K</kbd>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <CommandMenu isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
