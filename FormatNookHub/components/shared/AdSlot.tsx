'use client';

import React from 'react';
import { AdPlacement, AdFormat } from '@/types/ad';
import { siteConfig } from '@/config/site';

interface AdSlotProps {
  placement: AdPlacement;
  slotId?: string;
  format?: AdFormat;
  className?: string;
}

export function AdSlot({ placement, slotId, format = 'auto', className = '' }: AdSlotProps) {
  const isEnabled = siteConfig.adsense.enabled && Boolean(siteConfig.adsense.publisherId) && Boolean(slotId);

  // In production with real publisher ID and slot ID, inject standard AdSense script/ins
  if (isEnabled) {
    return (
      <div className={`ad-slot-container ${className}`} data-placement={placement}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={siteConfig.adsense.publisherId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Development & safe reserved placeholder
  return (
    <aside className={`ad-slot-container ${className}`} data-placement={placement} aria-label="Sponsored Content Area">
      <div className="ad-slot-box">
        <span className="ad-slot-label">Reserved Sponsor Area</span>
        <span className="ad-slot-placeholder-text">
          AdSense Ready ({placement}) &bull; Non-Intrusive Layout
        </span>
      </div>
    </aside>
  );
}
