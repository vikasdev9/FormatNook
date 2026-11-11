'use client';

import React, { useMemo } from 'react';
import { X, Wrench, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { proposeJsonRepair } from '../services/json-service';

interface JsonRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onApplyRepair: (repairedText: string) => void;
}

export function JsonRepairModal({
  isOpen,
  onClose,
  originalText,
  onApplyRepair,
}: JsonRepairModalProps) {
  const proposal = useMemo(() => {
    return proposeJsonRepair(originalText);
  }, [originalText]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyRepair(proposal.repaired);
    onClose();
  };

  return (
    <div
      className="json-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-testid="json-repair-modal"
    >
      <div className="json-modal-card json-repair-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="json-modal-header">
          <div className="json-modal-title">
            <Wrench size={18} className="text-accent" />
            <span>JSON Auto-Repair Preview</span>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="json-modal-body">
          {proposal.changes.length > 0 ? (
            <div className="repair-summary-banner">
              <div className="summary-title">
                <CheckCircle size={15} className="text-success" />
                <span>Detected & Ready to Fix {proposal.changes.length} Syntax Issues:</span>
              </div>
              <ul className="repair-changes-list">
                {proposal.changes.map((change, idx) => (
                  <li key={idx}>{change}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="repair-summary-banner neutral">
              <AlertTriangle size={15} className="text-warning" />
              <span>No obvious structural issues (trailing commas, quotes, or comments) were automatically detected.</span>
            </div>
          )}

          {/* Before & After Comparison */}
          <div className="repair-preview-grid">
            <div className="repair-pane">
              <div className="repair-pane-header">Original (Raw Input)</div>
              <textarea
                className="repair-textarea error-border"
                readOnly
                value={originalText}
                spellCheck="false"
              />
            </div>
            <div className="repair-pane">
              <div className="repair-pane-header">Repaired Output</div>
              <textarea
                className="repair-textarea success-border"
                readOnly
                value={proposal.repaired}
                spellCheck="false"
                data-testid="repair-preview-output"
              />
            </div>
          </div>
        </div>

        <div className="json-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleApply}
            data-testid="confirm-apply-repair-btn"
          >
            <Sparkles size={14} />
            <span>Apply Repaired JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}

