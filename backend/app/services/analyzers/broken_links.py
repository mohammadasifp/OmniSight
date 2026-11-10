
from urllib.parse import urlparse


async def analyze_broken_links(page, base_url):
    resources = await page.evaluate("""() => {
        const links = [...document.querySelectorAll("a[href]")]
            .map(a => ({
                url: a.href,
                type: "link"
            }));

        const images = [...document.querySelectorAll("img[src]")]
            .map(img => ({
                url: img.src,
                type: "image"
            }));

        return [...links, ...images];
    }""")

    base_host = urlparse(base_url).netloc

    checked = set()
    broken = []

    for resource in resources:
        url = resource["url"]

        if url in checked:
            continue

        checked.add(url)

        parsed = urlparse(url)

        if parsed.scheme not in ("http", "https"):
            continue

        if parsed.netloc != base_host:
            continue

        try:
            response = await page.request.get(
                url,
                timeout=10000
            )

            if response.status >= 400:
                broken.append({
                    "url": url,
                    "type": resource["type"],
                    "status": response.status
                })

        except Exception as error:
            broken.append({
                "url": url,
                "type": resource["type"],
                "error": str(error)
            })

    return {
        "totalChecked": len(checked),
        "brokenCount": len(broken),
        "brokenResources": broken
    }
