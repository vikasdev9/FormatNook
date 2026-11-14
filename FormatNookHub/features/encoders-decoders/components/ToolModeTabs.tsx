'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  ArrowRightLeft,
  FileText,
  Image as ImageIcon,
  File,
  FileCode,
  Music,
  Video,
  Binary,
  Code,
  Palette,
  Globe,
  Key,
} from 'lucide-react';

export interface Base64FormatItem {
  id: string;
  label: string;
  shortLabel: string;
  category: 'Media & Documents' | 'Text & Code' | 'Security';
  encodeSlug: string;
  decodeSlug: string;
  description: string;
}

export const BASE64_FORMAT_ITEMS: Base64FormatItem[] = [
  // Media & Documents
  {
    id: 'image',
    label: 'Image (PNG, JPG, WebP, SVG, GIF)',
    shortLabel: 'Image',
    category: 'Media & Documents',
    encodeSlug: 'image-to-base64',
    decodeSlug: 'base64-to-image',
    description: 'Convert images to Base64 strings and preview/download decoded images',
  },
  {
    id: 'pdf',
    label: 'PDF Document',
    shortLabel: 'PDF',
    category: 'Media & Documents',
    encodeSlug: 'pdf-to-base64',
    decodeSlug: 'base64-to-pdf',
    description: 'Encode PDF documents or decode Base64 back into viewable PDFs',
  },
  {
    id: 'audio',
    label: 'Audio (MP3, WAV, OGG, AAC)',
    shortLabel: 'Audio',
    category: 'Media & Documents',
    encodeSlug: 'audio-to-base64',
    decodeSlug: 'base64-to-audio',
    description: 'Encode audio files or decode Base64 into an interactive audio player',
  },
  {
    id: 'video',
    label: 'Video (MP4, WebM)',
    shortLabel: 'Video',
    category: 'Media & Documents',
    encodeSlug: 'video-to-base64',
    decodeSlug: 'base64-to-video',
    description: 'Encode video clips or decode Base64 into playable video',
  },
  {
    id: 'file',
    label: 'Any Binary File',
    shortLabel: 'File',
    category: 'Media & Documents',
    encodeSlug: 'file-to-base64',
    decodeSlug: 'base64-to-file',
    description: 'Convert any file to Base64 or decode back into binary with MIME detection',
  },

  // Text & Code
  {
    id: 'text',
    label: 'Plain Text (UTF-8)',
    shortLabel: 'Text',
    category: 'Text & Code',
    encodeSlug: 'text-to-base64',
    decodeSlug: 'base64-to-text',
    description: 'Encode/decode UTF-8 plain text with complete emoji support',
  },
  {
    id: 'html',
    label: 'HTML Document / Snippet',
    shortLabel: 'HTML',
    category: 'Text & Code',
    encodeSlug: 'html-to-base64',
    decodeSlug: 'base64-to-text',
    description: 'Encode HTML source code into Data URIs and iframe embed snippets',
  },
  {
    id: 'css',
    label: 'CSS Stylesheet',
    shortLabel: 'CSS',
    category: 'Text & Code',
    encodeSlug: 'css-to-base64',
    decodeSlug: 'base64-to-text',
    description: 'Convert CSS stylesheets into Base64 Data URIs for inline link tags',
  },
  {
    id: 'url',
    label: 'URL / Web Link',
    shortLabel: 'URL',
    category: 'Text & Code',
    encodeSlug: 'url-to-base64',
    decodeSlug: 'base64-to-text',
    description: 'Encode URL strings into standard or URL-safe Base64',
  },
  {
    id: 'hex',
    label: 'Hexadecimal Bytes',
    shortLabel: 'Hex',
    category: 'Text & Code',
    encodeSlug: 'hex-to-base64',
    decodeSlug: 'base64-to-hex',
    description: 'Convert hexadecimal strings and byte sequences to Base64 and back',
  },

  // Security
  {
    id: 'basic-auth',
    label: 'Basic Authentication',
    shortLabel: 'Basic Auth',
    category: 'Security',
    encodeSlug: 'basic-auth-decoder',
    decodeSlug: 'basic-auth-decoder',
    description: 'Encode username and password credentials or decode HTTP Basic Auth headers',
  },
];

function getFormatIcon(id: string) {
  switch (id) {
    case 'text':
      return FileText;
    case 'image':
      return ImageIcon;
    case 'file':
      return File;
    case 'pdf':
      return FileCode;
    case 'audio':
      return Music;
    case 'video':
      return Video;
    case 'hex':
      return Binary;
    case 'html':
      return Code;
    case 'css':
      return Palette;
    case 'url':
      return Globe;
    case 'basic-auth':
      return Key;
    default:
      return FileText;
  }
}

