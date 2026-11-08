
import { useMemo } from "react";
import "./HealthTimeline.css";

function getScore(inspection) {
  const directScore =
    inspection?.health_score ??
    inspection?.quality_score ??
    inspection?.score;

  if (Number.isFinite(Number(directScore)) && directScore !== null) {
    return Math.max(0, Math.min(100, Number(directScore)));
  }

  const findings = Array.isArray(inspection?.findings)
    ? inspection.findings
    : [];

  if (findings.length === 0) return 100;

  const weights = {
    critical: 15,
    high: 10,
    medium: 5,
    low: 2,
  };

  const deductions = findings.reduce((total, finding) => {
    const severity = String(finding.severity || "low").toLowerCase();
    return total + (weights[severity] || 2);
  }, 0);

  return Math.max(0, 100 - deductions);
}

function getDate(inspection) {
  const value =
    inspection?.created_at ||
    inspection?.timestamp ||
    inspection?.date;

  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString();
}

export default function HealthTimeline({ inspections = [] }) {
  const timeline = useMemo(() => {
    return [...inspections]
      .map((inspection, index) => ({
        id: inspection.id ?? index,
        url: inspection.url || "Website inspection",
        score: getScore(inspection),
        date: getDate(inspection),
        findings: Array.isArray(inspection.findings)
          ? inspection.findings.length
          : 0,
      }))
      .reverse();
  }, [inspections]);

  const averageScore =
    timeline.length > 0
      ? Math.round(
          timeline.reduce((sum, item) => sum + item.score, 0) /
            timeline.length
        )
      : 0;

  const latestScore = timeline[0]?.score ?? 0;
  const previousScore = timeline[1]?.score ?? null;

  const scoreChange =
    previousScore === null ? null : latestScore - previousScore;

  return (
    <section className="health-timeline">
      <div className="health-timeline-header">
        <div>
          <span className="health-overline">WEBSITE ANALYTICS</span>
          <h2>Website Health Timeline</h2>
          <p>Track website quality across previous inspections.</p>
        </div>
        <span className="health-timeline-icon">↗</span>
      </div>

      <div className="health-summary-grid">
        <div className="health-summary-card">
          <span>Total Inspections</span>
          <strong>{timeline.length}</strong>
        </div>

        <div className="health-summary-card">
          <span>Average Health</span>
          <strong>{averageScore}%</strong>
        </div>

        <div className="health-summary-card">
          <span>Latest Health</span>
          <strong>{latestScore}%</strong>
        </div>

        <div className="health-summary-card">
          <span>Change from Previous</span>
          <strong
            className={
              scoreChange === null
                ? ""
                : scoreChange >= 0
                ? "health-positive"
                : "health-negative"
            }
          >
            {scoreChange === null
              ? "—"
              : `${scoreChange > 0 ? "+" : ""}${scoreChange}%`}
          </strong>
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="health-empty">
          No inspection history available. Run an inspection to start
          tracking website health.
        </div>
      ) : (
        <>
          <div className="health-chart">
            <h3>Health score history</h3>

            <div className="health-chart-bars">
              {timeline.map((item, index) => (
                <div className="health-bar-item" key={item.id}>
                  <span className="health-bar-score">
                    {item.score}%
                  </span>

                  <div className="health-bar-track">
                    <div
                      className="health-bar-fill"
                      style={{ height: `${item.score}%` }}
                      title={`${item.score}%`}
                    />
                  </div>

                  <span className="health-bar-label">
                    #{timeline.length - index}
                  </span>
                </div>
              ))}
            </div>

            <p className="health-chart-note">
              Each bar represents one inspection, ordered from newest
              to oldest.
            </p>
          </div>

          <div className="health-history">
            <h3>Inspection history</h3>

            {timeline.map((item) => (
              <article className="health-history-item" key={item.id}>
                <div className="health-history-info">
                  <strong>{item.url}</strong>
                  <span>{item.date}</span>
                  <small>{item.findings} findings</small>
                </div>

                <div className="health-history-score">
                  <strong>{item.score}%</strong>
                  <span>
                    {item.score >= 80
                      ? "Good"
                      : item.score >= 50
                      ? "Needs improvement"
                      : "Poor"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
