import { NavLink, Outlet } from 'react-router-dom';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { useTranslation } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

const tabClass = 'rounded-lg px-3 py-1.5 text-sm transition-colors';

const SettingsLayout = () => {
    const { t } = useTranslation();

    const tabs = [
        { label: t('admin.settings.tab_general'), to: '/settings', end: true },
        { label: t('admin.settings.tab_mail'), to: '/settings/mail' },
        { label: t('admin.settings.tab_captcha'), to: '/settings/captcha' },
        { label: t('admin.settings.tab_domains'), to: '/settings/domains' },
        { label: t('admin.settings.tab_custom_nav'), to: '/settings/custom-navigation' },
        { label: t('admin.settings.tab_branding'), to: '/settings/logo' },
        { label: t('admin.settings.tab_advanced'), to: '/settings/advanced' },
    ];

    return (
        <PageContentBlock title={t('admin.nav.settings')}>
            <MainPageHeader direction='column' title={t('admin.nav.settings')}>
                <p className='text-sm text-neutral-400'>{t('admin.settings.description')}</p>
            </MainPageHeader>

            <div className='mb-6 flex flex-wrap gap-1 rounded-xl border border-mocha-400 bg-mocha-500 p-1'>
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.label}
                        to={tab.to}
                        end={tab.end}
                        className={({ isActive }) =>
                            cn(
                                tabClass,
                                isActive
                                    ? 'bg-hydro-500/15 font-medium text-hydro-400'
                                    : 'text-cream-400/70 hover:bg-mocha-400 hover:text-cream-100',
                            )
                        }
                    >
                        {tab.label}
                    </NavLink>
                ))}
            </div>

            <Outlet />
        </PageContentBlock>
    );
};

export default SettingsLayout;
