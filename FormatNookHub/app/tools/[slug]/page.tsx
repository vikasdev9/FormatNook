import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { toolRegistry, getToolBySlug } from '@/config/tools';
import { siteConfig } from '@/config/site';
import { ToolPageLayout } from '@/components/workspace/ToolPageLayout';

// Feature Workspaces
import { JsonWorkspace } from '@/features/json';
import { XmlWorkspace } from '@/features/xml';
import { YamlWorkspace } from '@/features/yaml';
import { BeautifierWorkspace } from '@/features/beautifiers';
import { EncoderDecoderWorkspace, BasicAuthWorkspace } from '@/features/encoders-decoders';
import { TextDiffWorkspace } from '@/features/diff';

interface ToolPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return toolRegistry
    .filter((t) => t.status === 'implemented')
    .map((t) => ({
      slug: t.slug,
    }));
}

export function generateMetadata({ params }: ToolPageProps): Metadata {
  const tool = getToolBySlug(params.slug);
  if (!tool) {
    return {
      title: 'Tool Not Found - FormatNook',
    };
  }

  const toolUrl = `${siteConfig.url}${tool.route}`;

  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    keywords: tool.keywords,
    alternates: {
      canonical: toolUrl,
    },
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      url: toolUrl,
      type: 'article',
      siteName: siteConfig.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.seoTitle,
      description: tool.seoDescription,
    },
  };
}

