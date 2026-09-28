import { useTranslation } from '@/i18n/I18nProvider';

const ScheduleCheatsheetCards = () => {
    const { t } = useTranslation();

    return (
        <>
            <div className={`md:w-1/2 h-full bg-zinc-600`}>
                <div className={`flex flex-col`}>
                    <h2 className={`py-4 px-6 font-bold`}>{t('server.schedules.cheatsheet.examples')}</h2>
                    <div className={`flex py-4 px-6 bg-zinc-500`}>
                        <div className={`w-1/2`}>*/5 * * * *</div>
                        <div className={`w-1/2`}>{t('server.schedules.cheatsheet.every_5_minutes')}</div>
                    </div>
                    <div className={`flex py-4 px-6`}>
                        <div className={`w-1/2`}>0 */1 * * *</div>
                        <div className={`w-1/2`}>{t('server.schedules.cheatsheet.every_hour')}</div>
                    </div>
                    <div className={`flex py-4 px-6 bg-zinc-500`}>
                        <div className={`w-1/2`}>0 8-12 * * *</div>
                        <div className={`w-1/2`}>{t('server.schedules.cheatsheet.hour_range')}</div>
                    </div>
                    <div className={`flex py-4 px-6`}>
                        <div className={`w-1/2`}>0 0 * * *</div>
                        <div className={`w-1/2`}>{t('server.schedules.cheatsheet.once_a_day')}</div>
                    </div>
                    <div className={`flex py-4 px-6 bg-zinc-500`}>
                        <div className={`w-1/2`}>0 0 * * MON</div>
                        <div className={`w-1/2`}>{t('server.schedules.cheatsheet.every_monday')}</div>
                    </div>
                </div>
            </div>
            <div className={`md:w-1/2 h-full bg-zinc-600`}>
                <h2 className={`py-4 px-6 font-bold`}>{t('server.schedules.cheatsheet.special_characters')}</h2>
                <div className={`flex flex-col`}>
                    <div className={`flex py-4 px-6 bg-zinc-500`}>
                        <div className={`w-1/2`}>*</div>
                        <div className={`w-1/2`}>{t('server.schedules.cheatsheet.any_value')}</div>
                    </div>
                    <div className={`flex py-4 px-6`}>
                        <div className={`w-1/2`}>,</div>
                        <div className={`w-1/2`}>{t('server.schedules.cheatsheet.value_list_separator')}</div>
                    </div>
                    <div className={`flex py-4 px-6 bg-zinc-500`}>
                        <div className={`w-1/2`}>-</div>
                        <div className={`w-1/2`}>{t('server.schedules.cheatsheet.range_values')}</div>
                    </div>
                    <div className={`flex py-4 px-6`}>
                        <div className={`w-1/2`}>/</div>
                        <div className={`w-1/2`}>{t('server.schedules.cheatsheet.step_values')}</div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ScheduleCheatsheetCards;
