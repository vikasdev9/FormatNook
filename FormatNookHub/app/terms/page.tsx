import React from 'react';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Terms of Service - FormatNook',
  description: 'Terms of service and usage guidelines for FormatNook developer utilities.',
};

export default function TermsPage() {
  return (
    <div className="tool-page-wrapper">
      <div className="container" style={{ maxWidth: '800px' }}>
        <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

        <div style={{ marginBottom: '2rem' }}>
          <h1 className="tool-title" style={{ marginBottom: '0.75rem' }}>
            Terms of Service
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Last updated: October 2026
          </p>
        </div>

        <div className="educational-section" style={{ marginTop: 0 }}>
          <h2 className="section-heading-sm" style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
            Terms and Conditions
          </h2>
          <p className="educational-p">
            Welcome to FormatNook. By accessing or using our developer tools, you agree to comply with and be bound by the following terms of use.
          </p>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            1. Provision of Service
          </h3>
          <p className="educational-p">
            FormatNook provides free, client-side developer utilities &quot;as is&quot; without warranties of any kind. While we rigorously test our formatters, validators, and parsers against strict RFC and language standards, you are solely responsible for verifying the output before deploying code to production environments.
          </p>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            2. Intellectual Property
          </h3>
          <p className="educational-p">
            You retain 100% full ownership, rights, and copyright to any code, data, images, or payloads you input or format using our services. FormatNook claims zero ownership over your content.
          </p>
        </div>
      </div>
    </div>
  );
}
