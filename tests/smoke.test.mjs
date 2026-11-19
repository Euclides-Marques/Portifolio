// Testes de fumaça do portfólio.
// Os arquivos são servidos direto do disco via interceptação de rede (sem servidor local)
// e usam o Google Chrome instalado na máquina (channel "chrome").
// Executar: npm test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'http://portfolio.test';
const CONTENT_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.pdf': 'application/pdf'
};

const FAKE_REPOS = Array.from({ length: 10 }, (_, i) => ({
    name: `repo-${i}`,
    html_url: '#',
    description: 'Repositório de teste',
    language: i % 2 ? 'C#' : 'JavaScript',
    fork: false
}));

let browser;

before(async () => {
    browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
});

after(async () => {
    await browser?.close();
});

async function openPage({ javaScriptEnabled = true, viewport = { width: 1440, height: 900 } } = {}) {
    const context = await browser.newContext({ javaScriptEnabled, viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.route(`${ORIGIN}/**`, async (route) => {
        let pathname = decodeURIComponent(new URL(route.request().url()).pathname);
        if (pathname === '/') pathname = '/index.html';
        const file = path.join(ROOT, pathname);
        if (!file.startsWith(ROOT) || !existsSync(file)) {
            return route.fulfill({ status: 404, body: 'not found' });
        }
        return route.fulfill({
            status: 200,
            body: await readFile(file),
            contentType: CONTENT_TYPES[path.extname(file)] || 'application/octet-stream'
        });
    });
    await page.route('https://api.github.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FAKE_REPOS) }));

    await page.goto(`${ORIGIN}/`, { waitUntil: 'load' });
    return { page, context, errors };
}

async function scrollTo(page, y) {
    await page.evaluate((top) => {
        if (window.lenis) window.lenis.scrollTo(top, { immediate: true });
        else window.scrollTo(0, top);
    }, y);
    await page.waitForTimeout(1500);
}

test('carrega sem erros de JavaScript e remove o loader', async () => {
    const { page, context, errors } = await openPage();
    await page.waitForFunction(() => !document.body.classList.contains('is-loading'), null, { timeout: 6000 });
    await page.waitForTimeout(1000);

    assert.equal(await page.locator('.loader').isVisible(), false);
    assert.deepEqual(errors, []);
    await context.close();
});

test('sem JavaScript o loader não cobre a página', async () => {
    const { page, context } = await openPage({ javaScriptEnabled: false });
    assert.equal(await page.locator('.loader').isVisible(), false);
    assert.equal(await page.locator('#sobre').count(), 1);
    await context.close();
});

test('parallax das seções é calculado depois do espaço do hero fixado', async () => {
    const { page, context } = await openPage();
    await page.waitForFunction(() => !document.body.classList.contains('is-loading'));

    const { pinEnd, aboutStart } = await page.evaluate(() => {
        const triggers = ScrollTrigger.getAll();
        const pin = triggers.find((t) => t.pin);
        const about = triggers.find((t) => t.trigger?.id === 'sobre' || t.trigger?.classList?.contains('about'));
        return { pinEnd: pin.end, aboutStart: about.start };
    });

    assert.ok(aboutStart > pinEnd - 1000, `parallax do Sobre começa em ${aboutStart}, mas o pin termina em ${pinEnd}`);
    await context.close();
});

test('o hero passa pelas quatro etapas CODE → BUILD → DEPLOY → RUN', async () => {
    const { page, context } = await openPage();
    await page.waitForFunction(() => !document.body.classList.contains('is-loading'));

    const { start, end } = await page.evaluate(() => {
        const pin = ScrollTrigger.getAll().find((t) => t.pin);
        return { start: pin.start, end: pin.end };
    });

    const expected = [[0, 0], [0.3, 1], [0.55, 2], [0.98, 3]];
    for (const [fraction, step] of expected) {
        await scrollTo(page, start + (end - start) * fraction);
        const active = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.story-progress li')).findIndex((li) => li.classList.contains('is-active')));
        assert.equal(active, step, `em ${fraction * 100}% do scroll a etapa ativa deveria ser ${step + 1}`);
    }
    await context.close();
});

test('troca de idioma traduz textos e aria-labels', async () => {
    const { page, context } = await openPage();
    await page.waitForFunction(() => window.i18n);

    await page.selectOption('#language-select', 'en');
    await page.waitForFunction(() => document.documentElement.lang === 'en-US');

    assert.equal(await page.getAttribute('.theme-toggle', 'aria-label'), 'Toggle theme');
    assert.equal(await page.getAttribute('#sobre .section-title', 'aria-label'), 'About Me');
    await context.close();
});

test('no mobile o carrossel de habilidades vira scroll horizontal sem cards inertes', async () => {
    const { page, context } = await openPage({ viewport: { width: 390, height: 844 } });
    await page.waitForFunction(() => !document.body.classList.contains('is-loading'));

    const inertCards = await page.locator('.stack-card[inert]').count();
    const overflowX = await page.$eval('.stack-cards', (el) => getComputedStyle(el).overflowX);
    assert.equal(inertCards, 0);
    assert.equal(overflowX, 'auto');
    await context.close();
});
