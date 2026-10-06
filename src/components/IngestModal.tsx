import React, { useState } from 'react';
import { Terminal, X, Play, CheckCircle2, ShieldAlert } from 'lucide-react';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestSuccess: () => void;
}

export const IngestModal: React.FC<IngestModalProps> = ({ isOpen, onClose, onIngestSuccess }) => {
  const [eventType, setEventType] = useState('BRUTE_FORCE_SSH');
  const [level, setLevel] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'>('CRITICAL');
  const [sourceIp, setSourceIp] = useState('185.220.101.5');
  const [destIp, setDestIp] = useState('10.0.4.12');
  const [destPort, setDestPort] = useState('22');
  const [host, setHost] = useState('prod-api-gateway-01');
  const [user, setUser] = useState('root');
  const [summary, setSummary] = useState('Multiple failed password attempts detected via SSH from known malicious IP');
  const [mitreTactic, setMitreTactic] = useState('Credential Access');
  const [mitreTechnique, setMitreTechnique] = useState('T1110.001 - Password Guessing');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    {
      label: 'SSH Brute Force Attack',
      type: 'BRUTE_FORCE_SSH',
      lvl: 'CRITICAL' as const,
      src: '185.220.101.5',
      dst: '10.0.4.12',
      port: '22',
      hst: 'prod-api-gateway-01',
      usr: 'root',
      sum: 'Detected 42 failed SSH authentication attempts within 60s from Tor exit node',
      tac: 'Credential Access',
      tech: 'T1110.001 - Password Guessing',
    },
    {
      label: 'Encoded PowerShell Dropper',
      type: 'SUSPICIOUS_POWERSHELL_EXEC',
      lvl: 'HIGH' as const,
      src: '10.0.12.84',
      dst: '194.26.29.112',
      port: '443',
      hst: 'fin-workstation-88.corp',
      usr: 'finance_analyst_2',
      sum: 'Encoded PowerShell command executed invoking IEX (New-Object Net.WebClient).DownloadString',
      tac: 'Execution',
      tech: 'T1059.001 - PowerShell Obfuscation',
    },
    {
      label: 'DNS Tunnel Exfiltration',
      type: 'SUSPICIOUS_DATA_EXFILTRATION',
      lvl: 'CRITICAL' as const,
      src: '10.0.2.14',
      dst: '103.145.13.8',
      port: '53',
      hst: 'eng-build-runner-03',
      usr: 'jenkins',
      sum: 'High-entropy TXT DNS queries transmitting base64 encoded strings to external authoritative NS',
      tac: 'Exfiltration',
      tech: 'T1048.003 - Exfiltration Over DNS Tunnel',
    },
    {
      label: 'WAF SQL Injection Blocked',
      type: 'WAF_BLOCKED_SQLI',
      lvl: 'INFO' as const,
      src: '198.51.100.41',
      dst: '10.0.1.10',
      port: '443',
      hst: 'customer-portal-ingress',
      usr: 'anonymous',
      sum: 'WAF Rule 942100 blocked UNION SELECT injection payload in URI query parameter',
      tac: 'Initial Access',
      tech: 'T1190 - Exploit Public-Facing Application',
    },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setEventType(p.type);
    setLevel(p.lvl);
    setSourceIp(p.src);
    setDestIp(p.dst);
    setDestPort(p.port);
    setHost(p.hst);
    setUser(p.usr);
    setSummary(p.sum);
    setMitreTactic(p.tac);
    setMitreTechnique(p.tech);
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/logs/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          level,
          sourceIp,
          destIp,
          destPort: Number(destPort),
          host,
          user,
          summary,
          mitreTactic,
          mitreTechnique,
          rawPayload: {
            simulation: true,
            injectedAt: new Date().toISOString(),
            raw_event: `${eventType} from ${sourceIp} targeting ${host}`,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(
          data.alertGenerated
            ? `Telemetry ingested successfully! Generated Critical Alert: ${data.alertGenerated.id}`
            : 'Telemetry ingested successfully into SIEM stream!'
        );
        setTimeout(() => {
          onIngestSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-w-xl w-full rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Inject Telemetry Event (Simulation Engine)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Presets */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
            Simulation Attack Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-left p-2 rounded bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors text-xs"
              >
                <div className="font-semibold text-slate-200">{p.label}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.type}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleIngest} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1">Event Type Identifier</label>
              <input
                type="text"
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">Severity Level</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
                <option value="INFO">INFO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 block mb-1">Source IP</label>
              <input
                type="text"
                value={sourceIp}
                onChange={e => setSourceIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">Dest IP</label>
              <input
                type="text"
                value={destIp}
                onChange={e => setDestIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">Dest Port</label>
              <input
                type="number"
                value={destPort}
                onChange={e => setDestPort(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1">Affected Host</label>
              <input
                type="text"
                value={host}
                onChange={e => setHost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">User Context</label>
              <input
                type="text"
                value={user}
                onChange={e => setUser(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1">Event Summary</label>
            <textarea
              rows={2}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{loading ? 'Ingesting...' : 'Ingest Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
