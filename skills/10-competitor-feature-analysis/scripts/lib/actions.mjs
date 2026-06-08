import { settlePage } from './settle.mjs';

const CLICK_TIMEOUT = 30000;

/** Build a Playwright locator from a locator object. */
export function resolveLocator(page, spec) {
  if (!spec || typeof spec !== 'object') {
    throw new Error('Locator spec must be an object with role, name, text, label, or testId.');
  }
  if (spec.testId) return page.getByTestId(spec.testId);
  if (spec['aria-label']) return page.locator(`[aria-label="${spec['aria-label']}"]`);
  if (spec.role && spec.name) return page.getByRole(spec.role, { name: spec.name });
  if (spec.role) return page.getByRole(spec.role);
  if (spec.label) return page.getByLabel(spec.label);
  if (spec.text) return page.getByText(spec.text, { exact: spec.exact ?? false });
  if (spec.placeholder) return page.getByPlaceholder(spec.placeholder);
  throw new Error(`Invalid locator spec: ${JSON.stringify(spec)}`);
}

async function clickLocator(loc, options = {}) {
  const timeout = options.timeout ?? CLICK_TIMEOUT;
  try {
    await loc.first().click({ timeout });
  } catch (e) {
    if (options.force) throw e;
    await loc.first().click({ timeout, force: true });
  }
}

export async function runAction(page, action) {
  if (action.goto) {
    const url = action.goto.url || action.goto;
    await page.goto(typeof url === 'string' ? url : url.url, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    if (action.goto.settle !== false) await settlePage(page);
    return { type: 'goto', url: page.url() };
  }

  if (action.hover) {
    const loc = resolveLocator(page, action.hover);
    await loc.first().hover({ timeout: CLICK_TIMEOUT });
    await new Promise((r) => setTimeout(r, 400));
    return { type: 'hover', url: page.url() };
  }

  if (action.click) {
    const loc = resolveLocator(page, action.click);
    await clickLocator(loc);
    await new Promise((r) => setTimeout(r, 500));
    if (action.click.settle !== false) await settlePage(page);
    return { type: 'click', url: page.url() };
  }

  if (action.fill) {
    const { value, ...locSpec } = action.fill;
    if (value === undefined) throw new Error('fill action requires value');
    const loc = resolveLocator(page, locSpec);
    await loc.first().fill(String(value), { timeout: CLICK_TIMEOUT });
    return { type: 'fill', url: page.url() };
  }

  if (action.press) {
    const key = action.press.key || action.press;
    await page.keyboard.press(typeof key === 'string' ? key : key.key);
    await new Promise((r) => setTimeout(r, 300));
    return { type: 'press', url: page.url() };
  }

  if (action.wait) {
    if (action.wait.settle) await settlePage(page);
    else if (action.wait.ms) await new Promise((r) => setTimeout(r, action.wait.ms));
    else await new Promise((r) => setTimeout(r, 1000));
    return { type: 'wait', url: page.url() };
  }

  throw new Error(`Unknown action: ${JSON.stringify(action)}`);
}

export async function runActions(page, actions = []) {
  const results = [];
  for (const action of actions) {
    results.push(await runAction(page, action));
  }
  return results;
}

export function locatorFromRef(session, ref) {
  const spec = session.elementRefs?.[ref];
  if (!spec) throw new Error(`Unknown ref "${ref}". Run snapshot first.`);
  return spec;
}

/** Normalize CLI locator flags into a locator spec object. */
export function locatorFromArgs(args) {
  if (args.ref) {
    return { ref: args.ref };
  }
  if (args.role || args.name || args.text || args.label || args.testId || args['aria-label']) {
    const spec = {};
    if (args.role) spec.role = args.role;
    if (args.name) spec.name = args.name;
    if (args.text) spec.text = args.text;
    if (args.label) spec.label = args.label;
    if (args.testId) spec.testId = args.testId;
    if (args['aria-label']) spec['aria-label'] = args['aria-label'];
    return spec;
  }
  return null;
}

export async function resolveLocatorWithSession(page, session, specOrRef) {
  if (specOrRef.ref) {
    const spec = locatorFromRef(session, specOrRef.ref);
    return resolveLocator(page, spec);
  }
  return resolveLocator(page, specOrRef);
}

export async function runActionWithSession(page, session, action) {
  if (action.click && action.click.ref) {
    const loc = await resolveLocatorWithSession(page, session, action.click);
    await clickLocator(loc);
    await settlePage(page);
    return { type: 'click', url: page.url() };
  }
  return runAction(page, action);
}
