import type { ComponentType } from 'react';

export type NavigationSectionId =
  | 'overview'
  | 'live-monitoring'
  | 'risk-analytics'
  | 'equipment-control'
  | 'alerts'
  | 'device-info';

export interface NavigationItem {
  id: NavigationSectionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
}

