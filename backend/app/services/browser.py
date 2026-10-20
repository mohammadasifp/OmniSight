
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright


BASE_DIR = Path(__file__).resolve().parents[2]
SCREENSHOT_DIR = BASE_DIR / "artifacts" / "screenshots"

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 390, "height": 844},
}


async def inspect_website(url: str, inspection_id: str):
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    results = {
        "inspection_id": inspection_id,
        "url": url,
        "status": "completed",
        "title": "",
        "screenshots": {},
        "findings": [],
    }

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)

        try:
            page = await browser.new_page()

            await page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=20000,
            )

            results["title"] = await page.title()

            for name, size in VIEWPORTS.items():
                await page.set_viewport_size(size)
                await page.wait_for_timeout(300)

                screenshot_path = (
                    SCREENSHOT_DIR / f"{inspection_id}_{name}.png"
                )

                await page.screenshot(
                    path=str(screenshot_path),
                    full_page=True,
                )

                results["screenshots"][name] = str(screenshot_path)

                has_overflow = await page.evaluate(
                    "() => document.documentElement.scrollWidth > window.innerWidth"
                )

                if has_overflow:
                    results["findings"].append({
                        "rule_id": "RESPONSIVE_HORIZONTAL_OVERFLOW",
                        "severity": "high" if name == "mobile" else "medium",
                        "viewport": name,
                        "description": (
                            f"Horizontal overflow detected at {name} size."
                        ),
                        "evidence": str(screenshot_path),
                    })

        finally:
            await browser.close()

    return results
