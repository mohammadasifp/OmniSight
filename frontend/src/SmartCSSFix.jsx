
import { useState } from "react";
import "./SmartCSSFix.css";

function generateCSSFix(finding) {
  const text = [
    finding.rule_id,
    finding.type,
    finding.title,
    finding.description,
    finding.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("overflow")) {
    return {
      title: "Fix content overflow",
      explanation: "Prevent elements from exceeding their containers.",
      css: `* {
  box-sizing: border-box;
}

img, video, iframe {
  max-width: 100%;
}

.container {
  width: 100%;
  overflow-wrap: break-word;
}`,
    };
  }

  if (text.includes("overlap")) {
    return {
      title: "Fix overlapping elements",
      explanation: "Use a responsive layout and review element positioning.",
      css: `.container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.child {
  min-width: 0;
  position: relative;
}`,
    };
  }

  if (text.includes("align")) {
    return {
      title: "Fix alignment issues",
      explanation: "Align elements consistently using Flexbox.",
      css: `.container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}`,
    };
  }

  if (text.includes("spacing") || text.includes("margin")) {
    return {
      title: "Improve spacing",
      explanation: "Use consistent spacing between elements.",
      css: `.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}`,
    };
  }

  if (text.includes("image")) {
    return {
      title: "Fix image responsiveness",
      explanation: "Keep images within their parent containers.",
      css: `img {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}`,
    };
  }

  if (text.includes("font") || text.includes("text")) {
    return {
      title: "Improve text readability",
      explanation: "Use responsive font sizing and comfortable line spacing.",
      css: `body {
  font-size: 16px;
  line-height: 1.6;
}

h1 {
  font-size: clamp(1.8rem, 4vw, 3rem);
}`,
    };
  }

  return {
    title: "General responsive improvement",
    explanation: "Use flexible sizing to support different screen widths.",
    css: `.container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 16px;
}

* {
  box-sizing: border-box;
}`,
  };
}

export default function SmartCSSFix({ findings = [] }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyCSS = async (css, index) => {
    try {
      await navigator.clipboard.writeText(css);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      alert("Unable to copy CSS. Please copy it manually.");
    }
  };

  return (
    <section className="smart-css-panel">
      <div className="smart-css-heading">
        <div>
          <span className="smart-css-overline">
            DEVELOPER ASSISTANT
          </span>
          <h2>Smart CSS Fix Generator</h2>
          <p>
            Get suggested CSS improvements for detected website issues.
          </p>
        </div>
        <span className="smart-css-icon">{"{ }"}</span>
      </div>

      {findings.length === 0 ? (
        <div className="smart-css-empty">
          <h3>No findings available</h3>
          <p>Run an inspection to generate CSS suggestions.</p>
        </div>
      ) : (
        <div className="smart-css-list">
          {findings.map((finding, index) => {
            const suggestion = generateCSSFix(finding);

            return (
              <article
                className="smart-css-card"
                key={`${finding.rule_id || finding.type || "issue"}-${finding.viewport || "all"}-${index}`}
              >
                <div className="smart-css-card-heading">
                  <div>
                    <span className="smart-css-number">
                      FIX #{index + 1}
                    </span>
                    <h3>{suggestion.title}</h3>
                  </div>

                  <span className="smart-css-viewport">
                    {finding.viewport || "All viewports"}
                  </span>
                </div>

                <p className="smart-css-explanation">
                  {suggestion.explanation}
                </p>

                <pre className="smart-css-code">
                  <code>{suggestion.css}</code>
                </pre>

                <button
                  type="button"
                  className="smart-css-copy"
                  onClick={() => copyCSS(suggestion.css, index)}
                >
                  {copiedIndex === index ? "Copied!" : "Copy CSS"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
