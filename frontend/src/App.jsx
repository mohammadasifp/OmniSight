
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";
const VIEWPORTS = ["desktop", "tablet", "mobile"];

function parseJSON(value, fallback) {
  if (typeof value !== "string") return value ?? fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeInspection(item = {}) {
  return {
    ...item,
    id: item.id ?? item.inspection_id ?? "",
    findings: parseJSON(item.findings ?? item.findings_json, []),
    screenshots: parseJSON(
      item.screenshots ?? item.screenshots_json,
      {}
    ),
    title: item.title ?? "",
    url: item.url ?? "",
    status: item.status ?? "completed",
    created_at: item.created_at ?? "",
  };
}

function screenshotUrl(path) {
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) {
    try {
      const parsed = new URL(path);
      return `${API}${parsed.pathname}`;
    } catch {
      return path;
    }
  }

  const filename = path.split(/[\\/]/).pop();
  return `${API}/screenshots/${encodeURIComponent(filename)}`;
}

function severityClass(severity = "warning") {
  const value = String(severity).toLowerCase();

  if (value === "high" || value === "critical") return "high";
  if (value === "medium") return "medium";
  if (value === "low") return "low";

  return "warning";
}

function App() {
  const [url, setUrl] = useState("https://example.com");
  const [inspection, setInspection] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeViewport, setActiveViewport] = useState("desktop");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);

  const [severityFilter, setSeverityFilter] = useState("all");
  const [viewportFilter, setViewportFilter] = useState("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);

    try {
      const response = await fetch(`${API}/api/inspections`);

      if (!response.ok) {
        throw new Error("Could not load inspection history.");
      }

      const data = await response.json();
      const items = Array.isArray(data)
        ? data
        : data.inspections ?? data.items ?? [];

      setHistory(items.map(normalizeInspection));
    } catch (err) {
      setError((current) => current || err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function runInspection(event) {
    event.preventDefault();

    const trimmedUrl = url.trim();

    if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
      setError("Enter a valid URL beginning with http:// or https://.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmedUrl,
          viewports: VIEWPORTS,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail
            ? JSON.stringify(data.detail)
            : "The inspection request failed."
        );
      }

      const result = normalizeInspection(data);

      setInspection(result);
      setActiveViewport("desktop");
      resetFilters();

      await loadHistory();
    } catch (err) {
      setError(
        `${err.message}. Check that the backend is running at ${API}.`
      );
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setSeverityFilter("all");
    setViewportFilter("all");
    setIssueTypeFilter("all");
  }

  async function openHistory(item) {
    setError("");

    if (item.id) {
      try {
        const response = await fetch(
          `${API}/api/inspections/${encodeURIComponent(item.id)}`
        );

        if (response.ok) {
          const data = await response.json();
          setInspection(normalizeInspection(data));
          setActiveViewport("desktop");
          resetFilters();
          return;
        }
      } catch {
        // Fall back to the history record already loaded.
      }
    }

    setInspection(normalizeInspection(item));
    setActiveViewport("desktop");
    resetFilters();
  }

  const findings = Array.isArray(inspection?.findings)
    ? inspection.findings
    : [];

  const issueTypes = [
    ...new Set(
      findings.map((finding) =>
        finding.rule_id ?? finding.type ?? "UI issue"
      )
    ),
  ];

  const filteredFindings = findings.filter((finding) => {
    const severityMatches =
      severityFilter === "all" ||
      severityClass(finding.severity) === severityFilter;

    const viewportMatches =
      viewportFilter === "all" ||
      String(finding.viewport ?? "").toLowerCase() === viewportFilter;

    const issueType =
      finding.rule_id ?? finding.type ?? "UI issue";

    const issueTypeMatches =
      issueTypeFilter === "all" || issueType === issueTypeFilter;

    return severityMatches && viewportMatches && issueTypeMatches;
  });

  const screenshots = inspection?.screenshots ?? {};
  const activeScreenshot = screenshots[activeViewport] ?? "";

  const highCount = findings.filter(
    (item) => severityClass(item.severity) === "high"
  ).length;

  const mediumCount = findings.filter(
    (item) => severityClass(item.severity) === "medium"
  ).length;

  const warningCount = findings.filter(
    (item) => severityClass(item.severity) === "warning"
  ).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard">
          <span className="brand-mark">O</span>
          <span>
            <strong>OmniSight</strong>
            <small>UI intelligence</small>
          </span>
        </a>

        <p className="nav-label">WORKSPACE</p>

        <a className="nav-item active" href="#dashboard">
          <span>▦</span> Overview
        </a>

        <button
          className="nav-item nav-button"
          onClick={() =>
            document.getElementById("history")?.scrollIntoView({
              behavior: "smooth",
            })
          }
        >
          <span>◷</span> Inspection history
        </button>

        <div className="sidebar-bottom">
          <span className="status-dot" />
          <span>OmniSight API</span>
          <small>localhost</small>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">RESPONSIVE QUALITY ASSURANCE</p>
            <h1>UI Inspection Dashboard</h1>
            <p className="muted">
              Find visual and responsive issues across devices.
            </p>
          </div>
          <span className="version-pill">MVP · 0.1</span>
        </header>

        <section className="welcome-panel">
          <div className="welcome-copy">
            <span className="section-kicker">WEBSITE ANALYSIS</span>
            <h2>Inspect your website</h2>
            <p>
              Run a multi-viewport scan and review issues detected by
              OmniSight.
            </p>
          </div>

          <form className="inspect-form" onSubmit={runInspection}>
            <label htmlFor="website-url">Website URL</label>

            <div className="url-row">
              <input
                id="website-url"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com"
                required
              />

              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Inspecting…" : "▶ Run inspection"}
              </button>
            </div>

            <div className="viewport-hint">
              <span>✓ Desktop · 1440px</span>
              <span>✓ Tablet · 768px</span>
              <span>✓ Mobile · 390px</span>
            </div>
          </form>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            <strong>Something went wrong</strong>
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LATEST RESULTS</p>
              <h2>Inspection overview</h2>
            </div>

            {inspection && (
              <span className="result-url">{inspection.url}</span>
            )}
          </div>

          {!inspection ? (
            <div className="empty-state">
              <div className="empty-icon">⌕</div>
              <h3>Your inspection results will appear here</h3>
              <p>
                Enter a website above and select Run inspection to get started.
              </p>
            </div>
          ) : (
            <>
              <div className="stats-grid">
                <article className="stat-card">
                  <span className="stat-label">Total findings</span>
                  <strong>{findings.length}</strong>
                  <small>Across inspected viewports</small>
                </article>

                <article className="stat-card stat-high">
                  <span className="stat-label">High severity</span>
                  <strong>{highCount}</strong>
                  <small>Issues to prioritize</small>
                </article>

                <article className="stat-card stat-medium">
                  <span className="stat-label">Medium severity</span>
                  <strong>{mediumCount}</strong>
                  <small>Issues to review</small>
                </article>

                <article className="stat-card stat-warning">
                  <span className="stat-label">Warnings</span>
                  <strong>{warningCount}</strong>
                  <small>Potential improvements</small>
                </article>
              </div>

              <section className="content-panel screenshot-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Responsive screenshots</h3>
                    <p>Review the captured layout at each screen size.</p>
                  </div>

                  <div className="viewport-tabs" role="tablist">
                    {VIEWPORTS.map((viewport) => (
                      <button
                        key={viewport}
                        role="tab"
                        aria-selected={activeViewport === viewport}
                        className={
                          activeViewport === viewport ? "tab active" : "tab"
                        }
                        onClick={() => setActiveViewport(viewport)}
                      >
                        {viewport.charAt(0).toUpperCase() + viewport.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`screenshot-stage ${activeViewport}`}>
                  {activeScreenshot ? (
                    <a
                      href={screenshotUrl(activeScreenshot)}
                      target="_blank"
                      rel="noreferrer"
                      title="Open screenshot in a new tab"
                    >
                      <img
                        src={screenshotUrl(activeScreenshot)}
                        alt={`${activeViewport} website screenshot`}
                      />
                    </a>
                  ) : (
                    <div className="screenshot-empty">
                      <span>▧</span>
                      <p>No screenshot available for {activeViewport}.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="content-panel findings-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Detected findings</h3>
                    <p>Issues identified by the inspection rules.</p>
                  </div>

                  <span className="count-pill">
                    {findings.length} total
                  </span>
                </div>

                <div className="finding-filters">
                  <label>
                    Severity
                    <select
                      value={severityFilter}
                      onChange={(event) =>
                        setSeverityFilter(event.target.value)
                      }
                    >
                      <option value="all">All severities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="warning">Warning</option>
                    </select>
                  </label>

                  <label>
                    Viewport
                    <select
                      value={viewportFilter}
                      onChange={(event) =>
                        setViewportFilter(event.target.value)
                      }
                    >
                      <option value="all">All viewports</option>
                      <option value="desktop">Desktop</option>
                      <option value="tablet">Tablet</option>
                      <option value="mobile">Mobile</option>
                    </select>
                  </label>

                  <label>
                    Issue type
                    <select
                      value={issueTypeFilter}
                      onChange={(event) =>
                        setIssueTypeFilter(event.target.value)
                      }
                    >
                      <option value="all">All issue types</option>
                      {issueTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    className="reset-filters-button"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                </div>

                <p className="filter-result-count" aria-live="polite">
                  Showing {filteredFindings.length} of {findings.length} findings
                </p>

                {filteredFindings.length === 0 ? (
                  <p className="filter-empty">
                    No findings match the selected filters. Try changing or
                    resetting them.
                  </p>
                ) : (
                  <div className="findings-list">
                    {filteredFindings.map((finding, index) => (
                      <article
                        className="finding-row"
                        key={`${finding.rule_id ?? finding.type ?? "issue"}-${finding.viewport ?? "unknown"}-${index}`}
                      >
                        <span
                          className={`severity-indicator ${severityClass(
                            finding.severity
                          )}`}
                        />

                        <div className="finding-main">
                          <strong>
                            {(finding.rule_id ?? finding.type ?? "UI issue")
                              .replaceAll("_", " ")}
                          </strong>

                          <p>
                            {finding.description ??
                              finding.message ??
                              "An issue was detected."}
                          </p>

                          {finding.evidence && (
                            <a
                              className="evidence-link"
                              href={
                                String(finding.evidence).startsWith("http")
                                  ? finding.evidence
                                  : screenshotUrl(finding.evidence)
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              View evidence ↗
                            </a>
                          )}
                        </div>

                        <span
                          className={`severity-badge ${severityClass(
                            finding.severity
                          )}`}
                        >
                          {finding.severity ?? "warning"}
                        </span>

                        <span className="viewport-badge">
                          {finding.viewport ?? "—"}
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </section>

        <section className="section-block history-section" id="history">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR RECENT ACTIVITY</p>
              <h2>Inspection history</h2>
            </div>

            <button className="secondary-button" onClick={loadHistory}>
              ↻ Refresh
            </button>
          </div>

          <div className="content-panel history-panel">
            {historyLoading ? (
              <p className="muted">Loading inspection history…</p>
            ) : history.length === 0 ? (
              <p className="muted">No saved inspections yet.</p>
            ) : (
              history.map((item, index) => (
                <button
                  className="history-row"
                  key={item.id || `${item.url}-${index}`}
                  onClick={() => openHistory(item)}
                >
                  <span className="history-icon">↗</span>

                  <span className="history-details">
                    <strong>{item.url || "Unknown website"}</strong>
                    <small>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "Saved inspection"}
                    </small>
                  </span>

                  <span className="history-count">
                    {(item.findings ?? []).length} findings
                  </span>

                  <span className="history-open">View →</span>
                </button>
              ))
            )}
          </div>
        </section>

        <footer className="footer">
          <span>OmniSight</span>
          <span>Responsive inspection · Rule-based detection</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
