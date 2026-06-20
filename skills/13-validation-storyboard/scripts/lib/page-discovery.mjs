// Generalized page-introspection helpers for auto-walk URL capture.
// Bakes in lessons from real-world capture runs:
//   - Pages duplicate headings (mobile-nav clones at top: 0). Pick the deepest
//     match by absolute Y, never the first DOM-order match.
//   - window.scrollBy is a no-op when the scrollable container isn't body.
//     Scroll by absolute Y on document level OR locate the scrollable ancestor.
//   - Default viewport ~700px so taller pages have enough scroll runway to land
//     each section's heading near the top.

/**
 * Find all useful section headings on a page, deduplicated by text and sorted
 * by reading order down the page.
 *
 * Returns: Array<{ text, absTop }>
 *
 * Filters:
 *   - drop text length < 2 or > 60 chars (skip icon labels and accidental
 *     titles)
 *   - within each group of same-text headings, keep only the one with the
 *     largest absTop (skips hidden duplicates pinned at top: 0)
 *   - cap at `max` entries (default 8) to avoid 30-step storyboards
 */
export async function findHeadings(page, { max = 8 } = {}) {
  const raw = await page.evaluate(() => {
    const sel = 'h1, h2, h3, h4, [role="heading"]';
    return Array.from(document.querySelectorAll(sel))
      .map((el) => {
        const text = (el.textContent || '').trim();
        const rect = el.getBoundingClientRect();
        return { text, absTop: rect.top + window.scrollY };
      })
      .filter((h) => h.text.length >= 2 && h.text.length <= 60);
  });

  // Group by lowercase text, keep deepest within group.
  const byText = new Map();
  for (const h of raw) {
    const key = h.text.toLowerCase();
    const existing = byText.get(key);
    if (!existing || h.absTop > existing.absTop) byText.set(key, h);
  }

  return Array.from(byText.values())
    .sort((a, b) => a.absTop - b.absTop)
    .slice(0, max);
}

/**
 * Scroll the page so a heading sits 24px below the viewport top.
 * Returns the achieved scrollY (clamped by document height).
 *
 * Looks up the heading by text using the same deepest-match heuristic as
 * findHeadings, so calling code can use raw heading text.
 */
export async function scrollToHeading(page, headingText, { paddingTop = 24 } = {}) {
  return page.evaluate(
    ({ text, padding }) => {
      const all = Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="heading"]'));
      const candidates = all
        .filter((h) => (h.textContent || '').trim().toLowerCase() === text.toLowerCase())
        .map((h) => ({ el: h, absTop: h.getBoundingClientRect().top + window.scrollY }))
        .sort((a, b) => b.absTop - a.absTop);
      if (!candidates.length) return -1;
      const target = candidates[0];
      const targetY = Math.max(0, target.absTop - padding);
      window.scrollTo(0, targetY);
      return window.scrollY;
    },
    { text: headingText, padding: paddingTop },
  );
}

/**
 * For a heading, count visible "primary content" elements within `belowPx` of
 * it (default 800px). Used to draft assertions like
 * "At least 5 visible cards render".
 *
 * Returns { count, noun }.
 */
export async function collectContextAroundHeading(page, headingText, { belowPx = 800 } = {}) {
  return page.evaluate(
    ({ text, below }) => {
      const all = Array.from(document.querySelectorAll('h1, h2, h3, h4, [role="heading"]'));
      const candidates = all
        .filter((h) => (h.textContent || '').trim().toLowerCase() === text.toLowerCase())
        .map((h) => ({ el: h, absTop: h.getBoundingClientRect().top + window.scrollY }))
        .sort((a, b) => b.absTop - a.absTop);
      if (!candidates.length) return { count: 0, noun: 'items' };
      const target = candidates[0].el;
      const headingY = candidates[0].absTop;

      // Walk forward in document order until we hit either another heading or
      // a sibling-heading at depth >= our target. Collect "primary content"
      // candidates within belowPx of headingY.
      const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let inWindow = false;
      const within = [];

      while (treeWalker.nextNode()) {
        const node = treeWalker.currentNode;
        if (node === target) {
          inWindow = true;
          continue;
        }
        if (!inWindow) continue;
        const rect = node.getBoundingClientRect();
        const absY = rect.top + window.scrollY;
        if (absY > headingY + below) break;
        // Another heading at same/higher level → end of this section.
        if (/^(h[1-4])$/i.test(node.tagName) && absY > headingY + 10) break;
        // Primary content: article, listitem, button-with-text, [role=link], [role=button]
        const isCard =
          node.tagName === 'ARTICLE' ||
          (node.tagName === 'LI' && (node.getAttribute('role') === 'listitem' || true)) ||
          (node.tagName === 'BUTTON' && (node.textContent || '').trim().length > 0) ||
          node.getAttribute('role') === 'button' ||
          node.getAttribute('role') === 'listitem' ||
          node.getAttribute('role') === 'link';
        if (!isCard) continue;
        if (rect.width < 80 || rect.height < 40) continue; // skip tiny/icon-only
        within.push({ tag: node.tagName.toLowerCase(), cls: (node.className || '').toString() });
      }

      // Infer a noun from class-name hints across collected elements.
      const blob = within.map((e) => e.cls).join(' ').toLowerCase();
      let noun = 'items';
      if (/(\bcard\b|-card\b|card-)/.test(blob)) noun = 'cards';
      else if (/(\btile\b|-tile\b|tile-)/.test(blob)) noun = 'tiles';
      else if (/(\brow\b|-row\b|row-)/.test(blob)) noun = 'rows';
      else if (within.every((e) => e.tag === 'a' || /link/.test(e.cls))) noun = 'links';

      return { count: within.length, noun };
    },
    { text: headingText, below: belowPx },
  );
}

/**
 * Wait briefly for layout to settle after a scroll. Animations, lazy-loaded
 * images, and CSS transitions can all shift visible content for a few hundred
 * ms after a programmatic scroll.
 */
export async function settleAfterScroll(page, ms = 700) {
  await page.waitForTimeout(ms);
}
