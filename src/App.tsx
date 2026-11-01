import { useState, useEffect } from 'react';
import type { NavigationSectionId } from './types';
import {
  AppSidebar,
  AppHeader,
  PageContainer,
  NAVIGATION_ITEMS,
} from './components/layout';
import { PagePlaceholder } from './components/common';
import {
  OverviewPage,
  LiveMonitoringPage,
  RiskAnalyticsPage,
  EquipmentControlPage,
  AlertsPage,
  DeviceInfoPage,
} from './pages';

export function App() {
  const [activeSectionId, setActiveSectionId] = useState<NavigationSectionId>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentSection =
    NAVIGATION_ITEMS.find((item) => item.id === activeSectionId) ?? NAVIGATION_ITEMS[0];

  const renderSectionContent = () => {
    switch (activeSectionId) {
      case 'overview':
        return <OverviewPage onNavigateToAnalytics={() => setActiveSectionId('risk-analytics')} />;
      case 'live-monitoring':
        return <LiveMonitoringPage />;
      case 'risk-analytics':
        return <RiskAnalyticsPage />;
      case 'equipment-control':
        return <EquipmentControlPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'device-info':
        return <DeviceInfoPage />;
      default:
        return (
          <PagePlaceholder
            title={currentSection.title}
            description={currentSection.description}
            icon={currentSection.icon}
            tag="Section Roadmap"
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <AppSidebar
        activeSection={activeSectionId}
        onSelectSection={setActiveSectionId}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Application Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AppHeader
          currentSection={currentSection}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <PageContainer>
            {renderSectionContent()}
          </PageContainer>
        </main>
      </div>
    </div>
  );
}

export default App;
