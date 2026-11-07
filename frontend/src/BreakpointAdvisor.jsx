
import { useMemo, useState } from "react";
import "./BreakpointAdvisor.css";

const BREAKPOINTS = [
  { name: "Mobile", min: 320, max: 480 },
  { name: "Tablet", min: 481, max: 768 },
  { name: "Laptop", min: 769, max: 1024 },
  { name: "Desktop", min: 1025, max: 1440 },
  { name: "Large Desktop", min: 1441, max: 1920 },
];

function getIssueText(finding) {
  return [
    finding.rule_id,
    finding.type,
    finding.title,
    finding.description,
    finding.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getRecommendation(finding) {
  const text = getIssueText(finding);

  if (text.includes("overflow")) {
    return {
      title: "Prevent horizontal overflow",
      css: `@media (max-width: 768px) {
  .container {
    max-width: 100%;
    overflow-x: hidden;
  }
}`,
    };
  }

  if (text.includes("overlap")) {
    return {
      title: "Prevent element overlapping",
      css: `@media (max-width: 768px) {
  .container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}`,
    };
  }

  if (text.includes("font") || text.includes("text")) {
    return {
      title: "Adjust responsive typography",
      css: `@media (max-width: 480px) {
  body {
    font-size: 14px;
    line-height: 1.5;
  }

  h1 {
    font-size: 1.7rem;
  }
}`,
    };
  }

  if (text.includes("image")) {
    return {
      title: "Make images responsive",
      css: `@media (max-width: 768px) {
  img {
    max-width: 100%;
    height: auto;
    object-fit: contain;
  }
}`,
    };
  }

  return {
    title: "Improve responsive layout",
    css: `@media (max-width: 768px) {
  .container {
    width: 100%;
    padding: 16px;
    box-sizing: border-box;
  }
}`,
  };
}

export default function BreakpointAdvisor({ findings = [] }) {
  const [selectedWidth, setSelectedWidth] = useState(768);
  const [copied, setCopied] = useState(false);

  const selectedBreakpoint = useMemo(
    () =>
      BREAKPOINTS.find(
        (item) =>
          selectedWidth >= item.min && selectedWidth <= item.max
      ),
    [selectedWidth]
  );

  const viewportFindings = findings.filter((finding) => {
    const viewport = String(finding.viewport || "").toLowerCase();

    if (selectedWidth <= 480) {
      return viewport === "mobile";
    }

    if (selectedWidth <= 768) {
      return viewport === "tablet";
    }

    return viewport === "desktop";
  });

  const recommendations = findings.map((finding, index) => ({
    id: index,
    finding,
    ...getRecommendation(finding),
  }));

  const copyMediaQuery = async (css) => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Unable to copy CSS. Please copy it manually.");
    }
  };

  return (
    <section className="breakpoint-panel">
      <div className="breakpoint-heading">
        <div>
          <span className="breakpoint-overline">
            RESPONSIVE INTELLIGENCE
          </span>
          <h2>Responsive Breakpoint Advisor</h2>
          <p>
            Explore screen widths and get responsive CSS recommendations.
          </p>
        </div>
        <span className="breakpoint-icon">↔</span>
      </div>

      <div className="breakpoint-selector">
        <div className="breakpoint-width-label">
          <strong>Screen width</strong>
          <span>{selectedWidth}px</span>
        </div>

        <input
          type="range"
          min="320"
          max="1920"
          step="1"
          value={selectedWidth}
          onChange={(event) =>
            setSelectedWidth(Number(event.target.value))
          }
        />

        <div className="breakpoint-range-labels">
          <span>320px</span>
          <span>1920px</span>
        </div>

        <div className="breakpoint-current">
          <span>Selected device category</span>
          <strong>{selectedBreakpoint?.name || "Custom width"}</strong>
        </div>
      </div>

      <div className="breakpoint-device-grid">
        {BREAKPOINTS.map((item) => (
          <button
            type="button"
            key={item.name}
            className={
              selectedBreakpoint?.name === item.name
                ? "breakpoint-device active"
                : "breakpoint-device"
            }
            onClick={() => setSelectedWidth(item.min)}
          >
            <strong>{item.name}</strong>
            <span>
              {item.min}–{item.max}px
            </span>
          </button>
        ))}
      </div>

      <div className="breakpoint-results">
        <h3>Inspection findings for this width category</h3>
        <p>
          {viewportFindings.length} matching findings from the selected
          viewport category.
        </p>
      </div>

      {viewportFindings.length === 0 ? (
        <div className="breakpoint-empty">
          No matching findings were found for this viewport category.
          This does not guarantee that every width in this range is issue-free.
        </div>
      ) : (
        <div className="breakpoint-finding-list">
          {viewportFindings.map((finding, index) => (
            <article className="breakpoint-finding" key={index}>
              <strong>
                {finding.rule_id ||
                  finding.type ||
                  finding.title ||
                  "UI issue"}
              </strong>
              <p>
                {finding.description ||
                  finding.message ||
                  "Responsive issue detected."}
              </p>
            </article>
          ))}
        </div>
      )}

      <div className="breakpoint-recommendations">
        <div className="breakpoint-recommendation-heading">
          <div>
            <h3>Suggested media queries</h3>
            <p>Rule-based CSS recommendations from detected findings.</p>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="breakpoint-empty">
            Run an inspection to generate responsive CSS suggestions.
          </div>
        ) : (
          recommendations.map((item) => (
            <article className="breakpoint-code-card" key={item.id}>
              <h4>{item.title}</h4>
              <pre>
                <code>{item.css}</code>
              </pre>
              <button
                type="button"
                onClick={() => copyMediaQuery(item.css)}
              >
                {copied ? "Copied!" : "Copy Media Query"}
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
