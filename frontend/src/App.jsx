import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import VisualDiff from "./VisualDiff";
import SmartCSSFix from "./SmartCSSFix";
const API = "http://127.0.0.1:8000";
const VIEWPORTS = ["desktop", "tablet", "mobile"];

function safeJSON(value, fallback) {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeInspection(item = {}) {
  const findings = safeJSON(item.findings ?? item.findings_json, []);
  const screenshots = safeJSON(
    item.screenshots ?? item.screenshots_json,
    {}
  );

  return {
    ...item,
    id: item.id ?? item.inspection_id ?? "",
    url: item.url ?? "",
    title: item.title ?? "",
    status: item.status ?? "completed",
    created_at: item.created_at ?? "",
    findings: Array.isArray(findings) ? findings : [],
    screenshots:
      screenshots && typeof screenshots === "object" && !Array.isArray(screenshots)
        ? screenshots
        : {},
  };
}

function severityClass(value = "warning") {
  const severity = String(value).toLowerCase();
  if (severity === "critical" || severity === "high") return "high";
  if (severity === "medium") return "medium";
  if (severity === "low") return "low";
  return "warning";
}

function screenshotUrl(path) {
  if (!path) return "";
  const value = String(path);

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.pathname.startsWith("/screenshots/")) {
        return `${API}${parsed.pathname}${parsed.search}`;
      }
      return value;
    } catch {
      return value;
    }
  }

  const filename = value.split(/[\\/]/).pop();
  return `${API}/screenshots/${encodeURIComponent(filename)}`;
}

function findingType(finding) {
  return finding.rule_id ?? finding.type ?? "UI issue";
}

