import { interpolate } from '@/i18n/interpolate';

describe('@/i18n/interpolate.ts', () => {
    it('should return the template untouched when no params are given', () => {
        expect(interpolate('Saved {{name}}!')).toBe('Saved {{name}}!');
    });

    it('should replace a single placeholder', () => {
        expect(interpolate('Saved {{name}}!', { name: 'config.yml' })).toBe('Saved config.yml!');
    });

    it('should replace repeated placeholders', () => {
        expect(interpolate('{{a}} and {{a}}', { a: 'x' })).toBe('x and x');
    });

    it('should stringify numeric params', () => {
        expect(interpolate('{{count}} backups', { count: 3 })).toBe('3 backups');
    });

    it('should leave unknown placeholders untouched', () => {
        expect(interpolate('Hello {{name}}', { other: 'x' })).toBe('Hello {{name}}');
    });

    it('should tolerate whitespace inside the braces', () => {
        expect(interpolate('Hello {{ name }}', { name: 'world' })).toBe('Hello world');
    });
});
