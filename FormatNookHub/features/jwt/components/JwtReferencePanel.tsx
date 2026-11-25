'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';

export function JwtReferencePanel() {
  const standardClaims = [
    { claim: 'iss', name: 'Issuer', type: 'StringOrURI', desc: 'Identifies the principal that issued the JWT (e.g. https://auth.example.com).' },
    { claim: 'sub', name: 'Subject', type: 'StringOrURI', desc: 'Identifies the principal that is the subject of the JWT (e.g. user ID 42).' },
    { claim: 'aud', name: 'Audience', type: 'StringOrURI[]', desc: 'Identifies the recipients that the JWT is intended for (e.g. https://api.example.com).' },
    { claim: 'exp', name: 'Expiration Time', type: 'NumericDate (sec)', desc: 'Identifies the expiration time on or after which the JWT MUST NOT be accepted.' },
    { claim: 'nbf', name: 'Not Before', type: 'NumericDate (sec)', desc: 'Identifies the time before which the JWT MUST NOT be accepted for processing.' },
    { claim: 'iat', name: 'Issued At', type: 'NumericDate (sec)', desc: 'Identifies the time at which the JWT was issued. Can be used to determine age.' },
    { claim: 'jti', name: 'JWT ID', type: 'String', desc: 'Provides a unique identifier for the JWT. Often used to prevent token replay attacks.' },
  ];

  return (
    <div className="jwt-panel-container" data-testid="jwt-reference-panel">
      <div className="jwt-claims-card">
        <div className="claims-card-header">
          <div className="code-header-meta">
            <BookOpen size={16} className="text-accent-icon" />
            <span className="claims-card-title">RFC 7519 Standard Registered Claims Reference</span>
          </div>
        </div>

        <div className="claims-table-wrap">
          <table className="jwt-claims-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Claim</th>
                <th style={{ width: '160px' }}>Name</th>
                <th style={{ width: '140px' }}>Format</th>
                <th>RFC 7519 Description</th>
              </tr>
            </thead>
            <tbody>
              {standardClaims.map((item) => (
                <tr key={item.claim}>
                  <td className="claim-key-cell">
                    <code>{item.claim}</code>
                  </td>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>
                    <span className="text-muted">{item.type}</span>
                  </td>
                  <td className="claim-desc-cell">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
