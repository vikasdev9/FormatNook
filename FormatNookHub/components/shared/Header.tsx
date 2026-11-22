'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Layers, ShieldCheck } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { ThemeToggle } from './ThemeToggle';
import { CommandMenu } from './CommandMenu';
import { useKeyboardShortcuts } from '@/features/keyboard-shortcuts';

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  // Global Ctrl+K / Cmd+K Search Shortcut
  useKeyboardShortcuts({
    scope: 'global',
    category: 'global',
    bindings: {
      'global-search': () => setIsSearchOpen((prev) => !prev),
    },
  });

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
            <Link href="/category/json" className={`nav-link ${pathname?.includes('/json') ? 'active' : ''}`}>JSON</Link>
            <Link href="/category/xml" className={`nav-link ${pathname?.includes('/xml') ? 'active' : ''}`}>XML</Link>
            <Link href="/category/yaml" className={`nav-link ${pathname?.includes('/yaml') ? 'active' : ''}`}>YAML</Link>
            <Link href="/tools/diff-checker" className={`nav-link ${pathname?.includes('/diff') ? 'active' : ''}`}>Diff Checker</Link>
            <Link href="/tools/encoders-decoders" className={`nav-link ${pathname?.includes('/encoders-decoders') || pathname?.includes('/base64') ? 'active' : ''}`}>Encoders & Decoders</Link>
            <Link href="/category/beautifiers" className={`nav-link ${pathname?.includes('/beautifier') ? 'active' : ''}`}>Beautifiers</Link>
            <Link href="/tools/image-tools" className={`nav-link ${pathname?.includes('/image') ? 'active' : ''}`}>Image Tools</Link>
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
