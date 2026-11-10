export type AdPlacement =
  | 'homepage-hero-bottom'
  | 'tool-top'
  | 'tool-sidebar'
  | 'tool-bottom'
  | 'article-inline';

export type AdFormat = 'auto' | 'rectangle' | 'horizontal' | 'vertical';

export interface AdSlotConfig {
  slotId?: string;
  placement: AdPlacement;
  format?: AdFormat;
  responsive?: boolean;
  className?: string;
}
