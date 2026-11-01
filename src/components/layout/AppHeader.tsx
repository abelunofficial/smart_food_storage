import React from 'react';
import { Menu, TestTube2, Radio } from 'lucide-react';
import { ConnectionIndicator } from '../common';
import type { NavigationItem } from '../../types';
import { storageService } from '../../services';

interface AppHeaderProps {
  currentSection: NavigationItem;
  onOpenMobileSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentSection,
  onOpenMobileSidebar,
}) => {
  const isLive = storageService.isLive();

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left side: Mobile/tablet menu toggle + Page Title & Subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {currentSection.title}
          </h1>
          <p className="text-xs text-slate-500 truncate hidden sm:block">
            {currentSection.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Environment badge & Connection Indicator */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Environment Badge */}
        {isLive ? (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold"
            title="Live Blynk IoT telemetry connection active."
          >
            <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse shrink-0" />
            <span className="hidden sm:inline">Blynk Live Stream</span>
            <span className="sm:hidden">Live</span>
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium"
            title="Demonstration environment active. Operating independently of live edge hardware."
          >
            <TestTube2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">Demo Environment</span>
            <span className="sm:hidden">Demo</span>
          </div>
        )}

        {/* Device Connection Indicator */}
        <div className="hidden sm:block">
          <ConnectionIndicator variant="full" isLive={isLive} />
        </div>
        <div className="sm:hidden">
          <ConnectionIndicator variant="compact" isLive={isLive} />
        </div>
      </div>
    </header>
  );
};
