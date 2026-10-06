import React, { useState, useEffect } from 'react';
import { TimelineEvent, TimelineStage } from '../types';
import {
  Clock,
  Radio,
  GitCommit,
  ShieldAlert,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Copy,
  Check,
  FileDown,
  Filter,
  Terminal,
  AlertTriangle
} from 'lucide-react';

interface IncidentTimelineProps {
  alertId: string;
  targetHost: string;
  sourceIp: string;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  alertId,
  targetHost,
  sourceIp,
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state to add custom timeline milestone
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newStage, setNewStage] = useState<TimelineStage>('FORENSICS');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOriginator, setNewOriginator] = useState('Alex Chen (SecOps Lead)');
  const [newTechnicalDetail, setNewTechnicalDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts/${alertId}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load incident timeline', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alertId) {
      fetchTimeline();
      setIsAddingEvent(false);
    }
  }, [alertId]);

  const toggleExpand = (id: string) => {
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyTechnicalDetail = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/alerts/${alertId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          title: newTitle.trim(),
          description: newDescription.trim(),
          originator: newOriginator.trim(),
          technicalDetail: newTechnicalDetail.trim() || undefined,
        }),
      });

      if (res.ok) {
        const created: TimelineEvent = await res.json();
        setEvents(prev => [...prev, created]);
        setNewTitle('');
        setNewDescription('');
        setNewTechnicalDetail('');
        setIsAddingEvent(false);
      }
    } catch (err) {
      console.error('Failed to append timeline event', err);
    } finally {
      setSubmitting(false);
    }
  };

  const exportTimelineMarkdown = () => {
    const lines = [
      `# Incident Chronological Timeline: ${alertId}`,
      `**Target Host:** ${targetHost}`,
      `**Source IP:** ${sourceIp}`,
      `**Exported:** ${new Date().toISOString()}`,
      '',
      '---',
      '',
    ];

    events.forEach((evt, idx) => {
      lines.push(`### Step ${idx + 1}: ${evt.title}`);
      lines.push(`- **Timestamp:** ${evt.timestamp}`);
      lines.push(`- **Stage:** ${evt.stage}`);
      lines.push(`- **Originator:** ${evt.originator}`);
      lines.push(`- **Summary:** ${evt.description}`);
      if (evt.technicalDetail) {
        lines.push(`- **Technical Payload / Command:**`);
        lines.push('```text');
        lines.push(evt.technicalDetail);
        lines.push('```');
      }
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-${alertId.toLowerCase()}-timeline.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEvents = events.filter(e => {
    if (filterStage === 'ALL') return true;
    return e.stage === filterStage;
  });

  const getStageConfig = (stage: TimelineStage) => {
    switch (stage) {
      case 'DETECTION':
        return {
          label: 'Detection',
          icon: Radio,
          nodeColor: 'border-rose-500 bg-rose-950 text-rose-300 ring-rose-500/20',
          textColor: 'text-rose-400',
        };
      case 'CORRELATION':
        return {
          label: 'Correlation',
          icon: GitCommit,
          nodeColor: 'border-indigo-500 bg-indigo-950 text-indigo-300 ring-indigo-500/20',
          textColor: 'text-indigo-400',
        };
      case 'CONTAINMENT':
        return {
          label: 'Containment',
          icon: ShieldAlert,
          nodeColor: 'border-amber-500 bg-amber-950 text-amber-300 ring-amber-500/20',
          textColor: 'text-amber-400',
        };
      case 'FORENSICS':
        return {
          label: 'Forensics',
          icon: Search,
          nodeColor: 'border-sky-500 bg-sky-950 text-sky-300 ring-sky-500/20',
          textColor: 'text-sky-400',
        };
      case 'ERADICATION':
        return {
          label: 'Eradication',
          icon: CheckCircle2,
          nodeColor: 'border-emerald-500 bg-emerald-950 text-emerald-300 ring-emerald-500/20',
          textColor: 'text-emerald-400',
        };
      default:
        return {
          label: stage,
          icon: Clock,
          nodeColor: 'border-slate-500 bg-slate-900 text-slate-300 ring-slate-500/20',
          textColor: 'text-slate-400',
        };
    }
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-5 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Incident Investigation Timeline
            </h3>
            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
              ({events.length} Milestones)
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Chronological step-by-step forensic progression from detection through containment and triage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingEvent(!isAddingEvent)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 rounded-md transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Milestone</span>
          </button>

          <button
            onClick={exportTimelineMarkdown}
            disabled={events.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md transition-colors disabled:opacity-50"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export Timeline</span>
          </button>
        </div>
      </div>

      {/* Stage Filter Segment */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-slate-500 font-medium mr-1 shrink-0 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filter Stage:
        </span>
        {['ALL', 'DETECTION', 'CORRELATION', 'FORENSICS', 'CONTAINMENT', 'ERADICATION'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStage(st)}
            className={`px-2.5 py-1 rounded text-[11px] transition-colors shrink-0 ${
              filterStage === st
                ? 'bg-slate-800 text-white font-medium border border-slate-700'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Add Milestone Inline Drawer */}
      {isAddingEvent && (
        <form
          onSubmit={handleAddMilestone}
          className="rounded-lg border border-indigo-900/50 bg-indigo-950/20 p-4 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-indigo-200 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-indigo-400" />
              <span>Record Forensic Milestone / Action</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingEvent(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Investigation Stage</label>
              <select
                value={newStage}
                onChange={e => setNewStage(e.target.value as TimelineStage)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="DETECTION">DETECTION (Sensor observation)</option>
                <option value="CORRELATION">CORRELATION (SIEM / Rule hit)</option>
                <option value="FORENSICS">FORENSICS (Artifact / Log inspection)</option>
                <option value="CONTAINMENT">CONTAINMENT (Quarantine / Firewall action)</option>
                <option value="ERADICATION">ERADICATION (Patch / Re-image / Rotation)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Milestone Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Memory dump captured from container"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Detailed Description & Observation</label>
            <textarea
              rows={2}
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Document what was discovered, verified, or executed..."
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Originator / Analyst</label>
              <input
                type="text"
                value={newOriginator}
                onChange={e => setNewOriginator(e.target.value)}
                placeholder="e.g. Alex Chen (SecOps Lead)"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Technical Command or Log Artifact (Optional)</label>
              <input
                type="text"
                value={newTechnicalDetail}
                onChange={e => setNewTechnicalDetail(e.target.value)}
                placeholder="e.g. docker pause ci-runner-03; sha256sum memory.raw"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              {submitting ? 'Appending Milestone...' : 'Save Milestone to Timeline'}
            </button>
          </div>
        </form>
      )}

      {/* Vertical Step-Based Timeline Visualization */}
      {loading ? (
        <div className="space-y-4 py-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex gap-4 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-12 bg-slate-900 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 border border-slate-800/80 rounded-lg">
          No chronological milestones match the selected stage filter.
        </div>
      ) : (
        <div className="relative pl-2 sm:pl-3">
          {/* Continuous Vertical Timeline Line */}
          <div className="absolute left-6 sm:left-7 top-4 bottom-4 w-px bg-slate-800 pointer-events-none" />

          <div className="space-y-6">
            {filteredEvents.map((evt, idx) => {
              const stageCfg = getStageConfig(evt.stage);
              const StageIcon = stageCfg.icon;
              const isExpanded = Boolean(expandedDetails[evt.id]);
              const eventDate = new Date(evt.timestamp);
              const timeFormatted = eventDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div key={evt.id} className="relative flex items-start gap-4 group">
                  {/* Step Node Circle */}
                  <div
                    className={`relative z-10 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border ring-4 ring-slate-950 ${stageCfg.nodeColor} transition-transform group-hover:scale-105`}
                  >
                    <StageIcon className="h-4 w-4" />
                  </div>

                  {/* Step Content Container */}
                  <div className="flex-1 rounded-lg border border-slate-800/90 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700/80 p-4 transition-all">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-400 tabular-nums">
                          Step {idx + 1}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <h4 className="text-xs font-semibold text-white tracking-tight">
                          {evt.title}
                        </h4>
                      </div>

                      {/* Zero-Pill Metadata */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                        <span>{timeFormatted}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className={stageCfg.textColor}>{stageCfg.label}</span>
                      </div>
                    </div>

                    {/* Step Description */}
                    <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                      {evt.description}
                    </p>

                    {/* Originator / Sensor Metadata Line */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-800/70 pt-2 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Originator:</span>
                        <span className="font-mono text-slate-300">{evt.originator}</span>
                      </div>

                      {evt.technicalDetail && (
                        <button
                          onClick={() => toggleExpand(evt.id)}
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <Terminal className="h-3 w-3" />
                          <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Collapsible Technical Detail Artifact */}
                    {evt.technicalDetail && isExpanded && (
                      <div className="mt-3 relative rounded bg-slate-950 border border-slate-800/90 p-3">
                        <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-500 font-mono">
                          <span>Forensic Telemetry Snippet</span>
                          <button
                            onClick={() => copyTechnicalDetail(evt.id, evt.technicalDetail!)}
                            className="flex items-center gap-1 text-slate-400 hover:text-white"
                          >
                            {copiedId === evt.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="font-mono text-[11px] text-indigo-200 overflow-x-auto whitespace-pre selection:bg-indigo-700/50">
                          {evt.technicalDetail}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
