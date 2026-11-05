import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { advantageQuestions } from '../data/personal-advantage-questions.ts';
import { generateAdvantageProbes, reconcileAdvantageAnswers } from '../lib/personal-advantage-engine.ts';
import { getPersonalAdvantageEvidenceDisclosureLabel, getPersonalAdvantageUiCopy } from '../data/personal-advantage-locales.ts';
import { shareFileDictionaries } from '../data/i18n/share-file.ts';
const require = createRequire(import.meta.url);
let pw;
try {
    pw = require('playwright');
}
catch {
    assert.ok(process.env.BTS_PERSONAL_ADVANTAGE_BROWSER_PACKAGE_DIR, 'Provide installed Playwright runtime; no browser install is performed');
    pw = require(path.join(process.env.BTS_PERSONAL_ADVANTAGE_BROWSER_PACKAGE_DIR, 'playwright'));
}
const sharp = require('sharp');
const origin = process.env.BTS_PERSONAL_ADVANTAGE_TEST_URL ?? 'http://localhost:3237';
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname), 'Only local test server is allowed');
const out = '.bts-engineering/feedback-001';
fs.mkdirSync(out, { recursive: true });
const evidence = [];
const targets = new Set(['systems-thinking', 'communication-clarity']);
const answers = {};
for (const q of advantageQuestions) {
    const opts = q.options.filter(o => o.effects.some(e => targets.has(e.signalId)));
    if (opts.length) {
        const v = opts.slice(0, q.type === 'multi' ? q.maxSelections ?? 1 : 1).map(o => o.id);
        answers[q.id] = { value: q.type === 'multi' ? v : v[0] };
    }
}
answers.q21 = { value: [...targets] };
answers.q44 = { value: 'systems-thinking' };
answers.q46 = { value: [...targets] };
const probes = generateAdvantageProbes(answers);
const state = { schemaVersion: 1, phase: 'result', questionId: null, answers, probeAnswers: Object.fromEntries(probes.map(p => [p.id, p.options.reduce((a, b) => a.interaction > b.interaction ? a : b).id])), calibration: {}, updatedAt: '2026-11-05T10:00:00Z' };
function allowedLocalUrl(value) {
    const url = new URL(value);
    const target = url.protocol === 'blob:' ? new URL(url.pathname) : url;
    return target.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(target.hostname) && target.port === new URL(origin).port;
}

async function setup(browser, locale = 'en', width = 1280, fault, stored = state) {
    const context = await browser.newContext({ acceptDownloads: true, viewport: { width, height: 900 } });
    await context.route('**/*', route => allowedLocalUrl(route.request().url()) ? route.continue() : route.abort());
    await context.addInitScript(saved => {
        if (!localStorage.getItem('bts.personal-advantage.v1')) {
            localStorage.setItem('bts.personal-advantage.v1', JSON.stringify(saved));
        }
        const create = URL.createObjectURL.bind(URL);
        const revoke = URL.revokeObjectURL.bind(URL);
        window.__activeExportUrls = new Set();
        URL.createObjectURL = blob => {
            const url = create(blob);
            window.__activeExportUrls.add(url);
            return url;
        };
        URL.revokeObjectURL = url => {
            window.__activeExportUrls.delete(url);
            return revoke(url);
        };
    }, stored);
    if (fault === 'render') {
        await context.addInitScript(() => { HTMLCanvasElement.prototype.toBlob = function (callback) { callback(null); }; });
    }
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/' + locale + '/tools/personal-advantage');
    await page.getByRole('button', { name: getPersonalAdvantageUiCopy(locale).continue, exact: true }).click();
    if (stored.phase === 'result') {
        await page.getByRole('button', { name: new RegExp(getPersonalAdvantageUiCopy(locale).share) }).first().click();
        await page.getByRole('dialog').waitFor();
    }
    return { context, page, errors };
}

