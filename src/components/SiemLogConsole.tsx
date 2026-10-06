import React, { useState, useEffect } from 'react';
import { SecurityLog } from '../types';
import { Search, Filter, Terminal, Play, Pause, AlertCircle, CheckCircle, ChevronRight, X, Clock } from 'lucide-react';

interface SiemLogConsoleProps {
  onOpenIngestModal: () => void;
}

export const SiemLogConsole: React.FC<SiemLogConsoleProps> = ({ onOpenIngestModal }) => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeLog, setActiveLog] = useState<SecurityLog | null>(null);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedLevel !== 'ALL') params.set('level', selectedLevel);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedLevel]);

  // Periodic polling when auto-refresh is active
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedLevel, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const levels = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-950/60 border-yellow-800/60';
      case 'LOW':
        return 'text-sky-400 bg-sky-950/60 border-sky-800/60';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>SIEM Security Telemetry Stream</span>
            <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 tabular-nums">
              {logs.length} Events Ingested
            </span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Real-time normalized event ingestion pipeline with automated correlation rule triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              autoRefresh
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {autoRefresh ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{autoRefresh ? 'Streaming (5s)' : 'Paused'}</span>
          </button>

          <button
            onClick={onOpenIngestModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Inject Telemetry Event</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search host, source IP (e.g. 185.220.101.5), user, MITRE technique..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-20 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-slate-500 font-medium mr-1 shrink-0">Severity:</span>
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                selectedLevel === lvl
                  ? 'bg-slate-800 text-white border border-slate-700 font-semibold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table (High density tabular view) */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Source &rarr; Dest</th>
                <th className="py-2.5 px-3">Target Host</th>
                <th className="py-2.5 px-3">MITRE Tactic</th>
                <th className="py-2.5 px-3">Summary</th>
                <th className="py-2.5 px-2 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading telemetry stream...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No security events found matching current criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const date = new Date(log.timestamp);
                  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <tr
                      key={log.id}
                      onClick={() => setActiveLog(log)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
                        {formattedTime}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded border ${getLevelBadge(
                            log.level
                          )}`}
                        >
                          {log.level}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-medium text-slate-200 whitespace-nowrap">
                        {log.eventType}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
                        <span className="text-indigo-300">{log.sourceIp}</span>
                        <span className="mx-1 text-slate-600">&rarr;</span>
                        <span>{log.destIp}:{log.destPort}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {log.host}
                      </td>
                      <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                        <span className="text-slate-300">{log.mitreTactic}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-300 max-w-xs truncate" title={log.summary}>
                        {log.summary}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-500">
                        <ChevronRight className="h-3.5 w-3.5 inline text-slate-400" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Event Detail Inspector Drawer */}
      {activeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-w-2xl w-full rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs px-2 py-0.5 rounded border ${getLevelBadge(activeLog.level)}`}>
                    {activeLog.level}
                  </span>
                  <span className="font-mono text-sm font-bold text-white">{activeLog.eventType}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
                  Event ID: {activeLog.id} · Timestamp: {new Date(activeLog.timestamp).toISOString()}
                </p>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">Source Endpoint</span>
                <p className="mt-1 font-mono text-indigo-300 font-semibold">{activeLog.sourceIp}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">Destination</span>
                <p className="mt-1 font-mono text-slate-200">
                  {activeLog.destIp}:{activeLog.destPort} ({activeLog.protocol})
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">Affected Host</span>
                <p className="mt-1 font-mono text-slate-200">{activeLog.host}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">User Context</span>
                <p className="mt-1 font-mono text-slate-200">{activeLog.user || 'SYSTEM / None'}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">MITRE Tactic</span>
                <p className="mt-1 text-slate-200 font-medium">{activeLog.mitreTactic}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500">MITRE Technique</span>
                <p className="mt-1 font-mono text-[11px] text-slate-200">{activeLog.mitreTechnique}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Narrative</h4>
              <p className="mt-1.5 p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                {activeLog.summary}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Raw Structured Payload (JSONB)
              </h4>
              <pre className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
                {JSON.stringify(activeLog.rawPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
