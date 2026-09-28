import { formatBackupStorage } from './backupStorageFormat';

describe('formatBackupStorage()', () => {
    it.each([
        [null, '0 MiB'],
        [undefined, '0 MiB'],
        [512, '512.0 MiB'],
        [1024, '1.0 GiB'],
        [3788.8, '3.7 GiB'],
    ])('formats binary megabytes with IEC units', (input, output) => {
        expect(formatBackupStorage(input)).toBe(output);
    });

    it('supports more precision for storage details', () => {
        expect(formatBackupStorage(1536, 2)).toBe('1.50 GiB');
    });

    it('uses the decimal separator of the given locale', () => {
        expect(formatBackupStorage(1536, 2, 'es-ES')).toBe('1,50 GiB');
        expect(formatBackupStorage(3788.8, 1, 'es-ES')).toBe('3,7 GiB');
    });
});