interface ToolModeTabsProps {
  currentSlug: string;
  pairedSlug?: string;
  pairedName?: string;
  activeDirection: 'encode' | 'decode';
}

export function ToolModeTabs({ currentSlug, pairedSlug, pairedName, activeDirection }: ToolModeTabsProps) {
  const router = useRouter();
  const isEncode = activeDirection === 'encode';

  const activeFormat =
    BASE64_FORMAT_ITEMS.find(
      (item) => item.encodeSlug === currentSlug || item.decodeSlug === currentSlug || item.id === currentSlug
    ) || BASE64_FORMAT_ITEMS[0];

  const effectivePairedSlug =
    pairedSlug || (isEncode ? activeFormat.decodeSlug : activeFormat.encodeSlug);
  const effectivePairedName =
    pairedName || `${activeFormat.shortLabel} ${isEncode ? 'Decoder' : 'Encoder'}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.25rem' }}>
      {/* Top Header Controls: Mode Tabs + Industry Quick Select */}
      <div className="tool-mode-tabs-bar">
        {/* Mode Switcher Tabs */}
        <div className="tool-mode-actions" role="tablist" aria-label="Encoder / Decoder Mode">
          {/* Encoder Mode Button / Link */}
          {isEncode ? (
            <button
              type="button"
              role="tab"
              aria-selected={true}
              className="btn btn-sm btn-primary"
              disabled
              style={{ cursor: 'default' }}
            >
              <Check size={14} />
              <span>Encoder Mode</span>
            </button>
          ) : (
            <Link
              href={`/tools/${effectivePairedSlug}`}
              role="tab"
              aria-selected={false}
              className="btn btn-sm btn-secondary"
              title={`Switch to ${effectivePairedName}`}
            >
              <ArrowRightLeft size={14} />
              <span>Switch to Encoder Mode</span>
            </Link>
          )}

          {/* Decoder Mode Button / Link */}
          {!isEncode ? (
            <button
              type="button"
              role="tab"
              aria-selected={true}
              className="btn btn-sm btn-primary"
              disabled
              style={{ cursor: 'default' }}
            >
              <Check size={14} />
              <span>Decoder Mode</span>
            </button>
          ) : (
            <Link
              href={`/tools/${effectivePairedSlug}`}
              role="tab"
              aria-selected={false}
              className="btn btn-sm btn-secondary"
              title={`Switch to ${effectivePairedName}`}
            >
              <ArrowRightLeft size={14} />
              <span>Switch to Decoder Mode</span>
            </Link>
          )}
        </div>

        {/* Industry-Grade Format Dropdown Selector */}
        <div className="tool-quick-select-wrap">
          <label
            htmlFor="base64-format-select"
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            Quick Select:
          </label>
          <select
            id="base64-format-select"
            className="select-control"
            value={activeFormat.id}
            onChange={(e) => {
              const selected = BASE64_FORMAT_ITEMS.find((item) => item.id === e.target.value);
              if (selected) {
                const target = isEncode ? selected.encodeSlug : selected.decodeSlug;
                router.push(`/tools/${target}`);
              }
            }}
          >
            <optgroup label="Media & Documents">
              {BASE64_FORMAT_ITEMS.filter((i) => i.category === 'Media & Documents').map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Text & Code">
              {BASE64_FORMAT_ITEMS.filter((i) => i.category === 'Text & Code').map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Security">
              {BASE64_FORMAT_ITEMS.filter((i) => i.category === 'Security').map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Visual Format Ribbon */}
      <div className="tool-format-ribbon" aria-label="Base64 Format Selection">
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            marginRight: '0.35rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Formats ({BASE64_FORMAT_ITEMS.length}):
        </span>

        {BASE64_FORMAT_ITEMS.map((item) => {
          const isCurrent = activeFormat.id === item.id;
          const targetSlug = isEncode ? item.encodeSlug : item.decodeSlug;
          const Icon = getFormatIcon(item.id);

          return isCurrent ? (
            <span
              key={item.id}
              className="badge badge-accent"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <Icon size={13} />
              <span>{item.shortLabel}</span>
            </span>
          ) : (
            <Link
              key={item.id}
              href={`/tools/${targetSlug}`}
              className="btn btn-xs btn-ghost"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                padding: '0.25rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
              }}
              title={`Switch to ${item.shortLabel} ${isEncode ? 'Encoder' : 'Decoder'}`}
            >
              <Icon size={13} />
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