function exportCSV(findings, inspection) {
  if (!findings.length) return;

  const headers = ["Website", "Issue Type", "Description", "Severity", "Viewport", "Evidence"];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = findings.map((item) => [
    inspection?.url,
    findingType(item),
    item.description ?? item.message,
    item.severity,
    item.viewport,
    item.evidence,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = "omnisight-quality-report.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function buildFixPlan(findings = []) {
  const fixSuggestions = {
    overlap: {
      title: "Fix overlapping elements",
      solution:
        "Check element positioning, z-index, margins, and container dimensions. Use responsive layouts to prevent elements from overlapping.",
    },
    alignment: {
      title: "Correct element alignment",
      solution:
        "Review flexbox or grid alignment properties. Ensure elements are consistently aligned across screen sizes.",
    },
    overflow: {
      title: "Fix content overflow",
      solution:
        "Check container width, padding, and overflow properties. Use max-width: 100% and responsive sizing where appropriate.",
    },
    font: {
      title: "Improve text readability",
      solution:
        "Use readable font sizes, suitable line heights, and responsive typography.",
    },
    image: {
      title: "Fix image sizing",
      solution:
        "Use max-width: 100%, height: auto, and an appropriate object-fit value.",
    },
    spacing: {
      title: "Improve spacing",
      solution:
        "Review margins, padding, and gaps to create consistent spacing between elements.",
    },
  };

  const getSeverity = (severity) => {
    const value = String(severity ?? "").toLowerCase();

    if (value.includes("critical")) return 4;
    if (value.includes("high")) return 3;
    if (value.includes("medium")) return 2;
    if (value.includes("low")) return 1;

    return 1;
  };

  const getSuggestion = (finding) => {
    const text = [
      finding.rule_id,
      finding.type,
      finding.title,
      finding.message,
      finding.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (text.includes("overlap")) return fixSuggestions.overlap;
    if (text.includes("align")) return fixSuggestions.alignment;
    if (text.includes("overflow")) return fixSuggestions.overflow;
    if (text.includes("font") || text.includes("text")) {
      return fixSuggestions.font;
    }
    if (text.includes("image")) return fixSuggestions.image;
    if (text.includes("spacing") || text.includes("margin")) {
      return fixSuggestions.spacing;
    }

    return {
      title: "Review this UI issue",
      solution:
        finding.recommendation ||
        "Inspect the affected element and check its CSS properties at the reported viewport.",
    };
  };

  return findings
    .map((finding, index) => ({
      ...finding,
      planId: index + 1,
      priority: getSeverity(finding.severity),
      suggestion: getSuggestion(finding),
    }))
    .sort((a, b) => b.priority - a.priority);
}

function SmartFixPlanner({ findings = [] }) {
  const fixPlan = buildFixPlan(findings);

  const priorityLabel = (priority) => {
    if (priority === 4) return "Critical";
    if (priority === 3) return "High";
    if (priority === 2) return "Medium";
    return "Low";
  };

  const priorityColor = (priority) => {
    if (priority === 4) return "critical";
    if (priority === 3) return "high";
    if (priority === 2) return "medium";
    return "low";
  };

  const copyFixPlan = () => {
    const report = fixPlan
      .map(
        (item, index) =>
          `${index + 1}. ${item.suggestion.title}\n` +
          `Priority: ${priorityLabel(item.priority)}\n` +
          `Viewport: ${item.viewport || "Not specified"}\n` +
          `Suggested fix: ${item.suggestion.solution}`
      )
      .join("\n\n");

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(report)
        .then(() => alert("Fix plan copied successfully!"))
        .catch(() => alert("Unable to copy the fix plan."));
    } else {
      alert("Clipboard is not supported in this browser.");
    }
  };

  const criticalCount = fixPlan.filter(
    (item) => item.priority === 4
  ).length;

  const highCount = fixPlan.filter(
    (item) => item.priority === 3
  ).length;

  return (
    <section className="smart-fix-planner">
      <div className="planner-header">
        <div>
          <span className="planner-eyebrow">OMNISIGHT INTELLIGENCE</span>
          <h2>Smart Fix Planner</h2>
          <p>
            Prioritized recommendations to help you fix website UI issues.
          </p>
        </div>

        <button
          className="copy-plan-button"
          onClick={copyFixPlan}
          disabled={fixPlan.length === 0}
        >
          Copy Fix Plan
        </button>
      </div>

      <div className="planner-summary">
        <div className="planner-stat">
          <strong>{fixPlan.length}</strong>
          <span>Total issues</span>
        </div>

        <div className="planner-stat">
          <strong>{criticalCount}</strong>
          <span>Critical issues</span>
        </div>

        <div className="planner-stat">
          <strong>{highCount}</strong>
          <span>High priority</span>
        </div>
      </div>

      {fixPlan.length === 0 ? (
        <div className="planner-empty">
          <h3>No issues to plan!</h3>
          <p>Run a website inspection to generate suggested fixes.</p>
        </div>
      ) : (
        <div className="fix-plan-list">
          {fixPlan.map((item, index) => (
            <article className="fix-plan-card" key={item.id ?? item.planId}>
              <div className="fix-plan-top">
                <span className="fix-number">#{index + 1}</span>

                <span
                  className={`priority-badge ${priorityColor(
                    item.priority
                  )}`}
                >
                  {priorityLabel(item.priority)} Priority
                </span>
              </div>

              <h3>{item.suggestion.title}</h3>

              <p className="fix-description">
                {item.message ||
                  item.description ||
                  item.title ||
                  "UI issue detected during inspection."}
              </p>

              <div className="fix-viewport">
                Viewport: <strong>{item.viewport || "Not specified"}</strong>
              </div>

              <div className="suggested-solution">
                <strong>Suggested solution</strong>
                <p>{item.suggestion.solution}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function App() {
  const [url, setUrl] = useState("https://example.com");
  const [inspection, setInspection] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeViewport, setActiveViewport] = useState("desktop");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [viewportFilter, setViewportFilter] = useState("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [plannerOpen, setPlannerOpen] = useState(true);
  const [copiedPlan, setCopiedPlan] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API}/api/inspections`);
      if (!response.ok) throw new Error("Could not load inspection history.");
      const data = await response.json();
      const records = Array.isArray(data) ? data : data.inspections ?? data.items ?? [];
      setHistory(Array.isArray(records) ? records.map(normalizeInspection) : []);
    } catch (err) {
      setError((current) => current || err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const findings = useMemo(
    () => (Array.isArray(inspection?.findings) ? inspection.findings : []),
    [inspection]
  );

  const issueTypes = useMemo(
    () => [...new Set(findings.map(findingType))],
    [findings]
  );

  const filteredFindings = useMemo(
    () =>
      findings.filter((finding) => {
        const severityMatch =
          severityFilter === "all" ||
          severityClass(finding.severity) === severityFilter;
        const viewportMatch =
          viewportFilter === "all" ||
          String(finding.viewport ?? "").toLowerCase() === viewportFilter;
        const typeMatch =
          issueTypeFilter === "all" || findingType(finding) === issueTypeFilter;
        return severityMatch && viewportMatch && typeMatch;
      }),
    [findings, severityFilter, viewportFilter, issueTypeFilter]
  );

  const counts = useMemo(
    () => ({
      high: findings.filter((f) => severityClass(f.severity) === "high").length,
      medium: findings.filter((f) => severityClass(f.severity) === "medium").length,
      warning: findings.filter((f) => severityClass(f.severity) === "warning").length,
      low: findings.filter((f) => severityClass(f.severity) === "low").length,
    }),
    [findings]
  );

  const viewportStats = useMemo(
    () =>
      VIEWPORTS.map((viewport) => ({
        name: viewport,
        count: findings.filter(
          (f) => String(f.viewport ?? "").toLowerCase() === viewport
        ).length,
      })),
    [findings]
  );

  const passedViewports = viewportStats.filter((item) => item.count === 0).length;
  const passRate = Math.round((passedViewports / VIEWPORTS.length) * 100);
  const uniqueIssueCount = new Set(findings.map(findingType)).size;
  const screenshots = inspection?.screenshots ?? {};
  const activeScreenshot = screenshots[activeViewport] ?? "";

  // Smart Fix Planner: transparent, rule-based prioritization using current findings.
  const fixPlan = useMemo(() => {
    const grouped = new Map();

    findings.forEach((finding) => {
      const key = findingType(finding);
      const current = grouped.get(key) ?? {
        type: key,
        severity: "low",
        viewports: new Set(),
        count: 0,
        examples: [],
      };

      const rank = { low: 1, warning: 2, medium: 3, high: 4 };
      const nextSeverity = severityClass(finding.severity);
      if ((rank[nextSeverity] ?? 2) > (rank[current.severity] ?? 1)) {
        current.severity = nextSeverity;
      }
      if (finding.viewport) current.viewports.add(String(finding.viewport).toLowerCase());
      current.count += 1;
      if (current.examples.length < 2) {
        current.examples.push(finding.description ?? finding.message ?? "Review this issue.");
      }
      grouped.set(key, current);
    });

    return [...grouped.values()]
      .map((item) => {
        const viewportCount = item.viewports.size;
        const severityPoints = { high: 40, medium: 25, warning: 12, low: 5 }[item.severity] ?? 10;
        const reachPoints = viewportCount * 15;
        const repeatPoints = Math.min(item.count * 3, 15);
        return {
          ...item,
          viewportList: [...item.viewports],
          score: Math.min(100, severityPoints + reachPoints + repeatPoints),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [findings]);

  const priorityLabel = (score) =>
    score >= 70 ? "Fix first" : score >= 40 ? "Plan next" : "Monitor";

  function resetFilters() {
    setSeverityFilter("all");
    setViewportFilter("all");
    setIssueTypeFilter("all");
  }

  async function runInspection(event) {
    event.preventDefault();
    const target = url.trim();

    if (!/^https?:\/\/.+/i.test(target)) {
      setError("Enter a valid URL beginning with http:// or https://.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target, viewports: VIEWPORTS }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.detail
            ? typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail)
            : "The inspection request failed."
        );
      }

      setInspection(normalizeInspection(data));
      setActiveViewport("desktop");
      resetFilters();
      await loadHistory();
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setError(`${err.message} Check that the backend is running at ${API}.`);
    } finally {
      setLoading(false);
    }
  }

  async function openHistory(item) {
    setError("");
    if (item.id) {
      try {
        const response = await fetch(
          `${API}/api/inspections/${encodeURIComponent(item.id)}`
        );
        if (response.ok) {
          setInspection(normalizeInspection(await response.json()));
          setActiveViewport("desktop");
          resetFilters();
          document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
          return;
        }
      } catch {
        // Use the record already available in history.
      }
    }
    setInspection(normalizeInspection(item));
    setActiveViewport("desktop");
    resetFilters();
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
  }

  async function copyFixPlan() {
    const text = [
      `OmniSight Fix Plan — ${inspection?.url ?? "Website"}`,
      "",
      ...fixPlan.map(
        (item, index) =>
          `${index + 1}. ${item.type} | ${item.severity.toUpperCase()} | ${priorityLabel(item.score)} | ${item.viewportList.join(", ") || "Viewport not specified"} | ${item.count} occurrence(s)`
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlan(true);
      window.setTimeout(() => setCopiedPlan(false), 1800);
    } catch {
      setError("Clipboard access was blocked by the browser. You can still export the findings as CSV.");
    }
  }

  function navigate(section) {
    setActiveSection(section);
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setActiveSection("overview")}>
          <span className="brand-mark">O</span>
          <span className="brand-copy">
            <strong>OmniSight</strong>
            <small>Quality intelligence</small>
          </span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <button className={`nav-item ${activeSection === "overview" ? "active" : ""}`} onClick={() => navigate("overview")}>
          <span className="nav-icon">◫</span> Overview
        </button>
        <button className={`nav-item ${activeSection === "results" ? "active" : ""}`} onClick={() => navigate("results")}>
          <span className="nav-icon">⌁</span> Latest results
        </button>
        <button className={`nav-item ${activeSection === "history" ? "active" : ""}`} onClick={() => navigate("history")}>
          <span className="nav-icon">◷</span> History
          <span className="nav-count">{history.length}</span>
        </button>

        <div className="sidebar-bottom">
          <span className="live-dot" />
          <span>API workspace</span>
          <small>Local environment</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar" id="overview">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> RESPONSIVE QUALITY ASSURANCE</div>
            <h1>UI Inspection Dashboard</h1>
            <p className="muted">One scan. Three screens. A clearer picture of your website quality.</p>
          </div>
          <div className="topbar-right">
            <span className="system-pill"><span className="live-dot" /> SYSTEM READY</span>
            <span className="version-pill">MVP <b>0.2</b></span>
          </div>
        </header>

        <section className="hero-panel">
          <div className="hero-orb orb-one" />
          <div className="hero-orb orb-two" />
          <div className="hero-content">
            <div className="section-kicker"><span /> WEBSITE ANALYSIS</div>
            <h2>Make every viewport count.</h2>
            <p>Scan a website across desktop, tablet and mobile. Find layout issues before your users do.</p>
            <form className="inspect-form" onSubmit={runInspection}>
              <label htmlFor="website-url">WEBSITE URL</label>
              <div className="url-row">
                <span className="url-prefix">↗</span>
                <input
                  id="website-url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://yourwebsite.com"
                  required
                />
                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Scanning…</> : <>Run inspection <span>↗</span></>}
                </button>
              </div>
              <div className="scan-meta">
                <span>✓ Desktop <b>1440px</b></span>
                <span>✓ Tablet <b>768px</b></span>
                <span>✓ Mobile <b>390px</b></span>
                <span className="scan-time">● Multi-viewport scan</span>
              </div>
            </form>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-glow" />
            <div className="device device-desktop"><div className="device-bar"><i /><i /><i /></div><div className="device-screen"><div className="mock-nav" /><div className="mock-heading" /><div className="mock-line" /><div className="mock-line short" /><div className="mock-cards"><i /><i /><i /></div></div></div>
            <div className="device device-mobile"><div className="mobile-notch" /><div className="mobile-screen"><div className="mock-nav" /><div className="mock-heading" /><div className="mock-line" /><div className="mock-card" /><div className="mock-line short" /></div></div>
            <div className="visual-tag"><span>✦</span> Responsive scan</div>
          </div>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <span className="error-symbol">!</span>
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button>
          </div>
        )}

        <section className="results-section" id="results">
          <div className="section-title-row">
            <div>
              <div className="eyebrow">LATEST RESULTS</div>
              <h2>Inspection overview</h2>
              <p className="muted">{inspection ? inspection.url : "Your latest scan will appear here."}</p>
            </div>
            {inspection && <span className="complete-pill"><span /> SCAN COMPLETE</span>}
          </div>

          {!inspection ? (
            <div className="empty-state">
              <div className="empty-art">⌕</div>
              <h3>Your workspace is ready</h3>
              <p>Enter a website above to generate your first responsive quality report.</p>
            </div>
          ) : (
            <>
              <div className="overview-grid">
                <article className="health-card">
                  <div className="card-topline"><span>RESPONSIVE HEALTH</span><span className="tiny-chip">RULE-BASED</span></div>
                  <div className="health-main">
                    <div className="health-ring" style={{ "--progress": `${passRate}%` }}>
                      <div><strong>{passRate}<small>%</small></strong><span>pass rate</span></div>
                    </div>
                    <div className="health-copy">
                      <h3>{passedViewports} of 3 viewports clear</h3>
                      <p>{passedViewports === 3 ? "No findings were reported across the tested viewports." : "Viewports without reported findings. This is a rule-based signal, not a complete accessibility or UX score."}</p>
                      <div className="viewport-mini-list">
                        {viewportStats.map((item) => (
                          <span key={item.name} className={item.count === 0 ? "is-clear" : "has-issues"}>
                            <i /> {item.name} <b>{item.count}</b>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>

                <article className="metric-card metric-total">
                  <div className="metric-icon">⌁</div><span>TOTAL FINDINGS</span><strong>{findings.length}</strong><small>Across all viewports</small>
                  <div className="metric-spark"><i /><i /><i /><i /><i /><i /><i /></div>
                </article>
                <article className="metric-card metric-high">
                  <div className="metric-icon">↗</div><span>HIGH PRIORITY</span><strong>{counts.high}</strong><small>Fix these first</small>
                </article>
                <article className="metric-card metric-medium">
                  <div className="metric-icon">◈</div><span>MEDIUM PRIORITY</span><strong>{counts.medium}</strong><small>Review and improve</small>
                </article>
                <article className="metric-card metric-warning">
                  <div className="metric-icon">△</div><span>WARNINGS</span><strong>{counts.warning}</strong><small>Potential improvements</small>
                </article>
              </div>

              <div className="analysis-grid">
                <section className="content-panel severity-panel">
                  <div className="panel-heading">
                    <div><span className="panel-overline">ISSUE DISTRIBUTION</span><h3>Severity breakdown</h3><p>Understand the risk profile of this scan.</p></div>
                    <span className="panel-icon">◉</span>
                  </div>
                  <div className="severity-bars">
                    {[
                      ["High", counts.high, "high"],
                      ["Medium", counts.medium, "medium"],
                      ["Warning", counts.warning, "warning"],
                      ["Low", counts.low, "low"],
                    ].map(([label, count, kind]) => (
                      <div className="severity-line" key={kind}>
                        <div className="severity-line-label"><span className={`severity-dot ${kind}`} />{label}<b>{count}</b></div>
                        <div className="bar-track"><i className={kind} style={{ width: `${findings.length ? (count / findings.length) * 100 : 0}%` }} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="severity-footer"><span>{uniqueIssueCount} unique issue types</span><span>{findings.length} total records</span></div>
                </section>

                <section className="content-panel viewport-panel">
                  <div className="panel-heading">
                    <div><span className="panel-overline">DEVICE COVERAGE</span><h3>Viewport health</h3><p>Find where issues are concentrated.</p></div>
                    <span className="panel-icon">▣</span>
                  </div>
                  <div className="viewport-health-list">
                    {viewportStats.map((item, index) => (
                      <div className="viewport-health-row" key={item.name}>
                        <span className={`viewport-device-icon device-${item.name}`}>{index === 0 ? "▰" : index === 1 ? "▭" : "▯"}</span>
                        <div className="viewport-health-info"><strong>{item.name}</strong><small>{item.count ? `${item.count} issue(s) found` : "No findings reported"}</small></div>
                        <span className={`viewport-status ${item.count ? "attention" : "clear"}`}>{item.count ? "Review" : "Clear"}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="content-panel planner-panel">
                <button className="planner-heading" type="button" onClick={() => setPlannerOpen(!plannerOpen)} aria-expanded={plannerOpen}>
                  <span className="planner-symbol">✦</span>
                  <span className="planner-heading-copy"><span className="panel-overline">OMNISIGHT INTELLIGENCE</span><strong>Smart Fix Planner</strong><small>Prioritize fixes by severity, viewport reach and repeated occurrences.</small></span>
                  <span className="planner-count">{fixPlan.length} priorities</span>
                  <span className="collapse-icon">{plannerOpen ? "−" : "+"}</span>
                </button>
                {plannerOpen && (
                  <div className="planner-body">
                    <div className="planner-note"><span>ⓘ</span> Rule-based prioritization: higher severity, more affected viewports and repeated findings increase priority. It does not use AI or modify your website.</div>
                    {fixPlan.length === 0 ? (
                      <div className="planner-empty">No detected issues to prioritize. Run an inspection to build your fix plan.</div>
                    ) : (
                      <div className="fix-plan-list">
                        {fixPlan.slice(0, 5).map((item, index) => (
                          <div className="fix-plan-item" key={item.type}>
                            <span className="plan-number">{String(index + 1).padStart(2, "0")}</span>
                            <div className="plan-main"><strong>{item.type.replaceAll("_", " ")}</strong><small>{item.count} occurrence(s) · {item.viewportList.join(", ") || "Viewport not specified"}</small></div>
                            <div className="plan-score"><div><i style={{ width: `${item.score}%` }} /></div><small>Priority score <b>{item.score}</b></small></div>
                            <span className={`priority-pill ${item.score >= 70 ? "first" : item.score >= 40 ? "next" : "monitor"}`}>{priorityLabel(item.score)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="planner-actions"><span>Generated from this inspection's findings</span><button type="button" className="subtle-button" onClick={copyFixPlan} disabled={!fixPlan.length}>{copiedPlan ? "✓ Copied plan" : "Copy fix plan ↗"}</button></div>
                  </div>
                )}
              </section>

              <section className="content-panel screenshot-panel">
                <div className="panel-heading screenshot-heading">
                  <div><span className="panel-overline">VISUAL EVIDENCE</span><h3>Responsive screenshots</h3><p>Inspect the captured page at each screen size.</p></div>
                  <div className="viewport-tabs" role="tablist" aria-label="Screenshot viewport">
                    {VIEWPORTS.map((viewport) => (
                      <button key={viewport} type="button" role="tab" aria-selected={activeViewport === viewport} className={activeViewport === viewport ? "tab active" : "tab"} onClick={() => setActiveViewport(viewport)}>{viewport}</button>
                    ))}
                  </div>
                </div>
                <div className={`screenshot-stage ${activeViewport}`}>
                  {activeScreenshot ? (
                    <a href={screenshotUrl(activeScreenshot)} target="_blank" rel="noreferrer" title="Open screenshot in a new tab">
                      <img src={screenshotUrl(activeScreenshot)} alt={`${activeViewport} website screenshot`} />
                    </a>
                  ) : (
                    <div className="screenshot-empty"><span>▧</span><strong>No screenshot available</strong><p>There is no captured image for {activeViewport}.</p></div>
                  )}
                </div>
              </section>

              <section className="content-panel findings-panel">
                <div className="panel-heading findings-heading">
                  <div><span className="panel-overline">DETECTION RESULTS</span><h3>Detected findings</h3><p>Review, filter and export issues from this scan.</p></div>
                  <div className="findings-actions"><span className="count-pill">{filteredFindings.length} / {findings.length}</span><button className="export-button" type="button" onClick={() => exportCSV(filteredFindings, inspection)} disabled={!filteredFindings.length}>↓ Export CSV</button></div>
                </div>
                <div className="finding-filters">
                  <label>Severity<select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}><option value="all">All severities</option><option value="high">High</option><option value="medium">Medium</option><option value="warning">Warning</option><option value="low">Low</option></select></label>
                  <label>Viewport<select value={viewportFilter} onChange={(e) => setViewportFilter(e.target.value)}><option value="all">All viewports</option>{VIEWPORTS.map((v) => <option value={v} key={v}>{v}</option>)}</select></label>
                  <label>Issue type<select value={issueTypeFilter} onChange={(e) => setIssueTypeFilter(e.target.value)}><option value="all">All issue types</option>{issueTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
                  <button type="button" className="reset-button" onClick={resetFilters}>Reset filters ↺</button>
                </div>
                <div className="filter-status"><span>Showing <b>{filteredFindings.length}</b> of {findings.length} findings</span><span>Filters update instantly</span></div>
                {filteredFindings.length === 0 ? (
                  <div className="filter-empty">{findings.length ? "No findings match these filters. Try resetting your filters." : "Great! No findings were reported for this inspection."}</div>
                ) : (
                  <div className="findings-list">
                    {filteredFindings.map((finding, index) => (
                      <article className="finding-row" key={`${findingType(finding)}-${finding.viewport ?? "unknown"}-${index}`}>
                        <span className={`severity-indicator ${severityClass(finding.severity)}`} />
                        <div className="finding-main"><strong>{findingType(finding).replaceAll("_", " ")}</strong><p>{finding.description ?? finding.message ?? "An issue was detected."}</p>{finding.evidence && <a className="evidence-link" href={String(finding.evidence).startsWith("http") ? finding.evidence : screenshotUrl(finding.evidence)} target="_blank" rel="noreferrer">View evidence ↗</a>}</div>
                        <span className={`severity-badge ${severityClass(finding.severity)}`}>{finding.severity ?? "warning"}</span>
                        <span className="viewport-badge">{finding.viewport ?? "—"}</span>
                      </article>
                    ))}
                  </div> 
                  
                )}
                <SmartFixPlanner findings={filteredFindings} />
                <VisualDiff />
                <SmartCSSFix findings={filteredFindings} />
              </section>
            </>
          )}
        </section>

        <section className="history-section" id="history">
          <div className="section-title-row">
            <div><div className="eyebrow">YOUR RECENT ACTIVITY</div><h2>Inspection history</h2><p className="muted">Reopen a previous scan to review its report.</p></div>
            <button className="subtle-button" type="button" onClick={loadHistory} disabled={historyLoading}>{historyLoading ? "Refreshing…" : "↻ Refresh history"}</button>
          </div>
          <div className="history-panel">
            {historyLoading ? <div className="history-empty">Loading inspection history…</div> : history.length === 0 ? <div className="history-empty">No saved inspections yet. Your completed scans will appear here.</div> : history.map((item, index) => (
              <button className="history-row" type="button" key={item.id || `${item.url}-${index}`} onClick={() => openHistory(item)}>
                <span className="history-icon">↗</span><span className="history-details"><strong>{item.url || "Unknown website"}</strong><small>{item.created_at ? new Date(item.created_at).toLocaleString() : "Saved inspection"}</small></span><span className="history-count">{(item.findings ?? []).length} findings</span><span className="history-open">Open report →</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="footer"><span className="footer-brand">◈ OmniSight</span><span>Responsive inspection · Rule-based detection</span><span>Built for better web experiences</span></footer>
      </main>
    </div>
  );
}

export default App;
