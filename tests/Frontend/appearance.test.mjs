import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import {
    appearanceAccents,
    appearanceStorageKey,
    applyAppearance,
    parseAppearance,
    readAppearance,
    resolveTheme,
    saveAppearance,
} from '../../resources/scripts/lib/appearance.ts';

test('defaults to dark and the panel accent, including corrupt or unsupported saved values', () => {
    for (const value of [null, '', '{', 'null', '[]', '42', '"light"', '{"mode":"invalid","accent":"url(evil)"}']) {
        assert.deepEqual(parseAppearance(value), { mode: 'dark', accent: 'panel' });
    }
    assert.deepEqual(parseAppearance('{"mode":"light","accent":"unknown"}'), { mode: 'light', accent: 'panel' });
});

test('round trips every mode and accent through browser storage', () => {
    const values = new Map();
    const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
    for (const mode of ['dark', 'light', 'system']) {
        for (const accent of Object.keys(appearanceAccents)) {
            const preferences = { mode, accent };
            assert.equal(saveAppearance(preferences, storage), true);
            assert.deepEqual(readAppearance(storage), preferences);
            assert.deepEqual(JSON.parse(values.get(appearanceStorageKey)), preferences);
        }
    }
});

test('unavailable storage does not prevent changing appearance', () => {
    const storage = {
        getItem() {
            throw new Error('SecurityError');
        },
        setItem() {
            throw new Error('QuotaExceededError');
        },
    };
    assert.deepEqual(readAppearance(storage), { mode: 'dark', accent: 'panel' });
    assert.equal(saveAppearance({ mode: 'light', accent: 'blue' }, storage), false);
});

test('only system mode follows the browser preference', () => {
    for (const systemDark of [false, true]) {
        assert.equal(resolveTheme('light', systemDark), 'light');
        assert.equal(resolveTheme('dark', systemDark), 'dark');
        assert.equal(resolveTheme('system', systemDark), systemDark ? 'dark' : 'light');
    }
});

test('applies theme and accent without overwriting the server brand color', () => {
    const root = { dataset: {}, style: { colorScheme: '', '--brand-color': '#123456' } };
    assert.equal(applyAppearance({ mode: 'system', accent: 'green' }, false, root), 'light');
    assert.deepEqual(root.dataset, { theme: 'light', accent: 'green' });
    assert.equal(root.style.colorScheme, 'light');
    assert.equal(root.style['--brand-color'], '#123456');
    applyAppearance({ mode: 'dark', accent: 'panel' }, false, root);
    assert.equal(root.dataset.theme, 'dark');
    assert.equal(root.dataset.accent, 'panel');
});

test('the pre-paint bootstrap agrees with runtime validation for all preferences', () => {
    const template = readFileSync(
        new URL('../../resources/views/templates/appearance.blade.php', import.meta.url),
        'utf8',
    );
    const script = template.match(/<script>([\s\S]*?)<\/script>/)[1];
    const values = [null, '{', 'null', '[]', '{"mode":"bad","accent":"__proto__"}'];
    for (const mode of ['dark', 'light', 'system']) {
        for (const accent of Object.keys(appearanceAccents)) values.push(JSON.stringify({ mode, accent }));
    }
    for (const saved of values) {
        for (const systemDark of [false, true]) {
            const root = { dataset: {}, style: {} };
            runInNewContext(script, {
                document: { documentElement: root },
                localStorage: { getItem: () => saved },
                window: { matchMedia: () => ({ matches: systemDark }) },
            });
            const expected = parseAppearance(saved);
            assert.equal(root.dataset.theme, resolveTheme(expected.mode, systemDark));
            assert.equal(root.dataset.accent, expected.accent);
            assert.equal(root.style.colorScheme, root.dataset.theme);
        }
    }
    const root = { dataset: {}, style: {} };
    runInNewContext(script, {
        document: { documentElement: root },
        get localStorage() {
            throw new Error('Storage blocked');
        },
        window: {},
    });
    assert.equal(root.dataset.theme, 'dark');
    assert.equal(root.dataset.accent, 'panel');
});