async function ready(page, locale) {
    const button = page.getByRole('button', { name: shareFileDictionaries[locale].downloadImage, exact: true });
    await button.waitFor();
    await page.waitForFunction(label => {
        const button = [...document.querySelectorAll('button')].find(element => element.textContent === label);
        return button && !button.disabled;
    }, shareFileDictionaries[locale].downloadImage);
    return button;
}
for (const name of ['chromium', 'firefox', 'webkit'])
    test('Personal Advantage actual PNG export and safe fallback: ' + name, async (t) => {
        let browser;
        try {
            browser = await pw[name].launch({ headless: true });
        }
        catch (error) {
            evidence.push({ browser: name, status: 'NOT RUN', reason: error.message.split('\n')[0] });
            fs.writeFileSync(out + '/browser-results.json', JSON.stringify(evidence, null, 2));
            t.skip(error.message.split('\n')[0]);
            return;
        }
        try {
            for (const locale of ['de', 'en', 'es', 'tr', 'pl', 'el', 'ru']) {
                const { context, page, errors } = await setup(browser, locale);
                try {
                    for (const [format, width, height] of [['story', 1080, 1920], ['portrait', 1080, 1350], ['square', 1080, 1080]]) {
                        await page.getByRole('dialog').getByRole('button', { name: getPersonalAdvantageUiCopy(locale).formats[format], exact: true }).click();
                        const button = await ready(page, locale);
                        const pending = page.waitForEvent('download');
                        await button.click();
                        const download = await pending;
                        const saved = out + `/export-${name}-${locale}-${format}.png`;
                        await download.saveAs(saved);
                        const bytes = fs.readFileSync(saved), metadata = await sharp(bytes).metadata(), stats = await sharp(bytes).stats();
                        assert.equal(metadata.format, 'png');
                        assert.equal(metadata.width, width);
                        assert.equal(metadata.height, height);
                        assert.ok(bytes.length > 10000);
                        assert.ok(stats.channels.some(c => c.stdev > 10));
                        assert.match(download.suggestedFilename(), /^bts-personal-advantage-(story|portrait|square)\.png$/);
                        assert.equal(await page.getByText(shareFileDictionaries[locale].imageDownloaded, { exact: true }).count(), 1);
                        evidence.push({ browser: name, locale, format, status: 'PASS', bytes: bytes.length, width, height, actualDownloadSaved: true });
                    }
                    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('bts.personal-advantage.v1')).answers), reconcileAdvantageAnswers(answers));
                    assert.deepEqual(errors, []);
                }
                finally {
                    await context.close();
                }
            }
            const { context, page, errors } = await setup(browser, 'en', 390);
            try {
                await ready(page, 'en');
                await page.clock.install();
                await page.evaluate(() => {
                    const schedule = window.setTimeout.bind(window);
                    window.__exportCleanupTimers = 0;
                    window.setTimeout = (callback, delay, ...args) => {
                        if (delay === 30000) window.__exportCleanupTimers++;
                        return schedule(callback, delay, ...args);
                    };
                });
                await page.evaluate(() => { HTMLAnchorElement.prototype.click = function () { if (this.download)
                    throw new DOMException('Fixture blocked download', 'NotAllowedError'); }; });
                await page.getByRole('button', { name: 'Save image', exact: true }).click();
                await page.getByText(shareFileDictionaries.en.actionFailed, { exact: true }).waitFor();
                assert.equal(await page.getByText(shareFileDictionaries.en.imageDownloaded, { exact: true }).count(), 0);
                await page.getByRole('dialog').locator('details summary').click();
                const fallback = page.getByRole('dialog').locator('details img');
                await fallback.waitFor({ state: 'visible' });
                await page.waitForFunction(() => document.querySelector('details img')?.naturalWidth === 1080);
                const natural = await fallback.evaluate(e => ({ width: e.naturalWidth, height: e.naturalHeight }));
                assert.deepEqual(natural, { width: 1080, height: 1920 });
                await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
                // React's passive unmount cleanup may run after click() resolves.
                // Advance only once BOTH the download and image cleanup are scheduled.
                await page.waitForFunction(() => window.__exportCleanupTimers === 2);
                await page.clock.fastForward(30001);
                assert.equal(await page.evaluate(() => window.__activeExportUrls.size), 0);
                assert.deepEqual(errors, []);
                evidence.push({ browser: name, status: 'PASS', mobileViewport: true, blockedDownload: 'honest error', fallbackImageOpened: true, urlsAfterGrace: 0 });
            }
            finally {
                await context.close();
            }
            const failure = await setup(browser, 'en', 390, 'render');
            try {
                await failure.page.getByText(shareFileDictionaries.en.imageFailed, { exact: true }).waitFor();
                assert.equal(await failure.page.getByRole('button', { name: 'Save image', exact: true }).isDisabled(), true);
                await failure.page.getByRole('button', { name: 'Screenshot mode', exact: true }).click();
                assert.equal(await failure.page.getByRole('button', { name: 'Exit screenshot mode', exact: true }).count(), 1);
                evidence.push({ browser: name, status: 'PASS', renderFailureHandled: true, screenshotFallback: true });
            }
            finally {
                await failure.context.close();
            }
        }
        finally {
            await browser.close();
            fs.writeFileSync(out + '/browser-results.json', JSON.stringify(evidence, null, 2));
        }
    });
