import { Checkmark } from '@carbon/icons-react';
import ContentBox from '@/components/elements/ContentBox';
import { useAppearance } from '@/contexts/AppearanceContext';
import { type Appearance, type AppearanceMode, appearanceAccents, appearancePalettes } from '@/lib/appearance';

const radioClass = 'sr-only';
const choiceClass =
    'flex min-h-11 min-w-0 cursor-pointer items-center rounded-lg border border-mocha-50 bg-mocha-600 p-3 text-sm has-[:checked]:border-hydro-400 has-[:checked]:ring-2 has-[:checked]:ring-hydro-400 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hydro-400';
const paletteChoiceClass =
    'flex min-h-24 min-w-0 cursor-pointer flex-col gap-3 rounded-xl border border-mocha-50 bg-mocha-600 p-3 text-sm transition-colors hover:border-mocha-100 has-[:checked]:border-hydro-400 has-[:checked]:bg-mocha-500 has-[:checked]:ring-2 has-[:checked]:ring-hydro-400 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hydro-400';

export default function AppearanceSettings() {
    const { preferences, theme, persistent, updateAppearance } = useAppearance();

    return (
        <ContentBox title='Appearance'>
            <p id='appearance-description' className='mb-4 text-sm text-secondary'>
                These preferences apply only to this browser, including the admin panel. Changes are saved
                automatically.
            </p>
            <div className='space-y-6'>
                <fieldset aria-describedby='appearance-mode-description'>
                    <legend className='text-sm font-medium'>Theme</legend>
                    <p id='appearance-mode-description' className='mb-2 text-xs text-secondary'>
                        Choose a light or dark appearance.
                    </p>
                    <div className='flex flex-wrap gap-2'>
                        {(
                            [
                                ['light', 'Light'],
                                ['dark', 'Dark'],
                                ['system', 'Use system setting'],
                            ] as const
                        ).map(([value, label]) => (
                            <label key={value} className={`${choiceClass} flex-1 sm:flex-none`}>
                                <input
                                    className={radioClass}
                                    type='radio'
                                    name='appearance-mode'
                                    value={value}
                                    checked={preferences.mode === value}
                                    onChange={() => updateAppearance({ mode: value as AppearanceMode })}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </fieldset>
                <fieldset aria-describedby='appearance-palette-description'>
                    <legend className='text-sm font-medium'>Application palette</legend>
                    <p id='appearance-palette-description' className='mb-2 text-xs text-secondary'>
                        Backgrounds, cards, borders and text.
                    </p>
                    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4'>
                        {Object.entries(appearancePalettes).map(([value, label]) => (
                            <label key={value} className={paletteChoiceClass}>
                                <input
                                    className={radioClass}
                                    type='radio'
                                    name='appearance-palette'
                                    value={value}
                                    checked={preferences.palette === value}
                                    onChange={() => updateAppearance({ palette: value as Appearance['palette'] })}
                                />
                                <span className='flex min-h-5 w-full min-w-0 items-center justify-between gap-2'>
                                    <span className='min-w-0 truncate font-medium'>{label}</span>
                                    {preferences.palette === value && (
                                        <span
                                            aria-hidden='true'
                                            data-selected-indicator
                                            className='flex size-5 shrink-0 items-center justify-center rounded-full bg-hydro-400 text-mocha-700'
                                        >
                                            <Checkmark className='size-3' />
                                        </span>
                                    )}
                                </span>
                                <span
                                    aria-hidden='true'
                                    className='appearance-preview grid h-9 w-full grid-cols-3 gap-1'
                                    data-theme={theme}
                                    data-palette={value}
                                >
                                    <span className='rounded-sm border border-current/20 bg-[var(--color-bg)]' />
                                    <span className='rounded-sm border border-current/20 bg-[var(--color-bg-raised)]' />
                                    <span className='rounded-sm border border-current/20 bg-[var(--color-primary)]' />
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <fieldset aria-describedby='appearance-accent-description'>
                    <legend className='text-sm font-medium'>Accent color</legend>
                    <p id='appearance-accent-description' className='mb-2 text-xs text-secondary'>
                        Highlights and actions, independent of the palette.
                    </p>
                    <div className='flex flex-wrap gap-2'>
                        {Object.entries(appearanceAccents).map(([value, label]) => (
                            <label key={value} className={choiceClass}>
                                <input
                                    className={radioClass}
                                    type='radio'
                                    name='appearance-accent'
                                    value={value}
                                    checked={preferences.accent === value}
                                    onChange={() => updateAppearance({ accent: value as Appearance['accent'] })}
                                />
                                <span>{label}</span>
                                <span
                                    aria-hidden='true'
                                    className='appearance-preview ml-2 h-5 w-5 shrink-0 rounded-full border border-current bg-[var(--panel-accent)]'
                                    data-theme={theme}
                                    data-palette={preferences.palette}
                                    data-accent={value}
                                />
                            </label>
                        ))}
                    </div>
                </fieldset>
            </div>
            {!persistent && (
                <p role='status' className='mt-4 text-sm text-secondary'>
                    Browser storage is unavailable. Your selection will last until you reload this page.
                </p>
            )}
        </ContentBox>
    );
}
