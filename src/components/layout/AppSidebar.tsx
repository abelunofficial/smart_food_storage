
import React from 'react';
import { Package, X } from 'lucide-react';
import type { NavigationSectionId } from '../../types';
import { NAVIGATION_ITEMS } from './navigationConfig';
import { ConnectionIndicator } from '../common';

interface AppSidebarProps {
  activeSection: NavigationSectionId;
  onSelectSection: (id: NavigationSectionId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
}) => {
  const renderNavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
      <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        Navigation
      </div>
      {NAVIGATION_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onSelectSection(item.id);
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}
            />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const brandHeader = (
    <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
          <Package className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
            Smart Storage
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase block">
            Industrial IoT
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Laptop Persistent Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white shrink-0 min-h-screen sticky top-0 h-screen select-none">
        {brandHeader}
        {renderNavLinks()}
        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Storage Core</span>
            <span className="font-mono text-[11px] text-slate-500">v0.2.0</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Continuous Climate Monitoring</span>
          <div className="pt-1">
            <ConnectionIndicator variant="compact" />
          </div>
        </div>
      </aside>

      {/* Mobile & Tablet Drawer Backdrop (< 1024px) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-2xs transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile & Tablet Drawer (< 1024px) */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-xl border-r border-slate-200 flex flex-col lg:hidden transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                Smart Storage
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase block">
                Industrial IoT
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderNavLinks()}

        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Storage Core</span>
            <span className="font-mono text-[11px] text-slate-500">v0.2.0</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Continuous Climate Monitoring</span>
          <div className="pt-1">
            <ConnectionIndicator variant="compact" />
          </div>
        </div>
      </div>
    </>
  );
};
