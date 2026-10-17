import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import {
    appearanceAccents,
    appearancePalettes,
    appearanceStorageKey,
    applyAppearance,
    parseAppearance,
    readAppearance,
    resolveTheme,
    saveAppearance,
} from '../../resources/scripts/lib/appearance.ts';

test('stores the application palette independently from accent and brightness', () => {
    assert.deepEqual(parseAppearance('{"mode":"light","accent":"green","palette":"blue"}'), {
        mode: 'light',
        accent: 'green',
        palette: 'blue',
    });
    assert.deepEqual(parseAppearance('{"mode":"system","accent":"rose"}'), {
        mode: 'system',
        accent: 'rose',
        palette: 'neutral',
    });
});

test('offers Obsidian, Dracula and Nord alongside existing palettes', () => {
    assert.deepEqual(
        Object.keys(appearancePalettes).sort(),
        ['blue', 'dracula', 'green', 'mocha', 'neutral', 'nord', 'obsidian', 'red', 'violet', 'yellow'].sort(),
    );
    assert.equal(appearancePalettes.obsidian, 'Obsidian');
    assert.equal(appearancePalettes.dracula, 'Dracula');
    assert.equal(appearancePalettes.nord, 'Nord');
});

test('defaults to dark and the panel accent, including corrupt or unsupported saved values', () => {
    for (const value of [null, '', '{', 'null', '[]', '42', '"light"', '{"mode":"invalid","accent":"url(evil)"}']) {
        assert.deepEqual(parseAppearance(value), { mode: 'dark', accent: 'panel', palette: 'neutral' });
    }
    assert.deepEqual(parseAppearance('{"mode":"light","accent":"unknown","palette":"__proto__"}'), {
        mode: 'light',
        accent: 'panel',
        palette: 'neutral',
    });
});

test('round trips every mode and accent through browser storage', () => {
    const values = new Map();
    const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
    for (const mode of ['dark', 'light', 'system']) {
        for (const accent of Object.keys(appearanceAccents)) {
            for (const palette of Object.keys(appearancePalettes)) {
                const preferences = { mode, accent, palette };
                assert.equal(saveAppearance(preferences, storage), true);
                assert.deepEqual(readAppearance(storage), preferences);
                assert.deepEqual(JSON.parse(values.get(appearanceStorageKey)), preferences);
            }
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
    assert.deepEqual(readAppearance(storage), { mode: 'dark', accent: 'panel', palette: 'neutral' });
    assert.equal(saveAppearance({ mode: 'light', accent: 'blue', palette: 'red' }, storage), false);
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
    assert.equal(applyAppearance({ mode: 'system', accent: 'green', palette: 'blue' }, false, root), 'light');
    assert.deepEqual(root.dataset, { theme: 'light', accent: 'green', palette: 'blue' });
    assert.equal(root.style.colorScheme, 'light');
    assert.equal(root.style['--brand-color'], '#123456');
    applyAppearance({ mode: 'dark', accent: 'panel', palette: 'red' }, false, root);
    assert.equal(root.dataset.theme, 'dark');
    assert.equal(root.dataset.accent, 'panel');
    assert.equal(root.dataset.palette, 'red');
});

test('the pre-paint bootstrap agrees with runtime validation for all preferences', () => {
    const template = readFileSync(
        new URL('../../resources/views/templates/appearance.blade.php', import.meta.url),
        'utf8',
    );
    const script = template.match(/<script>([\s\S]*?)<\/script>/)[1];
    const values = [null, '{', 'null', '[]', '{"mode":"bad","accent":"__proto__"}'];
    for (const mode of ['dark', 'light', 'system']) {
        for (const accent of Object.keys(appearanceAccents)) {
            values.push(JSON.stringify({ mode, accent }));
            for (const palette of Object.keys(appearancePalettes))
                values.push(JSON.stringify({ mode, accent, palette }));
        }
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
            assert.equal(root.dataset.palette, expected.palette);
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
    assert.equal(root.dataset.palette, 'neutral');
});
