/** Wait for SPAs to finish splash/loading before screenshots. */
export async function settlePage(page, maxMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const text = (await page.locator('body').innerText().catch(() => '')).trim();
    const url = page.url();
    const onAuth = /signin|login|auth/i.test(url);
    const looksLoaded =
      text.length > 80 &&
      !/^TickTick\s*$/i.test(text) &&
      !/couldn't load the required files/i.test(text);
    if (!onAuth && looksLoaded) {
      await new Promise((r) => setTimeout(r, 1500));
      return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}
