import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeBrandColor } from '../../resources/scripts/lib/brand-color.ts';

test('normalizes valid hex colors and rejects invalid input', () => {
    assert.equal(normalizeBrandColor(' #aBc '), '#AABBCC');
    assert.equal(normalizeBrandColor('#a1B2c3'), '#A1B2C3');
    for (const value of ['', '#', 'ABC', '#12', '#1234', '#12345678', '#GGG', 'red', 'url(x)', '#a bc']) {
        assert.equal(normalizeBrandColor(value), null);
    }
});
