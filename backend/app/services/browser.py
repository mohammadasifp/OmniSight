
from pathlib import Path
from playwright.sync_api import sync_playwright


BASE_DIR = Path(__file__).resolve().parents[2]
SCREENSHOT_DIR = BASE_DIR / "artifacts" / "screenshots"

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 390, "height": 844},
}


def detect_ui_issues(page):
    """Detect common UI problems on the current page."""
    issues = []

    # Check page title
    title = page.title().strip()
    if not title:
        issues.append({
            "type": "missing_title",
            "severity": "warning",
            "message": "The page is missing a title.",
        })

    # Check horizontal overflow
    overflow = page.evaluate("""
        document.documentElement.scrollWidth > window.innerWidth
    """)
    if overflow:
        issues.append({
            "type": "horizontal_overflow",
            "severity": "high",
            "message": "The page overflows horizontally at this viewport.",
        })

    # Check broken images
    broken_images = page.locator("img").evaluate_all("""
        images => images
            .filter(img => !img.complete || img.naturalWidth === 0)
            .map(img => img.src)
    """)

    for image_url in broken_images:
        issues.append({
            "type": "broken_image",
            "severity": "warning",
            "message": "An image failed to load.",
            "element": image_url,
        })

    return issues


def inspect_website_sync(url: str, inspection_id: str):
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    results = {
        "inspection_id": inspection_id,
        "url": url,
        "status": "completed",
        "title": "",
        "screenshots": {},
        "findings": [],
    }

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)

        try:
            page = browser.new_page()

            page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=20000,
            )

            results["title"] = page.title()

            for name, size in VIEWPORTS.items():
                page.set_viewport_size(size)
                page.wait_for_timeout(300)

                # Detect issues at the current viewport.
                viewport_issues = detect_ui_issues(page)

                for issue in viewport_issues:
                    results["findings"].append({
                        "rule_id": issue["type"].upper(),
                        "severity": issue["severity"],
                        "viewport": name,
                        "description": issue["message"],
                        "evidence": issue.get("element", ""),
                    })

                # Capture the viewport screenshot.
                screenshot_path = (
                    SCREENSHOT_DIR / f"{inspection_id}_{name}.png"
                )

                page.screenshot(
                    path=str(screenshot_path),
                    full_page=True,
                )

                results["screenshots"][name] = (
                    f"/screenshots/{inspection_id}_{name}.png"
                )

        finally:
            browser.close()

    return results
