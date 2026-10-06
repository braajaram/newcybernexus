import React, { useState } from 'react';
import { UrlScanResult, IocScanResult } from '../types';
import { Globe, ShieldCheck, ShieldAlert, AlertTriangle, Key, Search, ArrowRight, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';

export const SecurityScanners: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'url' | 'ioc' | 'entropy'>('url');

  // URL Scanner State
  const [targetUrl, setTargetUrl] = useState('https://github.com');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlResult, setUrlResult] = useState<UrlScanResult | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  // IOC Scanner State
  const [indicatorInput, setIndicatorInput] = useState('185.220.101.5');
  const [iocLoading, setIocLoading] = useState(false);
  const [iocResult, setIocResult] = useState<IocScanResult | null>(null);

  // Entropy Calculator State
  const [passwordInput, setPasswordInput] = useState('Tr0ub4dor&3#2026!');
  const [copiedConfig, setCopiedConfig] = useState(false);

  // Run URL Scan
  const handleUrlScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetUrl.trim()) return;

    setUrlLoading(true);
    setUrlError(null);
    try {
      const res = await fetch('/api/scan/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: targetUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUrlError(data.error || 'Failed to scan URL');
      } else {
        setUrlResult(data);
      }
    } catch (err: any) {
      setUrlError(err.message || 'Network request failed');
    } finally {
      setUrlLoading(false);
    }
  };

  // Run IOC Scan
  const handleIocScan = async (indicatorVal?: string) => {
    const val = indicatorVal || indicatorInput;
    if (!val.trim()) return;

    setIocLoading(true);
    try {
      const res = await fetch('/api/scan/ioc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicator: val.trim() }),
      });
      const data = await res.json();
      setIocResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIocLoading(false);
    }
  };

  // Calculate Shannon Entropy
  const calculateEntropy = (str: string) => {
    if (!str) return { entropy: 0, crackTime: 'Instant', poolSize: 0, strength: 'Very Weak' };
    const len = str.length;
    const freqs: Record<string, number> = {};
    for (const char of str) {
      freqs[char] = (freqs[char] || 0) + 1;
    }

    let entropy = 0;
    for (const char in freqs) {
      const p = freqs[char] / len;
      entropy -= p * Math.log2(p);
    }
    const totalEntropy = entropy * len;

    let pool = 0;
    if (/[a-z]/.test(str)) pool += 26;
    if (/[A-Z]/.test(str)) pool += 26;
    if (/[0-9]/.test(str)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(str)) pool += 33;

    // Combinations = pool ^ length
    const combinations = Math.pow(pool || 1, len);
    // Assume 10 billion hashes/sec on modern GPU array
    const hashesPerSec = 1e10;
    const seconds = combinations / hashesPerSec;

    let crackTime = 'Instant';
    if (seconds > 3.15e10) crackTime = '> 1,000 Years';
    else if (seconds > 3.15e7) crackTime = `${Math.round(seconds / 3.15e7)} Years`;
    else if (seconds > 86400) crackTime = `${Math.round(seconds / 86400)} Days`;
    else if (seconds > 3600) crackTime = `${Math.round(seconds / 3600)} Hours`;
    else if (seconds > 60) crackTime = `${Math.round(seconds / 60)} Minutes`;
    else if (seconds > 1) crackTime = `${Math.round(seconds)} Seconds`;

    let strength = 'Weak';
    if (totalEntropy > 70) strength = 'Very Strong';
    else if (totalEntropy > 50) strength = 'Strong';
    else if (totalEntropy > 35) strength = 'Moderate';

    return {
      entropyPerChar: entropy.toFixed(2),
      totalEntropy: totalEntropy.toFixed(1),
      poolSize: pool,
      crackTime,
      strength,
    };
  };

  const entropyStats = calculateEntropy(passwordInput);

  const getNginxConfigSnippet = () => {
    return `# Recommended Hardened Security Headers (Nginx)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;`;
  };

  return (
    <div className="space-y-6">
      {/* Subtab selection */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg max-w-md">
        <button
          onClick={() => setActiveSubTab('url')}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
            activeSubTab === 'url'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          HTTP & TLS Scanner
        </button>
        <button
          onClick={() => setActiveSubTab('ioc')}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
            activeSubTab === 'ioc'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          IOC Threat Lookup
        </button>
        <button
          onClick={() => setActiveSubTab('entropy')}
          className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
            activeSubTab === 'entropy'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Entropy & Passwords
        </button>
      </div>

      {/* 1. URL & HTTP Security Headers Scanner */}
      {activeSubTab === 'url' && (
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-base font-semibold text-white">Live HTTP Security Header & TLS Inspector</h2>
            <p className="mt-1 text-xs text-slate-400">
              Performs real live probing of remote endpoints to evaluate HSTS, Content-Security-Policy, iframe framing, and DNS records.
            </p>

            <form onSubmit={handleUrlScan} className="mt-4 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="e.g. https://github.com or cloudflare.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={urlLoading}
                className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                {urlLoading ? (
                  <span className="animate-pulse">Inspecting Remote Host...</span>
                ) : (
                  <>
                    <span>Inspect Target</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
              <span>Quick tests:</span>
              <button
                type="button"
                onClick={() => {
                  setTargetUrl('https://github.com');
                  setTimeout(handleUrlScan, 50);
                }}
                className="hover:text-indigo-400 underline"
              >
                github.com
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setTargetUrl('https://cloudflare.com');
                  setTimeout(handleUrlScan, 50);
                }}
                className="hover:text-indigo-400 underline"
              >
                cloudflare.com
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setTargetUrl('http://testphp.vulnweb.com');
                  setTimeout(handleUrlScan, 50);
                }}
                className="hover:text-rose-400 underline"
              >
                testphp.vulnweb.com (Vulnerable demo)
              </button>
            </div>
          </div>

          {urlError && (
            <div className="rounded-lg border border-rose-800/60 bg-rose-950/30 p-4 text-xs text-rose-300">
              <p className="font-semibold">Inspection Failed</p>
              <p className="mt-1">{urlError}</p>
            </div>
          )}

          {urlResult && (
            <div className="space-y-4">
              {/* Summary Grade Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border font-mono text-2xl font-black ${
                      urlResult.grade.startsWith('A')
                        ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400'
                        : urlResult.grade === 'B'
                        ? 'border-sky-500/50 bg-sky-950/40 text-sky-400'
                        : urlResult.grade === 'C'
                        ? 'border-amber-500/50 bg-amber-950/40 text-amber-400'
                        : 'border-rose-500/50 bg-rose-950/40 text-rose-400'
                    }`}
                  >
                    {urlResult.grade}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{urlResult.hostname}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span>Status {urlResult.statusCode}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{urlResult.latencyMs}ms RTT</span>
                      <span aria-hidden="true">·</span>
                      <span>Resolved IPs: {urlResult.ipAddresses.slice(0, 2).join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400">Score</span>
                  <p className="font-mono text-lg font-bold text-white tabular-nums">
                    {urlResult.overallScore} / 100
                  </p>
                </div>
              </div>

              {/* Individual Header Checks */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/30 overflow-hidden">
                <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Security Headers Assessment
                </div>
                <div className="divide-y divide-slate-800">
                  {urlResult.checks.map((check) => (
                    <div key={check.header} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {check.present ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{check.name}</span>
                            <span
                              className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                                check.present
                                  ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-900'
                                  : 'text-rose-400 bg-rose-950/60 border border-rose-900'
                              }`}
                            >
                              {check.present ? 'IMPLEMENTED' : 'MISSING'}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-400">{check.impact}</p>
                          {check.value && (
                            <p className="mt-1 font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-1 rounded truncate max-w-xl">
                              {check.value}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-medium text-slate-400 tabular-nums">
                          {check.present ? `+${check.points}` : '0'} / {check.points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remediation Snippet */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-200">Recommended Hardening Config (Nginx / Cloudflare)</h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getNginxConfigSnippet());
                      setCopiedConfig(true);
                      setTimeout(() => setCopiedConfig(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    {copiedConfig ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedConfig ? 'Copied' : 'Copy Directive'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
                  {getNginxConfigSnippet()}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. IOC Threat Lookup */}
      {activeSubTab === 'ioc' && (
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-base font-semibold text-white">Indicator of Compromise (IOC) Analyzer</h2>
            <p className="mt-1 text-xs text-slate-400">
              Analyze suspicious IP addresses, domain names, and cryptographic file hashes (SHA-256, SHA-1, MD5) for threat correlation.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={indicatorInput}
                  onChange={(e) => setIndicatorInput(e.target.value)}
                  placeholder="Enter IP (e.g. 185.220.101.5), SHA-256 hash, or domain..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleIocScan()}
                disabled={iocLoading}
                className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                {iocLoading ? 'Evaluating IOC...' : 'Analyze Indicator'}
              </button>
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500 overflow-x-auto">
              <span className="shrink-0">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setIndicatorInput('185.220.101.5');
                  handleIocScan('185.220.101.5');
                }}
                className="hover:text-rose-400 font-mono underline shrink-0"
              >
                185.220.101.5 (Tor Exit)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setIndicatorInput('10.0.4.12');
                  handleIocScan('10.0.4.12');
                }}
                className="hover:text-emerald-400 font-mono underline shrink-0"
              >
                10.0.4.12 (RFC1918 Private)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  const hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
                  setIndicatorInput(hash);
                  handleIocScan(hash);
                }}
                className="hover:text-indigo-400 font-mono underline shrink-0"
              >
                SHA-256 Hash
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setIndicatorInput('data-sync.ns-tunnel.xyz');
                  handleIocScan('data-sync.ns-tunnel.xyz');
                }}
                className="hover:text-amber-400 font-mono underline shrink-0"
              >
                ns-tunnel.xyz (DGA Domain)
              </button>
            </div>
          </div>

          {iocResult && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-white">{iocResult.indicator}</span>
                    <span className="text-[11px] text-slate-400 font-medium">({iocResult.type})</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300 font-medium">{iocResult.classification}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500">Threat Score</span>
                    <p
                      className={`font-mono text-base font-bold ${
                        iocResult.threatScore > 70
                          ? 'text-rose-400'
                          : iocResult.threatScore > 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {iocResult.threatScore} / 100
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(iocResult.details).map(([k, v]) => (
                  <div key={k} className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-[11px] text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <p className="mt-1 font-mono text-xs text-slate-200">
                      {Array.isArray(v) ? v.join(', ') : String(v)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Password & Hash Entropy Tester */}
      {activeSubTab === 'entropy' && (
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-base font-semibold text-white">Cryptographic Entropy & Brute-Force Calculator</h2>
            <p className="mt-1 text-xs text-slate-400">
              Evaluates Shannon bit entropy ($H = -\sum p_i \log_2 p_i$) and calculates brute-force resistance against high-performance GPU hash clusters.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Test Passphrase / Secret String:
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password or secret..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-[11px] text-slate-500">Total Entropy</span>
                  <p className="mt-1 font-mono text-base font-bold text-indigo-400 tabular-nums">
                    {entropyStats.totalEntropy} bits
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-[11px] text-slate-500">Character Pool</span>
                  <p className="mt-1 font-mono text-base font-bold text-white tabular-nums">
                    {entropyStats.poolSize} glyphs
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-[11px] text-slate-500">RTX 4090 Crack Time</span>
                  <p className="mt-1 font-mono text-base font-bold text-emerald-400 tabular-nums">
                    {entropyStats.crackTime}
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-[11px] text-slate-500">Strength Tier</span>
                  <p
                    className={`mt-1 font-mono text-base font-bold ${
                      entropyStats.strength === 'Very Strong'
                        ? 'text-emerald-400'
                        : entropyStats.strength === 'Strong'
                        ? 'text-indigo-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {entropyStats.strength}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
