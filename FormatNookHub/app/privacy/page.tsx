import React from 'react';
import { Metadata } from 'next';
import { Shield, Lock, EyeOff, ServerOff } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Privacy Policy - FormatNook',
  description: 'FormatNook is built on a 100% client-side privacy architecture. Your code and data never leave your browser.',
};

export default function PrivacyPage() {
  return (
    <div className="tool-page-wrapper">
      <div className="container" style={{ maxWidth: '800px' }}>
        <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

        <div style={{ marginBottom: '2rem' }}>
          <h1 className="tool-title" style={{ marginBottom: '0.75rem' }}>
            Privacy Policy
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
            Last updated: October 2026
          </p>
        </div>

        <div className="educational-section" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--color-success)' }}>
            <Shield size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              100% Client-Side Privacy Guarantee
            </h2>
          </div>

          <p className="educational-p">
            At FormatNook, we believe developer tools should never compromise your code or security. Unlike traditional online utility websites that upload your JSON payloads, SQL queries, or sensitive tokens to remote servers for processing, <strong>FormatNook operates entirely in your local browser sandbox</strong>.
          </p>

          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            1. Zero Server Uploads
          </h3>
          <p className="educational-p">
            When you paste or drag-and-drop code into our formatters, beautifiers, or Base64 converters, the transformations are executed directly by your machine&apos;s CPU using client-side JavaScript. No payload data is ever sent across the network, stored in databases, or logged on our servers.
          </p>

          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            2. Local Storage Usage
          </h3>
          <p className="educational-p">
            To provide features like &quot;Recently Used Tools&quot;, &quot;Favorite Tools&quot;, and theme preferences (Light/Dark mode), we save small string identifiers locally on your device via standard browser <code>localStorage</code>. This data never leaves your computer.
          </p>

          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            3. Advertising & Analytics
          </h3>
          <p className="educational-p">
            To sustainably support free access to our tools, FormatNook may display non-intrusive advertisements (such as Google AdSense). Advertisers may use standard browser cookies according to their respective privacy policies. Ads are isolated and never have access to the contents of your editing workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
