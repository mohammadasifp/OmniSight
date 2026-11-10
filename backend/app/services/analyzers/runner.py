
from playwright.async_api import async_playwright

from app.services.analyzers.accessibility import analyze_accessibility
from app.services.analyzers.performance import analyze_performance
from app.services.analyzers.broken_links import analyze_broken_links
from app.services.analyzers.seo import analyze_seo
from app.services.analyzers.consistency import calculate_consistency


DEVICES = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 390, "height": 844}
}


async def run_website_analysis(url, selected_devices):
    results = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        try:
            for device in selected_devices:
                viewport = DEVICES[device]

                page = await browser.new_page(
                    viewport=viewport
                )

                await page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=30000
                )

                # Allow page scripts and resources to settle.
                await page.wait_for_timeout(1500)

                data = await page.evaluate("""() => {
                    return {
                        title: document.title,

                        pageWidth:
                            document.documentElement.scrollWidth,

                        viewportWidth: window.innerWidth,

                        horizontalOverflow:
                            document.documentElement.scrollWidth >
                            window.innerWidth,

                        images: [...document.images].map(img => ({
                            src: img.src,
                            alt: img.getAttribute("alt")
                        }))
                    };
                }""")

                accessibility = await analyze_accessibility(page)

                performance = await analyze_performance(page)

                seo = await analyze_seo(page)

                broken_links = await analyze_broken_links(
                    page,
                    url
                )

                results[device] = {
                    "data": data,
                    "accessibility": accessibility,
                    "performance": performance,
                    "seo": seo,
                    "brokenLinks": broken_links
                }

                await page.close()

        finally:
            await browser.close()

    consistency = calculate_consistency(results)

    return {
        "success": True,
        "url": url,
        "devices": results,
        "consistency": consistency
    }
