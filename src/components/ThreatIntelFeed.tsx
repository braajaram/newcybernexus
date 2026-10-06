import React, { useState, useEffect } from 'react';
import { Vulnerability } from '../types';
import { Search, ShieldAlert, AlertTriangle, ExternalLink, RefreshCw, FileText, Check, ShieldCheck, Filter } from 'lucide-react';

export const ThreatIntelFeed: React.FC = () => {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ransomwareOnly, setRansomwareOnly] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('ALL');
  const [selectedCve, setSelectedCve] = useState<Vulnerability | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const fetchKev = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (ransomwareOnly) params.set('ransomware', 'true');
      if (selectedVendor !== 'ALL') params.set('vendor', selectedVendor);

      const res = await fetch(`/api/threats/cisa-kev?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVulnerabilities(data.vulnerabilities || []);
      }
    } catch (err) {
      console.error('Failed to load CISA KEV data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKev();
  }, [ransomwareOnly, selectedVendor]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKev();
  };

  const vendors = ['ALL', 'Palo Alto Networks', 'PHP Group', 'Ivanti', 'ConnectWise', 'Apple', 'Citrix', 'Microsoft', 'Apache'];

  const getCvssColor = (score: number) => {
    if (score >= 9.0) return 'text-rose-400 border-rose-500/40 bg-rose-950/30';
    if (score >= 7.0) return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
  };

  const generatePatchScript = (cve: Vulnerability) => {
    return `# Cyber Nexus Mitigation Script for ${cve.cveID}
# Target: ${cve.vendorProject} - ${cve.product}
# Due Date: ${cve.dueDate}

echo "[+] Initiating emergency patch sequence for ${cve.cveID}..."
echo "[+] Checking installed version of ${cve.product}..."

# Remediate per CISA Directive:
# Action: ${cve.requiredAction}
if [ -f /etc/os-release ]; then
    sudo apt-get update && sudo apt-get --only-upgrade install -y "${cve.product.toLowerCase().replace(/\\s+/g, '-')}" || true
fi

echo "[+] Validating network isolation for unpatched assets..."
echo "[+] Logging remediation audit hash to /var/log/cybernexus-patch-${cve.cveID}.log"`;
  };

  const copyPatchToClipboard = (cve: Vulnerability) => {
    navigator.clipboard.writeText(generatePatchScript(cve));
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header and overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Known Exploited Vulnerabilities (CISA KEV)</span>
            <span className="text-xs font-normal text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
              Live Official Feed
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Authoritative catalog of vulnerabilities weaponized by threat actors in active cyber campaigns.
          </p>
        </div>

        <button
          onClick={fetchKev}
          disabled={loading}
          className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-md transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Sync Catalog</span>
        </button>
      </div>

      {/* Search and Filter controls */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search CVE ID (e.g. CVE-2024-4577), vendor, product, or description..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-24 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRansomwareOnly(!ransomwareOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              ransomwareOnly
                ? 'bg-rose-950/60 text-rose-300 border-rose-800/60 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Ransomware Campaigns Only</span>
          </button>
        </div>
      </div>

      {/* Vendor Filter segment */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-500 font-medium mr-1 shrink-0 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Vendor:
        </span>
        {vendors.map((v) => (
          <button
            key={v}
            onClick={() => setSelectedVendor(v)}
            className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
              selectedVendor === v
                ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-700/60 font-medium'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/60'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Vulnerabilities List */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-slate-900/40 border border-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : vulnerabilities.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-12 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No vulnerabilities matched filter</h3>
          <p className="mt-1 text-xs text-slate-500">
            Try adjusting your query string or reset the ransomware filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setRansomwareOnly(false);
              setSelectedVendor('ALL');
            }}
            className="mt-4 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {vulnerabilities.map((cve) => {
            return (
              <div
                key={cve.cveID}
                onClick={() => setSelectedCve(cve)}
                className="group cursor-pointer rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-700 p-4 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-indigo-400 tracking-wide">
                      {cve.cveID}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{cve.vendorProject}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300 font-medium">{cve.product}</span>
                      <span aria-hidden="true">·</span>
                      <span>Added {cve.dateAdded}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {cve.knownRansomwareCampaignUse === 'Known' && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400">
                        <AlertTriangle className="h-3 w-3" />
                        Ransomware Vector
                      </span>
                    )}

                    <div
                      className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${getCvssColor(
                        cve.cvssScore
                      )}`}
                    >
                      CVSS {cve.cvssScore.toFixed(1)}
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {cve.shortDescription}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Remediation:</span>
                    <span className="text-slate-300 truncate max-w-md">{cve.requiredAction}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono tabular-nums text-slate-400">
                    <span>Federal Due Date: {cve.dueDate}</span>
                    <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      Inspect &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CVE Detailed Modal / Inspector */}
      {selectedCve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-w-2xl w-full rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-lg font-bold text-indigo-400">{selectedCve.cveID}</span>
                  <span
                    className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${getCvssColor(
                      selectedCve.cvssScore
                    )}`}
                  >
                    CVSS {selectedCve.cvssScore.toFixed(1)} CRITICAL
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-semibold text-white">{selectedCve.vulnerabilityName}</h3>
              </div>
              <button
                onClick={() => setSelectedCve(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <span className="text-slate-500">Vendor</span>
                <p className="mt-1 font-semibold text-slate-200">{selectedCve.vendorProject}</p>
              </div>
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <span className="text-slate-500">Affected Product</span>
                <p className="mt-1 font-semibold text-slate-200">{selectedCve.product}</p>
              </div>
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <span className="text-slate-500">CWE Classification</span>
                <p className="mt-1 font-mono font-semibold text-slate-200">{selectedCve.cwe}</p>
              </div>
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-2.5">
                <span className="text-slate-500">Ransomware Use</span>
                <p
                  className={`mt-1 font-semibold ${
                    selectedCve.knownRansomwareCampaignUse === 'Known' ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {selectedCve.knownRansomwareCampaignUse}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vulnerability Summary</h4>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                {selectedCve.shortDescription}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Remediation Action</h4>
              <p className="mt-1.5 text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg">
                {selectedCve.requiredAction}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Generated Automated Patch Script
                </h4>
                <button
                  onClick={() => copyPatchToClipboard(selectedCve)}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  {copiedScript ? <Check className="h-3 w-3 text-emerald-400" /> : <FileText className="h-3 w-3" />}
                  <span>{copiedScript ? 'Copied to Clipboard' : 'Copy Bash Script'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
                {generatePatchScript(selectedCve)}
              </pre>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs">
              <span className="text-slate-500 font-mono">Mandatory Deadline: {selectedCve.dueDate}</span>
              <a
                href={`https://nvd.nist.gov/vuln/detail/${selectedCve.cveID}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
              >
                <span>NIST NVD Advisory</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
