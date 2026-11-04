import { useEffect, useState } from "react";
import "./VisualDiff.css";

export default function VisualDiff() {
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [diffUrl, setDiffUrl] = useState("");
  const [difference, setDifference] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!beforeFile) {
      setBeforeUrl("");
      return;
    }

    const url = URL.createObjectURL(beforeFile);
    setBeforeUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [beforeFile]);

  useEffect(() => {
    if (!afterFile) {
      setAfterUrl("");
      return;
    }

    const url = URL.createObjectURL(afterFile);
    setAfterUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [afterFile]);

  const loadImage = (file) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not load one of the selected images."));
      };

      image.src = url;
    });

  const compareImages = async () => {
    if (!beforeFile || !afterFile) {
      setError("Please select both screenshots before comparing.");
      return;
    }

    setLoading(true);
    setError("");
    setDifference(null);
    setDiffUrl("");

    try {
      const [beforeImage, afterImage] = await Promise.all([
        loadImage(beforeFile),
        loadImage(afterFile),
      ]);

      // Use the first screenshot's dimensions as the comparison size.
      const width = beforeImage.naturalWidth;
      const height = beforeImage.naturalHeight;

      const beforeCanvas = document.createElement("canvas");
      const afterCanvas = document.createElement("canvas");
      const diffCanvas = document.createElement("canvas");

      [beforeCanvas, afterCanvas, diffCanvas].forEach((canvas) => {
        canvas.width = width;
        canvas.height = height;
      });

      const beforeContext = beforeCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      const afterContext = afterCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      const diffContext = diffCanvas.getContext("2d");

      beforeContext.drawImage(beforeImage, 0, 0, width, height);
      afterContext.drawImage(afterImage, 0, 0, width, height);

      const beforePixels = beforeContext.getImageData(
        0,
        0,
        width,
        height
      );
      const afterPixels = afterContext.getImageData(
        0,
        0,
        width,
        height
      );

      const output = diffContext.createImageData(width, height);
      let changedPixels = 0;

      // A small tolerance helps ignore tiny rendering differences.
      const tolerance = 25;

      for (let i = 0; i < beforePixels.data.length; i += 4) {
        const redDiff = Math.abs(
          beforePixels.data[i] - afterPixels.data[i]
        );
        const greenDiff = Math.abs(
          beforePixels.data[i + 1] - afterPixels.data[i + 1]
        );
        const blueDiff = Math.abs(
          beforePixels.data[i + 2] - afterPixels.data[i + 2]
        );

        const changed =
          redDiff + greenDiff + blueDiff > tolerance * 3;

        if (changed) {
          changedPixels++;

          // Highlight changed pixels.
          output.data[i] = 255;
          output.data[i + 1] = 40;
          output.data[i + 2] = 70;
          output.data[i + 3] = 255;
        } else {
          // Keep unchanged areas faintly visible.
          output.data[i] = beforePixels.data[i];
          output.data[i + 1] = beforePixels.data[i + 1];
          output.data[i + 2] = beforePixels.data[i + 2];
          output.data[i + 3] = 75;
        }
      }

      diffContext.putImageData(output, 0, 0);

      const totalPixels = width * height;
      const percentage = (changedPixels / totalPixels) * 100;

      setDifference({
        percentage: percentage.toFixed(2),
        changedPixels,
        totalPixels,
        width,
        height,
      });

      setDiffUrl(diffCanvas.toDataURL("image/png"));
    } catch (err) {
      setError(err.message || "Unable to compare screenshots.");
    } finally {
      setLoading(false);
    }
  };

  const resetComparison = () => {
    setBeforeFile(null);
    setAfterFile(null);
    setDiffUrl("");
    setDifference(null);
    setError("");
  };

  return (
    <section className="visual-diff-panel">
      <div className="visual-diff-heading">
        <div>
          <span className="visual-diff-overline">
            VISUAL REGRESSION ANALYSIS
          </span>
          <h2>Visual Difference Detector</h2>
          <p>
            Compare two screenshots and highlight the pixels that changed.
          </p>
        </div>

        <span className="visual-diff-icon">◫</span>
      </div>

      <div className="visual-diff-upload-grid">
        <label className="visual-upload-card">
          <span className="upload-number">01</span>
          <strong>Before screenshot</strong>
          <small>Select the original website screenshot</small>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              setBeforeFile(event.target.files?.[0] ?? null);
              setDifference(null);
              setDiffUrl("");
            }}
          />
          {beforeUrl && (
            <img src={beforeUrl} alt="Before screenshot preview" />
          )}
        </label>

        <label className="visual-upload-card">
          <span className="upload-number">02</span>
          <strong>After screenshot</strong>
          <small>Select the updated website screenshot</small>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              setAfterFile(event.target.files?.[0] ?? null);
              setDifference(null);
              setDiffUrl("");
            }}
          />
          {afterUrl && (
            <img src={afterUrl} alt="After screenshot preview" />
          )}
        </label>
      </div>

      {error && <p className="visual-diff-error">{error}</p>}

      <div className="visual-diff-actions">
        <button
          type="button"
          onClick={compareImages}
          disabled={!beforeFile || !afterFile || loading}
        >
          {loading ? "Comparing screenshots..." : "Compare Screenshots"}
        </button>

        <button
          type="button"
          className="visual-reset-button"
          onClick={resetComparison}
        >
          Reset
        </button>
      </div>

      {difference && (
        <div className="visual-diff-results">
          <div className="visual-diff-metrics">
            <div>
              <strong>{difference.percentage}%</strong>
              <span>Visual difference</span>
            </div>
            <div>
              <strong>{difference.changedPixels.toLocaleString()}</strong>
              <span>Changed pixels</span>
            </div>
            <div>
              <strong>
                {difference.width} × {difference.height}
              </strong>
              <span>Comparison size</span>
            </div>
          </div>

          <div className="visual-diff-result-image">
            <h3>Difference map</h3>
            <p>
              Red areas indicate pixels that differ between the screenshots.
            </p>
            <img src={diffUrl} alt="Visual difference map" />
            <a
              className="visual-download-link"
              href={diffUrl}
              download="omnisight-visual-difference.png"
            >
              Download Difference Image ↓
            </a>
          </div>
        </div>
      )}
    </section>
  );
}