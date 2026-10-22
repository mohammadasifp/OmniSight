
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function screenshotUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Support both new API paths and older Windows file paths.
  const filename = path.split(/[\\/]/).pop();

  return `${API}/screenshots/${encodeURIComponent(filename)}`;
}

function App() {
  const [url, setUrl] = useState("https://example.com");
  const [inspection, setInspection] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);

    try {
      const response = await fetch(`${API}/api/inspections`);

      if (!response.ok) {
        throw new Error(`History request failed (${response.status})`);
      }

      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        `${err.message}. Check that the backend is running on port 8000 and CORS is configured.`
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function runInspection(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setInspection(null);

    try {
      const response = await fetch(`${API}/api/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          viewports: ["desktop", "tablet", "mobile"],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : `Inspection failed (${response.status})`
        );
      }

      setInspection(data);
      await loadHistory();
    } catch (err) {
      setError(err.message || "Could not complete the inspection.");
    } finally {
      setLoading(false);
    }
  }

  async function openInspection(id) {
    setError("");

    try {
      const response = await fetch(
        `${API}/api/inspections/${encodeURIComponent(id)}`
      );

      if (!response.ok) {
        throw new Error(`Could not load inspection (${response.status})`);
      }

      setInspection(await response.json());
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    }
  }

  const screenshots = inspection?.screenshots || {};
  const findings = inspection?.findings || [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">O</span>
          <div>
            <h2>OmniSight</h2>
            <small>UI Intelligence</small>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>
        <button className="nav-item active" onClick={() => window.scrollTo(0, 0)}>
          ◫ &nbsp; Dashboard
        </button>
        <button
          className="nav-item"
          onClick={() =>
            document.getElementById("history")?.scrollIntoView({
              behavior: "smooth",
            })
          }
        >
          ◷ &nbsp; Inspection History
        </button>

        <div className="sidebar-footer">
          <span className="status-dot" />
          OmniSight API · localhost:8000
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">WEBSITE QUALITY PLATFORM</p>
            <h1>UI Inspection Dashboard</h1>
          </div>
          <span className="version-badge">MVP · v0.1</span>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow light">AUTOMATED RESPONSIVE TESTING</p>
            <h2>See your website from every screen.</h2>
            <p>
              Capture screenshots and detect basic responsive layout issues.
            </p>
          </div>
          <div className="welcome-art" aria-hidden="true">◈</div>
        </section>

        <section className="panel">
          <h2>Start a new inspection</h2>
          <p className="muted">
            Test a website you own or are authorized to inspect.
          </p>

          <form className="inspect-form" onSubmit={runInspection}>
            <label htmlFor="website-url">Website URL</label>
            <div className="input-row">
              <input
                id="website-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Inspecting..." : "▶ Inspect website"}
              </button>
            </div>
          </form>

          <div className="viewport-tags">
            <span>▣ Desktop · 1440px</span>
            <span>▤ Tablet · 768px</span>
            <span>▯ Mobile · 390px</span>
          </div>
        </section>

        {error && (
          <div className="error-message">
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="panel loading-message">
            Inspecting the website and capturing screenshots. Please wait...
          </div>
        )}

        {inspection && (
          <section className="panel results-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">INSPECTION RESULTS</p>
                <h2>{inspection.title || inspection.url}</h2>
                <p className="muted">{inspection.url}</p>
              </div>
              <span className="success-badge">{inspection.status}</span>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <span>Screenshots</span>
                <strong>{Object.keys(screenshots).length}</strong>
              </div>
              <div className="summary-card">
                <span>Findings</span>
                <strong>{findings.length}</strong>
              </div>
              <div className="summary-card">
                <span>Inspection ID</span>
                <strong className="id-value">
                  {inspection.inspection_id?.slice(0, 8) || "—"}
                </strong>
              </div>
            </div>

            <h3 className="subheading">Responsive screenshots</h3>

            {Object.keys(screenshots).length === 0 ? (
              <p className="empty-state">No screenshots were returned.</p>
            ) : (
              <div className="screenshots-grid">
                {Object.entries(screenshots).map(([name, path]) => (
                  <article className="screenshot-card" key={name}>
                    <div className="screenshot-heading">
                      <h3>{name.charAt(0).toUpperCase() + name.slice(1)}</h3>
                      <a
                        href={screenshotUrl(path)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open image ↗
                      </a>
                    </div>
                    <a
                      href={screenshotUrl(path)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={screenshotUrl(path)}
                        alt={`${name} website screenshot`}
                        onError={(event) => {
                          event.currentTarget.alt =
                            "Screenshot could not be loaded. Check the screenshot API path.";
                        }}
                      />
                    </a>
                  </article>
                ))}
              </div>
            )}

            <h3 className="subheading">Detected findings</h3>

            {findings.length === 0 ? (
              <p className="empty-state">
                No issues were detected by the current checks. This does not
                guarantee that the website has no visual defects.
              </p>
            ) : (
              <div className="findings-list">
                {findings.map((finding, index) => (
                  <article
                    className="finding"
                    key={`${finding.rule_id}-${index}`}
                  >
                    <strong>{finding.rule_id}</strong>
                    <span className="severity">{finding.severity}</span>
                    <p>{finding.description}</p>
                    <small>Viewport: {finding.viewport}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="panel history-panel" id="history">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR PREVIOUS RUNS</p>
              <h2>Inspection history</h2>
            </div>
            <button
              className="secondary-button"
              onClick={loadHistory}
              disabled={historyLoading}
            >
              {historyLoading ? "Refreshing..." : "Refresh history"}
            </button>
          </div>

          {history.length === 0 ? (
            <p className="empty-state">
              No saved inspections found. Run an inspection or refresh history.
            </p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <button
                  className="history-item"
                  key={item.id}
                  onClick={() => openInspection(item.id)}
                >
                  <span className="history-icon">◈</span>
                  <span className="history-details">
                    <strong>{item.title || item.url}</strong>
                    <small>{item.url}</small>
                  </span>
                  <span className="success-badge">{item.status}</span>
                  <span>→</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <footer>
          OmniSight · Multimodal UI Self-Healing &amp; RPA Agent
        </footer>
      </main>
    </div>
  );
}

export default App;
