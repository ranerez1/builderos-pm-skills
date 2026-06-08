/** Extract interactive elements for agent-driven discovery. */
export async function captureSnapshot(page, { maxElements = 80, scroll = false } = {}) {
  if (scroll) {
    await page.evaluate(async () => {
      const step = Math.max(window.innerHeight * 0.8, 400);
      let y = 0;
      const maxY = document.documentElement.scrollHeight;
      while (y < maxY) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
        y += step;
      }
      window.scrollTo(0, 0);
    });
  }

  const elements = await page.evaluate((limit) => {
    const selectors =
      'button, a[href], input, textarea, select, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [contenteditable="true"]';
    const seen = new Set();
    const out = [];
    let idx = 0;

    for (const el of document.querySelectorAll(selectors)) {
      if (out.length >= limit) break;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;

      const role = el.getAttribute('role') || el.tagName.toLowerCase();
      const name =
        el.getAttribute('aria-label') ||
        el.getAttribute('placeholder') ||
        el.getAttribute('title') ||
        (el.innerText || '').trim().slice(0, 80) ||
        el.getAttribute('name') ||
        '';
      if (!name || name.length < 1) continue;

      const key = `${role}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const ref = `@e${idx}`;
      idx += 1;
      out.push({
        ref,
        role,
        name: name.replace(/\s+/g, ' ').trim(),
        tag: el.tagName.toLowerCase(),
      });
    }
    return out;
  }, maxElements);

  const elementRefs = {};
  for (const el of elements) {
    elementRefs[el.ref] = { role: mapRole(el.role, el.tag), name: el.name, text: el.name };
  }

  return { elements, elementRefs };
}

function mapRole(role, tag) {
  if (role === 'a') return 'link';
  if (role === 'button' || tag === 'button') return 'button';
  if (role === 'input' || tag === 'input' || tag === 'textarea') return 'textbox';
  if (['link', 'tab', 'menuitem', 'textbox', 'checkbox', 'combobox'].includes(role)) return role;
  return role;
}

export function snapshotExcerpt(elements, limit = 12) {
  return elements.slice(0, limit).map((e) => `${e.ref} ${e.role} "${e.name}"`);
}

export async function isLoginPage(page) {
  const url = page.url();
  if (/login|signin|sign-in|auth\/login|oauth/i.test(url)) return true;
  const passwordField = await page.locator('input[type="password"]').count();
  return passwordField > 0;
}

export function bodyMatchesSignals(page, signals = []) {
  if (!signals?.length) return true;
  return page.locator('body').innerText().then((text) => {
    const lower = text.toLowerCase();
    return signals.some((s) => lower.includes(String(s).toLowerCase()));
  });
}
