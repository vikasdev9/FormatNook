'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Binary, FileText, CheckCircle2, ShieldCheck, Flame, Clock } from 'lucide-react';
import { toolRegistry } from '@/config/tools';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { IconRenderer } from '@/components/shared/IconRenderer';
import { AdSlot } from '@/components/shared/AdSlot';
import { useToolHistory } from '@/hooks/useToolHistory';

const ENCODER_SLUGS = [
  'text-to-base64',
  'image-to-base64',
  'file-to-base64',
  'pdf-to-base64',
  'audio-to-base64',
  'video-to-base64',
  'hex-to-base64',
  'html-to-base64',
  'css-to-base64',
  'url-to-base64',
];

const DECODER_SLUGS = [
  'base64-to-text',
  'base64-to-image',
  'base64-to-file',
  'base64-to-pdf',
  'base64-to-audio',
  'base64-to-video',
  'base64-to-hex',
  'basic-auth-decoder',
];

export default function EncodersDecodersDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { recentIds } = useToolHistory();

  const allTools = useMemo(() => {
    return toolRegistry.filter((t) =>
      ENCODER_SLUGS.includes(t.slug) || DECODER_SLUGS.includes(t.slug)
    );
  }, []);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return allTools;
    const q = searchQuery.toLowerCase().trim();
    return allTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q)) ||
        t.searchAliases.some((a) => a.toLowerCase().includes(q))
    );
  }, [allTools, searchQuery]);

  const encoders = filteredTools.filter((t) => ENCODER_SLUGS.includes(t.slug));
  const decoders = filteredTools.filter((t) => DECODER_SLUGS.includes(t.slug));

  // Filter out sensitive tools (like basic-auth-decoder) from recent tools display
  const recentTools = allTools.filter(
    (t) => recentIds.includes(t.id) && t.slug !== 'basic-auth-decoder'
  );

  return (
    <div className="tool-page-wrapper">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Tools Directory', href: '/#directory' },
            { label: 'Encoders & Decoders' },
          ]}
        />

        {/* Header Section */}
        <div className="tool-header">
          <div className="tool-header-top">
            <div className="tool-header-meta">
              <div className="tool-header-icon">
                <Binary size={28} />
              </div>
              <div className="tool-header-title-wrap">
                <h1 className="tool-title">Encoders & Decoders</h1>
                <p className="tool-subtitle">
                  Comprehensive suite of client-side Base64, Hexadecimal, Binary File, and Basic Auth transformation utilities.
                  Encode and decode text, images, media, and documents directly inside your browser with 100% data privacy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Privacy Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            margin: '1.5rem 0 2rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search encoders & decoders (e.g. Hex, PDF, Audio, Video)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="select-control"
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                height: '42px',
                borderRadius: 'var(--radius-full)',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-success)' }}>
            <ShieldCheck size={18} />
            <span>Zero Server Transmission &bull; 100% Client-Side Processing</span>
          </div>
        </div>

        <AdSlot placement="tool-top" slotId="encoders-top-ad" />

        {/* Recently Used Section (If any) */}
        {recentTools.length > 0 && !searchQuery && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 className="section-heading-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--accent-primary)" />
              <span>Recently Used Encoding Tools</span>
            </h2>
            <div className="tool-cards-grid">
              {recentTools.slice(0, 4).map((tool) => (
                <Link key={tool.id} href={tool.route} className="tool-card">
                  <div className="tool-card-icon">
                    <IconRenderer name={tool.icon} size={22} />
                  </div>
                  <div className="tool-card-title">{tool.name}</div>
                  <div className="tool-card-desc">{tool.description}</div>
                  <div className="tool-card-footer">
                    <span className="badge badge-accent" style={{ fontSize: '0.6875rem' }}>
                      RECENT
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                      Open <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Decoders Section */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 className="section-heading-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Decoder Utilities</span>
              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                {decoders.length} Tools
              </span>
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Decode Base64 and authorization payloads back into plain text, hexadecimal bytes, audio, video, images, PDFs, and binary files.
            </p>
          </div>

          <div className="tool-cards-grid">
            {decoders.map((tool) => (
              <Link key={tool.id} href={tool.route} className="tool-card">
                <div className="tool-card-icon">
                  <IconRenderer name={tool.icon} size={22} />
                </div>
                <div className="tool-card-title">{tool.name}</div>
                <div className="tool-card-desc">{tool.description}</div>
                <div className="tool-card-footer">
                  <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                    <CheckCircle2 size={12} /> Available
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                    Launch <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Encoders Section */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 className="section-heading-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Encoder Utilities</span>
              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                {encoders.length} Tools
              </span>
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Convert text, files, images, documents, audio, and video into standard Base64 strings and HTML/CSS Data URIs.
            </p>
          </div>

          <div className="tool-cards-grid">
            {encoders.map((tool) => (
              <Link key={tool.id} href={tool.route} className="tool-card">
                <div className="tool-card-icon">
                  <IconRenderer name={tool.icon} size={22} />
                </div>
                <div className="tool-card-title">{tool.name}</div>
                <div className="tool-card-desc">{tool.description}</div>
                <div className="tool-card-footer">
                  <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                    <CheckCircle2 size={12} /> Available
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                    Launch <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <AdSlot placement="tool-bottom" slotId="encoders-bottom-ad" />
      </div>
    </div>
  );
}
