import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { ValidationIssue } from '@/types/tool';

interface ValidationMessageProps {
  isValid: boolean | null;
  issues: ValidationIssue[];
  successMessage?: string;
}

export function ValidationMessage({
  isValid,
  issues,
  successMessage = 'Valid format.',
}: ValidationMessageProps) {
  if (isValid === null) return null;

  if (isValid) {
    return (
      <div className="validation-card valid" role="status">
        <div className="validation-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} />
            <span>Success</span>
          </div>
        </div>
        <div className="validation-card-body">{successMessage}</div>
      </div>
    );
  }

  return (
    <div className="validation-card invalid" role="alert">
      <div className="validation-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>Validation Error</span>
        </div>
      </div>
      <div className="validation-card-body">
        <ul className="validation-issues-list">
          {issues.map((issue, i) => (
            <li key={i} className="validation-issue-item">
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
