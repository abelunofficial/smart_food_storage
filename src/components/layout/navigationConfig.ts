import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  Fan,
  Bell,
  Cpu,
} from 'lucide-react';
import type { NavigationItem } from '../../types';

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    title: 'Storage Overview',
    subtitle: 'High-level condition monitoring and operational status',
    description: 'High-level environmental condition overview, risk score status, and key facility metrics.',
  },
  {
    id: 'live-monitoring',
    label: 'Live Monitoring',
    icon: Activity,
    title: 'Live Sensor Monitoring',
    subtitle: 'Continuous chamber temperature, humidity, and air quality telemetry',
    description: 'Real-time environmental streams for chamber temperature, humidity, and air quality index.',
  },
  {
    id: 'risk-analytics',
    label: 'Risk Analytics',
    icon: ShieldAlert,
    title: 'Risk Analytics & Evaluation',
    subtitle: 'Continuous food preservation risk analysis and factor breakdown',
    description: 'Preservation risk assessment modeling based on environmental sensor readings.',
  },
  {
    id: 'equipment-control',
    label: 'Equipment Control',
    icon: Fan,
    title: 'Equipment & Climate Control',
    subtitle: 'Automatic ventilation relay, manual fan switch (V4), vent servo, and alarm buzzer',
    description: 'Dual relay outputs, operator manual fan control (V4), intake servo, and alert buzzer status.',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: Bell,
    title: 'Alerts & Incident Log',
    subtitle: 'Threshold monitoring and environmental warning notifications',
    description: 'Threshold excursion log and historical incident record for storage safety deviations.',
  },
  {
    id: 'device-info',
    label: 'Device Information',
    icon: Cpu,
    title: 'Device & System Architecture',
    subtitle: 'Hardware profile, communication status, and engineering reference',
    description: 'Hardware profile, sensor transducer details, and virtual pin mappings for the storage monitor node.',
  },
];

