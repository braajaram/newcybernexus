import React, { useState, useEffect } from 'react';
import { Layers, Server, Database, Cpu, Download, Copy, Check, FileCode, CheckCircle2 } from 'lucide-react';

export const ArchitectureBlueprint: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'docker' | 'schema' | 'terraform' | 'openapi'>('docker');
  const [scaffoldData, setScaffoldData] = useState<any>(null);
  const [openApiSpec, setOpenApiSpec] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchScaffold = async () => {
      try {
        const [scaffoldRes, openapiRes] = await Promise.all([
          fetch('/api/scaffold/export'),
          fetch('/api/openapi.json')
        ]);
        if (scaffoldRes.ok) setScaffoldData(await scaffoldRes.json());
        if (openapiRes.ok) setOpenApiSpec(await openapiRes.json());
      } catch (err) {
        console.error('Failed to load scaffold', err);
      }
    };
    fetchScaffold();
  }, []);

  const getActiveCode = () => {
    if (!scaffoldData) return 'Loading...';
    switch (activeCodeTab) {
      case 'docker':
        return scaffoldData.dockerCompose || '';
      case 'schema':
        return scaffoldData.schemaSql || '';
      case 'terraform':
        return scaffoldData.terraform || '';
      case 'openapi':
        return JSON.stringify(openApiSpec, null, 2) || '';
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadActive = () => {
    const code = getActiveCode();
    const filenames: Record<string, string> = {
      docker: 'docker-compose.yml',
      schema: 'schema.sql',
      terraform: 'main.tf',
      openapi: 'openapi.json'
    };
    downloadFile(filenames[activeCodeTab] || 'export.txt', code);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Enterprise SecOps Architecture & Starter Code</span>
          <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
            Production Ready
          </span>
        </h1>
        <p className="mt-0.5 text-xs text-slate-400">
          Complete high-throughput telemetry architecture with time-series database schemas, Docker orchestration, and IaC templates.
        </p>
      </div>

      {/* Architecture Components Topology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Server className="h-4 w-4" />
            <h3 className="text-xs font-bold text-white">1. Ingestion Gateway</h3>
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Fastify / Node.js or Go HTTP collector listening for Syslog (RFC 5424) & JSON logs. Validates JSON schemas and pushes to memory queue with rate-limiting.
          </p>
          <div className="mt-3 text-[11px] font-mono text-slate-500">
            Tech: Node.js / Go · 25,000 eps
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Cpu className="h-4 w-4" />
            <h3 className="text-xs font-bold text-white">2. Enrichment Worker</h3>
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Background workers using Redis + BullMQ. Enriches raw IPs with MaxMind GeoIP2, checks AbuseIPDB cache, and correlates against MITRE ATT&CK detection rules.
          </p>
          <div className="mt-3 text-[11px] font-mono text-slate-500">
            Tech: Redis 7.0 · BullMQ
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Database className="h-4 w-4" />
            <h3 className="text-xs font-bold text-white">3. TimescaleDB / Postgres</h3>
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            PostgreSQL partitioned by time hypertable (`security_events`). Automatically compresses older chunks by 90% while keeping sub-second analytic query performance.
          </p>
          <div className="mt-3 text-[11px] font-mono text-slate-500">
            Tech: PostgreSQL 16 · TimescaleDB
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-sky-400">
            <Layers className="h-4 w-4" />
            <h3 className="text-xs font-bold text-white">4. Analyst SOC Frontend</h3>
          </div>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            React 19 + TypeScript single-page application with real-time SSE / WebSocket streaming for alert feeds, tabular numeral grids, and incident response command.
          </p>
          <div className="mt-3 text-[11px] font-mono text-slate-500">
            Tech: React 19 · Vite · Tailwind v4
          </div>
        </div>
      </div>

      {/* Code Viewer & Scaffolding Exporter */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
        {/* Navigation tabs for code view */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 bg-slate-950/70 px-4 py-2.5 gap-2">
          <div className="flex items-center gap-1">
            {[
              { id: 'docker', label: 'docker-compose.yml' },
              { id: 'schema', label: 'schema.sql (TimescaleDB)' },
              { id: 'terraform', label: 'terraform/main.tf' },
              { id: 'openapi', label: 'openapi.json (REST Spec)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCodeTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeCodeTab === tab.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadActive}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              <Download className="h-3 w-3" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        <pre className="p-4 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre max-h-[500px]">
          {getActiveCode()}
        </pre>
      </div>

      {/* Production Deployment & Runbook Guide */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Local Deployment Instructions</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
            <span className="font-semibold text-white">Step 1: Clone & Configure</span>
            <p className="mt-1 font-mono text-[11px] text-slate-400">
              git clone https://github.com/aegis/cybernexus-soc.git<br />
              cd cybernexus-soc &amp;&amp; cp .env.example .env
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
            <span className="font-semibold text-white">Step 2: Start Full Stack</span>
            <p className="mt-1 font-mono text-[11px] text-slate-400">
              docker compose up -d<br />
              # Spawns Postgres, TimescaleDB, Redis &amp; API
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
            <span className="font-semibold text-white">Step 3: Ingest Test Telemetry</span>
            <p className="mt-1 font-mono text-[11px] text-slate-400">
              {'curl -X POST http://localhost:8080/api/logs/ingest \\'}
              <br />
              {"  -d '{\"eventType\":\"AUTH_FAIL\"}'"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
