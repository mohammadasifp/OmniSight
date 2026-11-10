
async def analyze_accessibility(page):
    return await page.evaluate("""() => {
        const issues = [];

        // Missing image alt attributes
        document.querySelectorAll("img").forEach(img => {
            if (!img.hasAttribute("alt")) {
                issues.push({
                    type: "missing-alt",
                    severity: "high",
                    message: "Image is missing alt text"
                });
            }
        });

        // Missing form labels
        document.querySelectorAll(
            "input, textarea, select"
        ).forEach(field => {
            if (
                ["hidden", "submit", "button"].includes(field.type)
            ) return;

            const hasLabel =
                field.labels?.length > 0 ||
                field.getAttribute("aria-label") ||
                field.getAttribute("aria-labelledby");

            if (!hasLabel) {
                issues.push({
                    type: "missing-label",
                    severity: "high",
                    message: "Form field has no accessible label"
                });
            }
        });

        // Missing language
        if (!document.documentElement.lang) {
            issues.push({
                type: "missing-language",
                severity: "medium",
                message: "HTML language is missing"
            });
        }

        // Missing title
        if (!document.title.trim()) {
            issues.push({
                type: "missing-title",
                severity: "high",
                message: "Page title is missing"
            });
        }

        // Empty buttons
        document.querySelectorAll("button").forEach(button => {
            if (
                !button.innerText.trim() &&
                !button.getAttribute("aria-label") &&
                !button.getAttribute("aria-labelledby")
            ) {
                issues.push({
                    type: "empty-button",
                    severity: "medium",
                    message: "Button has no accessible name"
                });
            }
        });

        return {
            totalIssues: issues.length,
            issues
        };
    }""")