export default function ToolPage({ params }: ToolPageProps) {
  const tool = getToolBySlug(params.slug);

  if (!tool || tool.status !== 'implemented') {
    notFound();
  }

  const renderToolWorkspace = () => {
    switch (tool.slug) {
      // JSON Tools
      case 'json-formatter':
        return <JsonWorkspace initialMode="format" />;
      case 'json-validator':
        return <JsonWorkspace initialMode="validate" />;
      case 'json-minifier':
        return <JsonWorkspace initialMode="minify" />;

      // XML Tools
      case 'xml-formatter':
        return <XmlWorkspace initialMode="format" />;
      case 'xml-validator':
        return <XmlWorkspace initialMode="validate" />;

      // YAML Tools
      case 'yaml-formatter':
        return <YamlWorkspace initialMode="format" />;
      case 'yaml-validator':
        return <YamlWorkspace initialMode="validate" />;

      // Base64 Tools
      case 'text-to-base64':
        return (
          <EncoderDecoderWorkspace
            toolId="text-to-base64"
            direction="encode"
            pairedSlug="base64-to-text"
            pairedName="Base64 to Text"
            defaultSample="Hello, FormatNook Developer! 🚀"
            outputFileName="text-base64.txt"
          />
        );
      case 'base64-to-text':
        return (
          <EncoderDecoderWorkspace
            toolId="base64-to-text"
            direction="decode"
            pairedSlug="text-to-base64"
            pairedName="Text to Base64"
            defaultSample="SGVsbG8sIEZvcm1hdE5vb2sgRGV2ZWxvcGVyISDwn5mA"
            outputFileName="decoded-text.txt"
          />
        );
      case 'image-to-base64':
        return (
          <EncoderDecoderWorkspace
            toolId="image-to-base64"
            direction="encode"
            pairedSlug="base64-to-image"
            pairedName="Base64 to Image"
            acceptedExtensions={['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']}
            fileCategory="image"
            outputFileName="image-base64.txt"
            mimeType="image/png"
          />
        );
      case 'base64-to-image':
        return (
          <EncoderDecoderWorkspace
            toolId="base64-to-image"
            direction="decode"
            pairedSlug="image-to-base64"
            pairedName="Image to Base64"
            acceptedExtensions={['.txt', '.b64']}
            fileCategory="image"
            outputFileName="decoded-image.png"
            mimeType="image/png"
            defaultSample="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          />
        );

      // Extended Encoders & Decoders Suite
      case 'file-to-base64':
        return (
          <EncoderDecoderWorkspace
            toolId="file-to-base64"
            direction="encode"
            pairedSlug="base64-to-file"
            pairedName="Base64 to File"
            outputFileName="file-base64.txt"
          />
        );
      case 'base64-to-file':
        return (
          <EncoderDecoderWorkspace
            toolId="base64-to-file"
            direction="decode"
            pairedSlug="file-to-base64"
            pairedName="File to Base64"
            outputFileName="decoded.bin"
          />
        );
      case 'hex-to-base64':
        return (
          <EncoderDecoderWorkspace
            toolId="hex-to-base64"
            direction="encode"
            pairedSlug="base64-to-hex"
            pairedName="Base64 to Hex"
            defaultSample="48 65 6c 6c 6f 2c 20 57 6f 72 6c 64 21"
            outputFileName="hex-base64.txt"
          />
        );
      case 'base64-to-hex':
        return (
          <EncoderDecoderWorkspace
            toolId="base64-to-hex"
            direction="decode"
            pairedSlug="hex-to-base64"
            pairedName="Hex to Base64"
            defaultSample="SGVsbG8sIFdvcmxkIQ=="
            outputFileName="decoded-hex.txt"
          />
        );
      case 'pdf-to-base64':
        return (
          <EncoderDecoderWorkspace
            toolId="pdf-to-base64"
            direction="encode"
            pairedSlug="base64-to-pdf"
            pairedName="Base64 to PDF"
            acceptedExtensions={['.pdf']}
            fileCategory="pdf"
            outputFileName="pdf-base64.txt"
            mimeType="application/pdf"
          />
        );
      case 'base64-to-pdf':
        return (
          <EncoderDecoderWorkspace
            toolId="base64-to-pdf"
            direction="decode"
            pairedSlug="pdf-to-base64"
            pairedName="PDF to Base64"
            acceptedExtensions={['.txt', '.b64']}
            fileCategory="pdf"
            outputFileName="decoded.pdf"
            mimeType="application/pdf"
            defaultSample="JVBERi0xLjUKJcfsj6IKNCAwIG9iai..."
          />
        );
      case 'audio-to-base64':
        return (
          <EncoderDecoderWorkspace
            toolId="audio-to-base64"
            direction="encode"
            pairedSlug="base64-to-audio"
            pairedName="Base64 to Audio"
            acceptedExtensions={['.mp3', '.wav', '.ogg', '.aac', '.m4a']}
            fileCategory="audio"
            outputFileName="audio-base64.txt"
            mimeType="audio/mpeg"
          />
        );
      case 'base64-to-audio':
        return (
          <EncoderDecoderWorkspace
            toolId="base64-to-audio"
            direction="decode"
            pairedSlug="audio-to-base64"
            pairedName="Audio to Base64"
            acceptedExtensions={['.txt', '.b64']}
            fileCategory="audio"
            outputFileName="decoded-audio.mp3"
            mimeType="audio/mpeg"
          />
        );
      case 'video-to-base64':
        return (
          <EncoderDecoderWorkspace
            toolId="video-to-base64"
            direction="encode"
            pairedSlug="base64-to-video"
            pairedName="Base64 to Video"
            acceptedExtensions={['.mp4', '.webm', '.ogv']}
            fileCategory="video"
            outputFileName="video-base64.txt"
            mimeType="video/mp4"
          />
        );
      case 'base64-to-video':
        return (
          <EncoderDecoderWorkspace
            toolId="base64-to-video"
            direction="decode"
            pairedSlug="video-to-base64"
            pairedName="Video to Base64"
            acceptedExtensions={['.txt', '.b64']}
            fileCategory="video"
            outputFileName="decoded-video.mp4"
            mimeType="video/mp4"
          />
        );
      case 'html-to-base64':
        return (
          <EncoderDecoderWorkspace
            toolId="html-to-base64"
            direction="encode"
            pairedSlug="base64-to-text"
            pairedName="Base64 to Text"
            defaultSample={'<div class="card">\n  <h1>Hello FormatNook</h1>\n  <p>Self-contained HTML document.</p>\n</div>'}
            outputFileName="html-base64.txt"
            mimeType="text/html"
          />
        );
      case 'css-to-base64':
        return (
          <EncoderDecoderWorkspace
            toolId="css-to-base64"
            direction="encode"
            pairedSlug="base64-to-text"
            pairedName="Base64 to Text"
            defaultSample={'.card {\n  display: flex;\n  padding: 1.5rem;\n  border-radius: 12px;\n  background: #0f172a;\n}'}
            outputFileName="css-base64.txt"
            mimeType="text/css"
          />
        );
      case 'url-to-base64':
        return (
          <EncoderDecoderWorkspace
            toolId="url-to-base64"
            direction="encode"
            pairedSlug="base64-to-text"
            pairedName="Base64 to Text"
            defaultSample="https://formatnook.com/callback?auth=true&session=123"
            outputFileName="url-base64.txt"
          />
        );
      case 'basic-auth-decoder':
        return <BasicAuthWorkspace />;

      // Code Beautifiers
      case 'html-formatter':
        return (
          <BeautifierWorkspace
            language="html"
            defaultSample={'<!DOCTYPE html><html><head><title>Demo</title></head><body><main class="container"><h1>Hello FormatNook</h1><p>Fast, clean HTML formatting.</p></main></body></html>'}
            outputFileName="formatted.html"
            mimeType="text/html"
            fileExtensions={['.html', '.htm', '.txt']}
          />
        );
      case 'css-formatter':
        return (
          <BeautifierWorkspace
            language="css"
            defaultSample={".hero-banner{display:flex;align-items:center;justify-content:center;padding:2rem;background:#0f172a;border-radius:12px;color:#fff;}.hero-title{font-size:2rem;font-weight:700;}"}
            outputFileName="formatted.css"
            mimeType="text/css"
            fileExtensions={['.css', '.scss', '.less', '.txt']}
          />
        );
      case 'javascript-formatter':
        return (
          <BeautifierWorkspace
            language="javascript"
            defaultSample={"function processUserData(user,options={}){if(!user||!user.id)return null;const sanitized={id:user.id,name:user.name.trim(),active:Boolean(user.active)};return sanitized;}"}
            outputFileName="formatted.js"
            mimeType="application/javascript"
            fileExtensions={['.js', '.mjs', '.ts', '.jsx', '.tsx', '.txt']}
          />
        );
      case 'sql-formatter':
        return (
          <BeautifierWorkspace
            language="sql"
            defaultSample={"select u.id, u.username, u.email, count(o.id) as total_orders from users u left join orders o on u.id = o.user_id where u.active = 1 and u.created_at >= '2025-01-01' group by u.id, u.username, u.email order by total_orders desc limit 50;"}
            outputFileName="formatted.sql"
            mimeType="application/sql"
            fileExtensions={['.sql', '.txt']}
          />
        );

      // Text Comparison / Diff Checker
      case 'diff-checker':
      case 'text-compare':
      case 'text-diff':
        return <TextDiffWorkspace />;

      default:
        return <div>Tool implementation pending.</div>;
    }
  };

  return (
    <ToolPageLayout tool={tool}>
      <React.Fragment key={tool.slug}>
        {renderToolWorkspace()}
      </React.Fragment>
    </ToolPageLayout>
  );
}