test('adaptive closing resumes at first unanswered probe, reconciles back changes and retains calibration', async () => {
    const browser = await pw.chromium.launch({ headless: true });
    const all = generateAdvantageProbes(answers);
    let context;
    try {
        const f = await setup(browser, 'en', 390, undefined, { ...state, phase: 'probes', probeAnswers: { [all[0].id]: 'together' } });
        context = f.context;
        const page = f.page;
        await page.getByRole('heading', { name: all[1].prompt, exact: true }).waitFor();
        assert.match(await page.locator('body').innerText(), /2\/7/);
        await page.getByRole('button', { name: '← Back', exact: true }).click();
        await page.getByRole('radio', { name: "I'm not sure.", exact: true }).click();
        assert.match(await page.locator('body').innerText(), /1\/8/);
        await page.getByRole('radio', { name: 'They regularly happen together.', exact: true }).click();
        assert.match(await page.locator('body').innerText(), /1\/7/);
        for (let i = 0; i < 12; i++) {
            const heading = await page.getByRole('heading', { level: 1 }).innerText();
            if (heading === getPersonalAdvantageUiCopy('en').calibrationTitle)
                break;
            await page.getByRole('radio').first().click();
            await page.getByRole('button', { name: /^Continue/ }).click();
        }
        await page.getByRole('heading', { name: getPersonalAdvantageUiCopy('en').calibrationTitle, exact: true }).waitFor();
        assert.equal(await page.getByRole('radio', { name: getPersonalAdvantageUiCopy('en').notReally, exact: true }).count(), 3);
        await page.getByRole('button', { name: '← Back', exact: true }).click();
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('bts.personal-advantage.v1')).phase === 'probes');
        await page.reload();
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.getByRole('heading', { name: getPersonalAdvantageUiCopy('en').calibrationTitle, exact: true }).waitFor();
        evidence.push({ status: 'PASS', closingResume: true, backNavigation: true, probeCounts: [8, 7], calibrationRetained: true });
    }
    finally {
        if (context)
            await context.close();
        await browser.close();
        fs.writeFileSync(out + '/browser-results.json', JSON.stringify(evidence, null, 2));
    }
});
test('sparse resumed evidence can reach an emerging result without manufacturing confidence', async () => {
    const browser = await pw.chromium.launch({ headless: true });
    let context;
    try {
        const f = await setup(browser, 'en', 390, undefined, { ...state, phase: 'probes', answers: {}, probeAnswers: {} });
        context = f.context;
        await f.page.getByRole('heading', { name: getPersonalAdvantageUiCopy('en').calibrationTitle, exact: true }).waitFor();
        assert.equal(await f.page.getByRole('radio').count(), 0);
        assert.equal(await f.page.getByRole('button', { name: new RegExp(getPersonalAdvantageUiCopy('en').connecting) }).isDisabled(), false);
        await f.page.getByRole('button', { name: new RegExp(getPersonalAdvantageUiCopy('en').connecting) }).click();
        await f.page.getByRole('button', { name: getPersonalAdvantageUiCopy('en').reveal, exact: false }).click();
        await f.page.getByRole('heading', { name: 'Emerging Personal Pattern', exact: true, level: 1 }).waitFor();
        evidence.push({ status: 'PASS', sparseEvidence: 'emerging result only' });
    }
    finally {
        if (context)
            await context.close();
        await browser.close();
        fs.writeFileSync(out + '/browser-results.json', JSON.stringify(evidence, null, 2));
    }
});

