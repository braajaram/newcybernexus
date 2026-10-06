import React, { useState, useEffect } from 'react';
import { SecurityAlert } from '../types';
import { IncidentTimeline } from './IncidentTimeline';
import { ShieldAlert, UserCheck, CheckCircle2, AlertOctagon, FileDown, Plus, ExternalLink, Activity, ArrowRight, Clock, FileText, Shield } from 'lucide-react';

export const AlertTriageBoard: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeInvestigationTab, setActiveInvestigationTab] = useState<'timeline' | 'evidence' | 'sop'>('timeline');
  const [newEvidenceText, setNewEvidenceText] = useState('');
  const [analysts] = useState(['Alex Chen (SecOps Lead)', 'Elena Rostova (Analyst II)', 'Marcus Vance (IR Specialist)']);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        if (!selectedAlert && data.alerts && data.alerts.length > 0) {
          setSelectedAlert(data.alerts[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleUpdateStatus = async (alertId: string, newStatus: SecurityAlert['status']) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts(prev => prev.map(a => (a.id === updated.id ? updated : a)));
        if (selectedAlert?.id === updated.id) {
          setSelectedAlert(updated);
        }
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleAssign = async (alertId: string, assignee: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts(prev => prev.map(a => (a.id === updated.id ? updated : a)));
        if (selectedAlert?.id === updated.id) {
          setSelectedAlert(updated);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert || !newEvidenceText.trim()) return;

    try {
      const res = await fetch(`/api/alerts/${selectedAlert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addEvidence: newEvidenceText.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlerts(prev => prev.map(a => (a.id === updated.id ? updated : a)));
        setSelectedAlert(updated);
        setNewEvidenceText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportIncidentMarkdown = (alert: SecurityAlert) => {
    const md = `# INCIDENT RESPONSE REPORT: ${alert.id}
**Classification:** ${alert.title}
**Severity:** ${alert.severity}
**Status:** ${alert.status}
**Target Host:** ${alert.targetHost}
**Attacker IP:** ${alert.sourceIp}
**Lead Investigator:** ${alert.assignee}
**Generated Timestamp:** ${new Date().toISOString()}

---

## 1. Forensic Evidence Log
${alert.evidence.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}

---

## 2. NIST SP 800-61 Incident Containment & Remediation
${alert.remediationPlan}

---
*Report certified by Cyber Nexus Autonomous SecOps Engine*`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${alert.id.toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  const getSeverityStyle = (sev: string) => {
    if (sev === 'CRITICAL') return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
    if (sev === 'HIGH') return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
    return 'text-sky-400 bg-sky-950/60 border-sky-800/80';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>SOC Alert Triage & Incident Command</span>
            <span className="text-xs font-mono text-rose-400 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/40 tabular-nums">
              {alerts.filter(a => a.status === 'NEW' || a.status === 'INVESTIGATING').length} Active Incidents
            </span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            NIST SP 800-61 Computer Security Incident Handling playbook with containment action tracking.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'NEW', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main split view: Alert list on left, deep triage panel on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Alert List */}
        <div className="lg:col-span-5 space-y-2.5">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-20 bg-slate-900 border border-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-8 text-center border border-slate-800 bg-slate-900/30 rounded-lg">
              <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500 mb-2" />
              <p className="text-xs text-slate-400">No alerts matching filter {filterStatus}</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isSelected = selectedAlert?.id === alert.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                    isSelected
                      ? 'border-indigo-500/60 bg-slate-900/90 shadow-md ring-1 ring-indigo-500/30'
                      : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-300">{alert.id}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getSeverityStyle(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {alert.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-1.5 text-xs font-semibold text-white leading-snug line-clamp-1">{alert.title}</h3>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono truncate max-w-[140px] text-indigo-300">{alert.targetHost}</span>
                    <span className="truncate max-w-[140px]">{alert.assignee}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Triage Command & Forensics Workspace */}
        <div className="lg:col-span-7">
          {selectedAlert ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5 space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-400">{selectedAlert.id}</span>
                    <span
                      className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded border ${getSeverityStyle(
                        selectedAlert.severity
                      )}`}
                    >
                      {selectedAlert.severity}
                    </span>
                    <span className="text-xs text-slate-400">· {selectedAlert.category}</span>
                  </div>
                  <h2 className="mt-1 text-sm font-bold text-white">{selectedAlert.title}</h2>
                </div>

                <button
                  onClick={() => exportIncidentMarkdown(selectedAlert)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap self-start"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Export IR Report</span>
                </button>
              </div>

              {/* Status & Assignment Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <label className="text-slate-400 block mb-1 font-medium">Incident Lifecycle Status</label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(['NEW', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedAlert.id, st)}
                        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          selectedAlert.status === st
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <label className="text-slate-400 block mb-1 font-medium">Assigned SOC Analyst</label>
                  <select
                    value={selectedAlert.assignee}
                    onChange={e => handleAssign(selectedAlert.id, e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Unassigned">Unassigned</option>
                    {analysts.map(a => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tactical Context */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-[11px] text-slate-500">Target Host</span>
                  <p className="mt-1 font-mono text-slate-200 font-semibold">{selectedAlert.targetHost}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-[11px] text-slate-500">Source Attacker IP</span>
                  <p className="mt-1 font-mono text-indigo-300 font-semibold">{selectedAlert.sourceIp}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-[11px] text-slate-500">MITRE Tactic</span>
                  <p className="mt-1 text-slate-200 font-semibold">{selectedAlert.mitreTactic}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-[11px] text-slate-500">MITRE Technique</span>
                  <p className="mt-1 font-mono text-slate-200 font-semibold">{selectedAlert.mitreTechnique}</p>
                </div>
              </div>

              {/* Investigation View Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-800/80 pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveInvestigationTab('timeline')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeInvestigationTab === 'timeline'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Chronological Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInvestigationTab('evidence')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeInvestigationTab === 'evidence'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-sky-400" />
                  <span>Evidence &amp; Artifacts ({selectedAlert.evidence.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveInvestigationTab('sop')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeInvestigationTab === 'sop'
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  <span>NIST SP 800-61 SOP</span>
                </button>
              </div>

              {/* Sub-view 1: Chronological Incident Timeline */}
              {activeInvestigationTab === 'timeline' && (
                <IncidentTimeline
                  alertId={selectedAlert.id}
                  targetHost={selectedAlert.targetHost}
                  sourceIp={selectedAlert.sourceIp}
                />
              )}

              {/* Sub-view 2: Forensic Evidence Checklist */}
              {activeInvestigationTab === 'evidence' && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Forensic Evidence &amp; Artifact Log
                    </h4>
                    <div className="space-y-1.5">
                      {selectedAlert.evidence.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
                        >
                          <span className="font-mono text-indigo-400 font-semibold">{idx + 1}.</span>
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddEvidence} className="mt-2.5 flex gap-2">
                      <input
                        type="text"
                        value={newEvidenceText}
                        onChange={e => setNewEvidenceText(e.target.value)}
                        placeholder="Add forensic evidence observation or analyst note..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors whitespace-nowrap"
                      >
                        Log Evidence
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Sub-view 3: NIST Containment Plan */}
              {activeInvestigationTab === 'sop' && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      NIST SP 800-61 Containment SOP
                    </h4>
                    <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-lg text-xs text-indigo-200 leading-relaxed">
                      {selectedAlert.remediationPlan}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="font-semibold text-white block mb-0.5">Phase 3: Containment Strategy</span>
                      <span>Coordinate isolation of VLAN subnet and verify credentials rotation before releasing hold.</span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                      <span className="font-semibold text-white block mb-0.5">Phase 4: Eradication &amp; Recovery</span>
                      <span>Validate hash integrity against gold image and confirm vulnerability patch application.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center border border-slate-800 bg-slate-900/20 rounded-lg text-slate-500 text-xs">
              Select an alert from the left column to inspect forensic evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
