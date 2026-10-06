import React from 'react';
import { ShieldAlert, Terminal, Download, Activity, Radar, Lock, FileCode, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenIngestModal: () => void;
  onExportScaffold: () => void;
  unreadAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenIngestModal,
  onExportScaffold,
  unreadAlertCount,
}) => {
  const navItems = [
    { id: 'cve-feed', label: 'Threat Intel (KEV)' },
    { id: 'scanners', label: 'Security Scanners' },
    { id: 'siem-logs', label: 'SIEM Log Console' },
    { id: 'alerts', label: 'Alert Triage', badgeCount: unreadAlertCount },
    { id: 'mitre', label: 'MITRE ATT&CK' },
    { id: 'architecture', label: 'Architecture & Code' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('cve-feed')}
          className="flex items-center gap-2.5 text-left text-base font-bold tracking-tight text-white hover:text-indigo-400 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <span>Cyber Nexus</span>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-white bg-slate-800/80 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span>{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="ml-1.5 font-mono text-[10px] tabular-nums text-rose-400">
                    ({item.badgeCount})
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenIngestModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 rounded-md transition-colors whitespace-nowrap"
          >
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Ingest Telemetry</span>
            <span className="sm:hidden">Ingest</span>
          </button>

          <button
            onClick={onExportScaffold}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5 text-slate-300" />
            <span className="hidden lg:inline">Starter Repo</span>
            <span className="lg:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-2 bg-slate-950/95 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                isActive
                  ? 'text-white bg-slate-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
              {item.badgeCount && item.badgeCount > 0 ? ` (${item.badgeCount})` : ''}
            </button>
          );
        })}
      </div>
    </header>
  );
};
