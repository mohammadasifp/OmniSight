import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://example.com", timeout=20000)
        print("Browser launched successfully")
        print("Page title:", await page.title())
        await browser.close()

asyncio.run(main())
