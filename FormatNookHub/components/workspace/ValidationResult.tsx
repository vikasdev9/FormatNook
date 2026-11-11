import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Wrench } from 'lucide-react';
import { ValidationIssue } from '@/types/tool';

interface ValidationResultProps {
  isValid: boolean | null;
  issues: ValidationIssue[];
  successMessage?: string;
  onOpenRepair?: () => void;
  isOutdated?: boolean;
}

export function ValidationResult({
  isValid,
  issues,
  successMessage = 'Validation Successful: Document syntax is clean and well-formed.',
  onOpenRepair,
  isOutdated = false,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isOutdated && <span className="badge badge-warning" data-testid="output-outdated-badge">Output Outdated</span>}
            <span className="badge badge-success">0 Errors</span>
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
          <AlertCircle size={18} />
          <span>Syntax Error Detected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onOpenRepair && (
            <button
              type="button"
              className="btn btn-primary btn-xs"
              onClick={onOpenRepair}
              title="Review and apply automated syntax fixes"
              data-testid="error-banner-repair-btn"
            >
              <Wrench size={13} />
              <span>Auto-Repair Syntax</span>
            </button>
          )}
          <span className="badge badge-error">{issues.length} {issues.length === 1 ? 'Issue' : 'Issues'}</span>
        </div>
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
