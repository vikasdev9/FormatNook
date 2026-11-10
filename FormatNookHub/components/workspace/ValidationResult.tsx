import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ValidationIssue } from '@/types/tool';

interface ValidationResultProps {
  isValid: boolean | null;
  issues: ValidationIssue[];
  successMessage?: string;
}

export function ValidationResult({
  isValid,
  issues,
  successMessage = 'Validation Successful: Document syntax is clean and well-formed.',
}: ValidationResultProps) {
  if (isValid === null) return null;

  if (isValid) {
    return (
      <div className="validation-card valid" role="status">
        <div className="validation-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>Valid Document</span>
          </div>
          <span className="badge badge-success">0 Errors</span>
        </div>
        <div className="validation-card-body">{successMessage}</div>
      </div>
    );
  }

  return (
    <div className="validation-card invalid" role="alert">
      <div className="validation-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>Syntax Error Detected</span>
        </div>
        <span className="badge badge-error">{issues.length} {issues.length === 1 ? 'Issue' : 'Issues'}</span>
      </div>
      <div className="validation-card-body">
        <ul className="validation-issues-list">
          {issues.map((issue, idx) => (
            <li key={idx} className="validation-issue-item">
              <span style={{ fontWeight: 600 }}>
                {issue.line ? `[Line ${issue.line}${issue.column ? `:${issue.column}` : ''}] ` : ''}
              </span>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
