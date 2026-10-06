import React, { useState, useEffect } from 'react';
import { MitreTactic } from '../types';
import { ShieldAlert, Crosshair, FileCode, Check, Copy, ExternalLink } from 'lucide-react';

export const MitreMatrix: React.FC = () => {
  const [tactics, setTactics] = useState<MitreTactic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTactic, setSelectedTactic] = useState<MitreTactic | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<any | null>(null);
  const [copiedRule, setCopiedRule] = useState(false);

  useEffect(() => {
    const fetchMitre = async () => {
      try {
        const res = await fetch('/api/mitre-attack');
        if (res.ok) {
          const data = await res.json();
          setTactics(data.tactics || []);
          if (data.tactics && data.tactics.length > 0) {
            setSelectedTactic(data.tactics[0]);
            setSelectedTechnique(data.tactics[0].techniques[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load MITRE data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMitre();
  }, []);

  const generateSigmaRule = (tech: any) => {
    return `title: Detect Suspicious Activity - ${tech.name} (${tech.id})
id: 5a8e7bf1-28d1-4b2a-8991-${tech.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().padEnd(12, '0')}
status: production
description: Identifies telemetry indicators matching MITRE ATT&CK technique ${tech.id}
references:
    - https://attack.mitre.org/techniques/${tech.id.split('.')[0]}/
author: Cyber Nexus Detection Engineering
date: 2026-10-06
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        Image|endswith:
            - '\\powershell.exe'
            - '\\cmd.exe'
            - '\\pwsh.exe'
        CommandLine|contains:
            - '-enc'
            - 'DownloadString'
            - 'Invoke-Expression'
    condition: selection
falsepositives:
    - Administrative automation scripts
level: ${tech.risk.toLowerCase()}`;
  };

  const copyRule = (rule: string) => {
    navigator.clipboard.writeText(rule);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>MITRE ATT&CK Enterprise Matrix Navigator</span>
          <span className="text-xs font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
            v14.1 Enterprise Matrix
          </span>
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">
          Adversary tactics, techniques, and procedures (TTPs) mapped against current telemetry detection coverage.
        </p>
      </div>

      {/* Tactics Grid / Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tactics.map(tac => {
          const isSelected = selectedTactic?.id === tac.id;
          return (
            <div
              key={tac.id}
              onClick={() => {
                setSelectedTactic(tac);
                if (tac.techniques.length > 0) setSelectedTechnique(tac.techniques[0]);
              }}
              className={`cursor-pointer rounded-lg border p-3 transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-slate-900 shadow-md ring-1 ring-indigo-500/30'
                  : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{tac.id}</span>
                <span className="text-indigo-400">{tac.activeDetections} Rules</span>
              </div>
              <h3 className="mt-1 text-xs font-bold text-white">{tac.name}</h3>
              <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{tac.description}</p>
            </div>
          );
        })}
      </div>

      {/* Split Details: Techniques List on Left, Sigma Rule Generator on Right */}
      {selectedTactic && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
          <div className="lg:col-span-5 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Techniques under {selectedTactic.name}
            </h3>
            {selectedTactic.techniques.map(tech => {
              const isTechSelected = selectedTechnique?.id === tech.id;
              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechnique(tech)}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    isTechSelected
                      ? 'border-indigo-500/80 bg-slate-900'
                      : 'border-slate-800 bg-slate-900/30 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">{tech.id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Coverage: {tech.coverage}</span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                          tech.risk === 'CRITICAL'
                            ? 'text-rose-400 bg-rose-950/40 border-rose-800'
                            : 'text-amber-400 bg-amber-950/40 border-amber-800'
                        }`}
                      >
                        {tech.risk}
                      </span>
                    </div>
                  </div>
                  <h4 className="mt-1 text-xs font-semibold text-slate-200">{tech.name}</h4>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-7">
            {selectedTechnique ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-indigo-400">{selectedTechnique.id}</span>
                      <span className="text-xs text-slate-400">· {selectedTechnique.risk} Risk</span>
                    </div>
                    <h3 className="mt-0.5 text-sm font-bold text-white">{selectedTechnique.name}</h3>
                  </div>

                  <a
                    href={`https://attack.mitre.org/techniques/${selectedTechnique.id.split('.')[0]}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    <span>MITRE Official</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Production Sigma Detection Rule</span>
                    </h4>
                    <button
                      onClick={() => copyRule(generateSigmaRule(selectedTechnique))}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      {copiedRule ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedRule ? 'Copied to Clipboard' : 'Copy Sigma YAML'}</span>
                    </button>
                  </div>

                  <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
                    {generateSigmaRule(selectedTechnique)}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
