import ContentBox from '@/components/elements/ContentBox';
import Select from '@/components/elements/Select';
import { useAppearance } from '@/contexts/AppearanceContext';
import { type Appearance, type AppearanceMode, appearanceAccents } from '@/lib/appearance';

export default function AppearanceSettings() {
    const { preferences, persistent, updateAppearance } = useAppearance();
    const selectClass =
        'mt-2 min-h-11 w-full rounded-lg border border-mocha-50 bg-mocha-600 px-3 pr-10 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hydro-400';

    return (
        <ContentBox title='Appearance'>
            <p id='appearance-description' className='mb-4 text-sm text-secondary'>
                These preferences apply only to this browser, including the admin panel. Changes are saved
                automatically.
            </p>
            <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                    <label className='text-sm font-medium' htmlFor='appearance-mode'>
                        Theme
                    </label>
                    <Select
                        id='appearance-mode'
                        className={selectClass}
                        value={preferences.mode}
                        aria-describedby='appearance-description'
                        onChange={(event) => updateAppearance({ mode: event.target.value as AppearanceMode })}
                    >
                        <option value='dark'>Dark (default)</option>
                        <option value='light'>Light</option>
                        <option value='system'>Use system setting</option>
                    </Select>
                </div>
                <div>
                    <label className='text-sm font-medium' htmlFor='appearance-accent'>
                        Accent color
                    </label>
                    <Select
                        id='appearance-accent'
                        className={selectClass}
                        value={preferences.accent}
                        aria-describedby='appearance-description'
                        onChange={(event) => updateAppearance({ accent: event.target.value as Appearance['accent'] })}
                    >
                        {Object.entries(appearanceAccents).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>
            {!persistent && (
                <p role='status' className='mt-4 text-sm text-secondary'>
                    Browser storage is unavailable. Your selection will last until you reload this page.
                </p>
            )}
        </ContentBox>
    );
}
