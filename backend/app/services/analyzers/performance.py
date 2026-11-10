
async def analyze_performance(page):
    return await page.evaluate("""() => {
        const navigation =
            performance.getEntriesByType("navigation")[0];

        const resources =
            performance.getEntriesByType("resource");

        const transferSize = resources.reduce(
            (total, resource) =>
                total + (resource.transferSize || 0),
            0
        );

        return {
            domContentLoaded: navigation
                ? Math.round(
                    navigation.domContentLoadedEventEnd
                )
                : null,

            loadTime: navigation
                ? Math.round(navigation.loadEventEnd)
                : null,

            responseTime: navigation
                ? Math.round(navigation.responseEnd)
                : null,

            resourceCount: resources.length,

            transferSizeBytes: transferSize,

            imageCount:
                document.querySelectorAll("img").length,

            scriptCount:
                document.querySelectorAll("script[src]").length,

            stylesheetCount:
                document.querySelectorAll(
                    'link[rel="stylesheet"]'
                ).length
        };
    }""")
