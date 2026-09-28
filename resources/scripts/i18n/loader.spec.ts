import { loadDateFnsLocale } from '@/i18n/loader';

describe('@/i18n/loader.ts', () => {
    describe('loadDateFnsLocale()', () => {
        it('loads the locale matching the language', async () => {
            await expect(loadDateFnsLocale('es-ES')).resolves.toMatchObject({ code: 'es' });
            await expect(loadDateFnsLocale('fr-FR')).resolves.toMatchObject({ code: 'fr' });
        });

        it('prefers the regional variant when date-fns ships one', async () => {
            await expect(loadDateFnsLocale('pt-BR')).resolves.toMatchObject({ code: 'pt-BR' });
            await expect(loadDateFnsLocale('zh-CN')).resolves.toMatchObject({ code: 'zh-CN' });
        });

        it('falls back to the language for unknown regions', async () => {
            await expect(loadDateFnsLocale('es-MX')).resolves.toMatchObject({ code: 'es' });
        });

        it('falls back to en-US for unknown languages', async () => {
            await expect(loadDateFnsLocale('xx-XX')).resolves.toMatchObject({ code: 'en-US' });
            await expect(loadDateFnsLocale('en-US')).resolves.toMatchObject({ code: 'en-US' });
        });
    });
});
