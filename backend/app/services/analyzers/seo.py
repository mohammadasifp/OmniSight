
async def analyze_seo(page):
    return await page.evaluate("""() => {
        const issues = [];

        const title = document.title;

        const description =
            document.querySelector(
                'meta[name="description"]'
            )?.content || "";

        const headings =
            document.querySelectorAll("h1");

        const canonical =
            document.querySelector(
                'link[rel="canonical"]'
            );

        if (!title) {
            issues.push("Missing page title");
        } else if (title.length < 30 || title.length > 60) {
            issues.push("Review page title length");
        }

        if (!description) {
            issues.push("Missing meta description");
        } else if (
            description.length < 70 ||
            description.length > 160
        ) {
            issues.push("Review meta description length");
        }

        if (headings.length === 0) {
            issues.push("Missing H1 heading");
        }

        if (headings.length > 1) {
            issues.push("Multiple H1 headings");
        }

        if (!canonical) {
            issues.push("Missing canonical URL");
        }

        return {
            title,
            titleLength: title.length,
            description,
            descriptionLength: description.length,
            h1Count: headings.length,
            canonical: canonical?.href || null,
            totalIssues: issues.length,
            issues
        };
    }""")
