import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Heart } from 'lucide-react';
import { siteConfig } from '@/config/site';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo" aria-label="FormatNook Home">
              <span className="logo-icon footer-logo-icon">
                <img
                  src="/brand-icon.png"
                  alt="FormatNook Brand Icon"
                  width={28}
                  height={28}
                  className="logo-image footer-logo-image"
                />
              </span>
              <span>{siteConfig.name}</span>
            </Link>
            <p className="footer-brand-p">
              {siteConfig.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-success)' }}>
              <Shield size={16} />
              <span>100% Private Client-Side Processing</span>
            </div>
          </div>

          <div>
            <h4 className="footer-title">Popular Tools</h4>
            <ul className="footer-links">
              <li><Link href="/tools/diff-checker" className="footer-link">Diff Checker</Link></li>
              <li><Link href="/tools/json-formatter" className="footer-link">JSON Formatter</Link></li>
              <li><Link href="/tools/json-validator" className="footer-link">JSON Validator</Link></li>
              <li><Link href="/tools/xml-formatter" className="footer-link">XML Beautifier</Link></li>
              <li><Link href="/tools/yaml-formatter" className="footer-link">YAML Formatter</Link></li>
              <li><Link href="/tools/sql-formatter" className="footer-link">SQL Formatter</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Categories</h4>
            <ul className="footer-links">
              <li><Link href="/category/text" className="footer-link">Text & Diff Tools</Link></li>
              <li><Link href="/category/json" className="footer-link">JSON Utilities</Link></li>
              <li><Link href="/category/xml" className="footer-link">XML Tools</Link></li>
              <li><Link href="/category/yaml" className="footer-link">YAML Tools</Link></li>
              <li><Link href="/category/base64" className="footer-link">Base64 Suite</Link></li>
              <li><Link href="/category/beautifiers" className="footer-link">Code Beautifiers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-links">
              <li><Link href="/privacy" className="footer-link">Privacy Policy</Link></li>
              <li><Link href="/terms" className="footer-link">Terms of Service</Link></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub Repository</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Built for developers with privacy and speed.
          </div>
        </div>
      </div>
    </footer>
  );
}
