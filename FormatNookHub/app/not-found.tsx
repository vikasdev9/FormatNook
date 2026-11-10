import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="tool-page-wrapper" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="category-card-icon" style={{ margin: '0 auto 1.5rem', width: '56px', height: '56px' }}>
          <Sparkles size={28} />
        </div>
        <h1 className="hero-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Page Not Found (404)
        </h1>
        <p className="hero-subtitle" style={{ marginBottom: '2rem' }}>
          The tool or resource you are looking for doesn&apos;t exist, or has been moved to a new route in the directory.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link href="/" className="btn btn-primary btn-lg">
            <ArrowLeft size={16} />
            <span>Return to Homepage</span>
          </Link>
          <Link href="/#directory" className="btn btn-secondary btn-lg">
            <Search size={16} />
            <span>Browse All Tools</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
