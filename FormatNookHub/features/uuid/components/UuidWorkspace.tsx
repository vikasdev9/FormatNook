'use client';

import React, { useState } from 'react';
import { UuidTabType } from '../types/uuid.types';
import { UuidGeneratorPanel } from './UuidGeneratorPanel';
import { UuidValidatorPanel } from './UuidValidatorPanel';
import { UuidConverterPanel } from './UuidConverterPanel';
import { UuidDeduplicatorPanel } from './UuidDeduplicatorPanel';
import { UuidInfoPanel } from './UuidInfoPanel';
import { Hash, CheckCircle2, ArrowRightLeft, Layers, Info } from 'lucide-react';

interface UuidWorkspaceProps {
  initialTab?: UuidTabType;
}

export function UuidWorkspace({ initialTab = 'generator' }: UuidWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<UuidTabType>(initialTab);

  const tabs: { id: UuidTabType; label: string; icon: React.ReactNode }[] = [
    { id: 'generator', label: 'UUID Generator', icon: <Hash size={15} /> },
    { id: 'validator', label: 'Validator', icon: <CheckCircle2 size={15} /> },
    { id: 'converter', label: 'Format Converter', icon: <ArrowRightLeft size={15} /> },
    { id: 'deduplicator', label: 'Deduplicator', icon: <Layers size={15} /> },
    { id: 'info', label: 'UUID v4 Specs', icon: <Info size={15} /> },
  ];

  return (
    <div className="uuid-workspace-wrapper" data-testid="uuid-workspace">
      {/* Workspace Navigation Tabs */}
      <div className="workspace-tab-nav" role="tablist" aria-label="UUID and GUID Utilities">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Workspace View */}
      <div className="uuid-tab-content">
        {activeTab === 'generator' && <UuidGeneratorPanel />}
        {activeTab === 'validator' && <UuidValidatorPanel />}
        {activeTab === 'converter' && <UuidConverterPanel />}
        {activeTab === 'deduplicator' && <UuidDeduplicatorPanel />}
        {activeTab === 'info' && <UuidInfoPanel />}
      </div>
    </div>
  );
}
