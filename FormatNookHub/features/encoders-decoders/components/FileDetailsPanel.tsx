'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileCode, Info } from 'lucide-react';
import { DetailedFileMetadata } from '../types/file-metadata.types';

interface FileDetailsPanelProps {
  metadata: DetailedFileMetadata | null;
  defaultExpanded?: boolean;
}

export function FileDetailsPanel({
  metadata,
  defaultExpanded = false,
}: FileDetailsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!metadata) return null;

  const { summary, sourceGroups, outputGroups, notes } = metadata;
  const hasDetails = sourceGroups.length > 0 || outputGroups.length > 0;

  if (!hasDetails) return null;

  return (
    <div className="file-details-container">
      {/* Header bar / Compact summary */}
      <div
        className="file-details-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="file-details-title-wrap">
          <div className="file-details-title">
            <FileCode size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>File Details</span>
          </div>

          {/* Quick-glance summary badges */}
          <div className="file-details-summary-chips">
            {summary.formatBadge && (
              <span className="badge badge-accent">{summary.formatBadge}</span>
            )}
            {summary.primaryMetric && (
              <span className="badge badge-neutral">{summary.primaryMetric}</span>
            )}
            {summary.sizeString && (
              <span className="badge badge-neutral">{summary.sizeString}</span>
            )}
            {summary.statusBadge && (
              <span
                className={`badge badge-${
                  summary.statusBadge.variant === 'success'
                    ? 'accent'
                    : summary.statusBadge.variant === 'warning'
                    ? 'neutral'
                    : 'neutral'
                }`}
              >
                {summary.statusBadge.label}
              </span>
            )}
          </div>
        </div>

        {/* Expand / Collapse toggle button */}
        <button
          type="button"
          className="file-details-toggle-btn"
          aria-label={isExpanded ? 'Hide Details' : 'Show Details'}
        >
          <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded detailed content */}
      {isExpanded && (
        <div className="file-details-body">
          <div className="file-details-grid">
            {/* Source Details Card */}
            {sourceGroups.map((group, gIdx) => (
              <div key={gIdx} className="details-card">
                <div className="details-card-header">{group.title}</div>
                <table className="details-table">
                  <tbody>
                    {group.items.map((item, iIdx) => (
                      <tr key={iIdx}>
                        <td className="details-label" title={item.hint}>
                          {item.label}
                        </td>
                        <td className="details-value">
                          {item.badge ? (
                            <span
                              className={`badge badge-${
                                item.badge === 'accent'
                                  ? 'accent'
                                  : item.badge === 'success'
                                  ? 'accent'
                                  : 'neutral'
                              }`}
                            >
                              {item.value}
                            </span>
                          ) : (
                            item.value
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Output Details Card */}
            {outputGroups.map((group, gIdx) => (
              <div key={gIdx} className="details-card">
                <div className="details-card-header">{group.title}</div>
                <table className="details-table">
                  <tbody>
                    {group.items.map((item, iIdx) => (
                      <tr key={iIdx}>
                        <td className="details-label" title={item.hint}>
                          {item.label}
                        </td>
                        <td className="details-value">
                          {item.badge ? (
                            <span
                              className={`badge badge-${
                                item.badge === 'accent'
                                  ? 'accent'
                                  : item.badge === 'success'
                                  ? 'accent'
                                  : 'neutral'
                              }`}
                            >
                              {item.value}
                            </span>
                          ) : (
                            item.value
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Contextual notes & disclaimers */}
          {notes && notes.length > 0 && (
            <div className="details-note-box">
              {notes.map((note, nIdx) => (
                <div
                  key={nIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    marginBottom: nIdx < notes.length - 1 ? '0.5rem' : 0,
                  }}
                >
                  <Info
                    size={15}
                    style={{
                      color: 'var(--accent-primary)',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