for (const name of ['chromium', 'webkit']) {
    test('evidence disclosure preserves content, keyboard focus and hash navigation: ' + name, async () => {
        const browser = await pw[name].launch({ headless: true });
        try {
            for (const locale of ['de', 'en', 'es', 'tr', 'pl', 'el', 'ru']) {
                const { context, page, errors } = await setup(browser, locale, locale === 'de' ? 1280 : 390);
                try {
                    await page.getByRole('dialog').getByRole('button', { name: getPersonalAdvantageUiCopy(locale).close, exact: true }).click();
                    const details = page.locator('#advantage-evidence');
                    const summary = details.locator('summary');
                    const before = await page.evaluate(() => {
                        const { answers, probeAnswers, calibration } = JSON.parse(localStorage.getItem('bts.personal-advantage.v1'));
                        return { answers, probeAnswers, calibration };
                    });
                    assert.equal(await details.evaluate(element => element.open), false);
                    assert.equal(await summary.innerText(), getPersonalAdvantageEvidenceDisclosureLabel(locale));
                    assert.equal(await details.locator('h3').first().isVisible(), false);
                    assert.equal(await details.evaluate(element => Boolean(document.getElementById('advantage-onepager').compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
                    const content = await details.locator('h3').allTextContents();
                    assert.ok(content.length >= 3);
                    const semantics = await summary.ariaSnapshot();
                    // Native summary is exposed as a disclosure control by browsers;
                    // Playwright's ARIA serializer may omit that platform-specific role.
                    assert.ok(semantics.includes(getPersonalAdvantageEvidenceDisclosureLabel(locale)));
                    assert.equal(await summary.evaluate(element => element.tagName === 'SUMMARY' && element.parentElement.tagName === 'DETAILS' && element.tabIndex === 0), true);
                    if (locale === 'de' || locale === 'en') {
                        await summary.scrollIntoViewIfNeeded();
                        await page.screenshot({ path: `${out}/evidence-${name}-${locale}-collapsed.png` });
                    }
                    await summary.focus();
                    await page.keyboard.press('Enter');
                    assert.equal(await details.evaluate(element => element.open), true);
                    assert.equal(await details.locator('h3').first().isVisible(), true);
                    await page.keyboard.press('Space');
                    assert.equal(await details.evaluate(element => element.open), false);
                    const link = page.locator('nav a[href="#advantage-evidence"]');
                    await link.click();
                    await page.waitForFunction(() => document.querySelector('#advantage-evidence')?.open && document.activeElement === document.querySelector('#advantage-evidence summary'));
                    assert.equal(new URL(page.url()).hash, '#advantage-evidence');
                    // A repeated link activation must reopen even when the hash is unchanged.
                    await summary.click();
                    assert.equal(await details.evaluate(element => element.open), false);
                    await link.click();
                    assert.equal(await details.evaluate(element => element.open), true);
                    await page.locator('nav a[href="#advantage-onepager"]').click();
                    await page.waitForURL(url => url.hash === '#advantage-onepager');
                    await details.evaluate(element => { element.open = false; });
                    await page.goBack();
                    await page.waitForURL(url => url.hash === '#advantage-evidence');
                    await page.waitForFunction(() => document.querySelector('#advantage-evidence')?.open && document.activeElement === document.querySelector('#advantage-evidence summary'));
                    await page.reload();
                    await page.getByRole('button', { name: getPersonalAdvantageUiCopy(locale).continue, exact: true }).click();
                    await page.waitForFunction(() => document.querySelector('#advantage-evidence')?.open && document.activeElement === document.querySelector('#advantage-evidence summary'));
                    assert.deepEqual(await details.locator('h3').allTextContents(), content);
                    assert.equal(await summary.evaluate(element => element.getBoundingClientRect().width <= innerWidth), true);
                    const after = await page.evaluate(() => {
                        const { answers, probeAnswers, calibration } = JSON.parse(localStorage.getItem('bts.personal-advantage.v1'));
                        return { answers, probeAnswers, calibration };
                    });
                    assert.deepEqual(after, before);
                    assert.deepEqual(errors, []);
                    evidence.push({ browser: name, locale, status: 'PASS', disclosure: 'collapsed initially; keyboard and fragment navigation work', contentPreserved: true, assessmentUnchanged: true });
                } catch (error) {
                    const debug = await page.evaluate(() => ({ hash: location.hash, open: document.querySelector('#advantage-evidence')?.open, active: document.activeElement?.outerHTML.slice(0, 200) }));
                    throw new Error(`${name}/${locale}: ${error.message}; ${JSON.stringify(debug)}`, { cause: error });
                } finally {
                    await context.close();
                }
            }
        } finally {
            await browser.close();
            fs.writeFileSync(out + '/browser-results.json', JSON.stringify(evidence, null, 2));
        }
    });
}
