/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ThreatIntelFeed } from './components/ThreatIntelFeed';
import { SecurityScanners } from './components/SecurityScanners';
import { SiemLogConsole } from './components/SiemLogConsole';
import { AlertTriageBoard } from './components/AlertTriageBoard';
import { MitreMatrix } from './components/MitreMatrix';
import { ArchitectureBlueprint } from './components/ArchitectureBlueprint';
import { IngestModal } from './components/IngestModal';
import { Shield, Radio, Activity, AlertTriangle, CheckCircle2, User, Terminal, Database, ArrowUpRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('cve-feed');
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState(3);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Background and avatar image assets
  const socBannerImage = '/src/assets/images/soc_threat_map_1791298295492.jpg';
  const secopsAvatarImage = '/src/assets/images/lead_secops_avatar_1791298312217.jpg';

  // Metrics summary
  const [stats, setStats] = useState({
    cveCount: 8,
    activeAlerts: 3,
    ingestedEvents: 7,
    mttd: '1.4 min',
    coverage: '89.4%',
  });

  useEffect(() => {
    // Sync counts
    const fetchCounts = async () => {
      try {
        const [kevRes, alertsRes, logsRes] = await Promise.all([
          fetch('/api/threats/cisa-kev'),
          fetch('/api/alerts'),
          fetch('/api/logs'),
        ]);

        if (kevRes.ok && alertsRes.ok && logsRes.ok) {
          const kevData = await kevRes.json();
          const alertsData = await alertsRes.json();
          const logsData = await logsRes.json();

          const newAlerts = (alertsData.alerts || []).filter(
            (a: any) => a.status === 'NEW' || a.status === 'INVESTIGATING'
          ).length;

          setStats({
            cveCount: kevData.total || 8,
            activeAlerts: newAlerts,
            ingestedEvents: logsData.total || 7,
            mttd: '1.4 min',
            coverage: '89.4%',
          });
          setUnreadAlertCount(newAlerts);
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchCounts();
  }, [refreshTrigger, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. Header adhering to Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
        onExportScaffold={() => setActiveTab('architecture')}
        unreadAlertCount={unreadAlertCount}
      />

      {/* 2. Tactical Operations Banner & Command Context */}
      <div className="relative border-b border-slate-800 bg-slate-900/60 overflow-hidden">
        {/* Visual asset with measured dark contrast scrim */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src={socBannerImage}
            alt="Tactical Cybersecurity Security Operations Center Matrix"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              // Graceful styled fallback container
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Security Operations Center</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Ingestion Nominal
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">US-East Primary Cluster</span>
              </div>
              <h1 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-white">
                Cyber Threat Intelligence & Incident Response Command
              </h1>
            </div>

            {/* Analyst Duty Profile Card */}
            <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/80 p-2.5 backdrop-blur-sm">
              <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden border border-slate-700 bg-slate-800">
                <img
                  src={secopsAvatarImage}
                  alt="Senior SecOps Lead"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <User className="h-5 w-5 text-slate-400 absolute inset-0 m-auto" />
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-slate-200">Alex Chen</div>
                <div className="text-[11px] text-slate-400">Senior Incident Commander · Tier 3</div>
              </div>
            </div>
          </div>

          {/* Metric Telemetry Strip (Tabular Figures) */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('cve-feed')}
              className="text-left p-2.5 rounded bg-slate-950/70 hover:bg-slate-950 border border-slate-800/70 transition-colors"
            >
              <div className="text-[11px] text-slate-400">CISA Exploited CVEs</div>
              <div className="mt-0.5 font-mono text-base font-bold text-white tabular-nums">
                {stats.cveCount}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className="text-left p-2.5 rounded bg-slate-950/70 hover:bg-slate-950 border border-slate-800/70 transition-colors"
            >
              <div className="text-[11px] text-slate-400">Active High/Critical Alerts</div>
              <div className="mt-0.5 font-mono text-base font-bold text-rose-400 tabular-nums">
                {stats.activeAlerts}
              </div>
            </button>

            <button
              onClick={() => setActiveTab('siem-logs')}
              className="text-left p-2.5 rounded bg-slate-950/70 hover:bg-slate-950 border border-slate-800/70 transition-colors"
            >
              <div className="text-[11px] text-slate-400">Telemetry Log Events</div>
              <div className="mt-0.5 font-mono text-base font-bold text-indigo-400 tabular-nums">
                {stats.ingestedEvents}
              </div>
            </button>

            <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/70">
              <div className="text-[11px] text-slate-400">Mean Time to Detect (MTTD)</div>
              <div className="mt-0.5 font-mono text-base font-bold text-emerald-400 tabular-nums">
                {stats.mttd}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('mitre')}
              className="text-left p-2.5 rounded bg-slate-950/70 hover:bg-slate-950 border border-slate-800/70 transition-colors"
            >
              <div className="text-[11px] text-slate-400">MITRE Coverage</div>
              <div className="mt-0.5 font-mono text-base font-bold text-sky-400 tabular-nums">
                {stats.coverage}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Canvas */}
      <main className="mx-auto max-w-7xl flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'cve-feed' && <ThreatIntelFeed />}
        {activeTab === 'scanners' && <SecurityScanners />}
        {activeTab === 'siem-logs' && (
          <SiemLogConsole onOpenIngestModal={() => setIsIngestModalOpen(true)} />
        )}
        {activeTab === 'alerts' && <AlertTriageBoard />}
        {activeTab === 'mitre' && <MitreMatrix />}
        {activeTab === 'architecture' && <ArchitectureBlueprint />}
      </main>

      {/* 4. Footer adhering to Anti-Slop governance */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Cyber Nexus</span>
            <span>·</span>
            <span>Threat Intelligence, SIEM Ingestion &amp; Incident Operations Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('architecture')}
              className="hover:text-slate-200 transition-colors"
            >
              Docker &amp; Terraform Blueprint
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('scanners')}
              className="hover:text-slate-200 transition-colors"
            >
              Live Header Scanner
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('cve-feed')}
              className="hover:text-slate-200 transition-colors"
            >
              CISA KEV Feed
            </button>
          </div>
        </div>
      </footer>

      {/* Ingestion Simulation Modal */}
      <IngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
      />
    </div>
  );
}
