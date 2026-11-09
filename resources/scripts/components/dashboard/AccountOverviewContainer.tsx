import { useLocation } from 'react-router-dom';
import AccountSection from '@/components/dashboard/AccountSection';
import AccountServerStats from '@/components/dashboard/AccountServerStats';
import AppearanceSettings from '@/components/dashboard/AppearanceSettings';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import UpdateNameForm from '@/components/dashboard/forms/UpdateNameForm';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import LanguageSelector from '@/components/dashboard/LanguageSelector';
import Code from '@/components/elements/Code';
import { MainPageHeader } from '@/components/elements/MainPageHeader';
import PageContentBlock from '@/components/elements/PageContentBlock';
import MessageBox from '@/components/MessageBox';
import { useTranslation } from '@/i18n/I18nProvider';

const AccountOverviewContainer = () => {
    const { t } = useTranslation();
    const { state } = useLocation();

    return (
        <PageContentBlock title={t('account.overview.title')}>
            <MainPageHeader title={t('account.overview.title')} />

            {state?.twoFactorRedirect && (
                <MessageBox title={t('account.overview.two_factor_required_title')} type={'error'}>
                    {t('account.overview.two_factor_required_description')}
                </MessageBox>
            )}

            <div className='flex flex-col gap-4 pb-6'>
                {/*
                 * Two independent columns rather than a grid: a grid aligns every
                 * row to its tallest card, which left a large void under the short
                 * cards (Profile above Account Email). Stacking each column on its
                 * own keeps the cards tight while the mobile order stays Name,
                 * Email, Language, Password, 2FA, Version.
                 */}
                <div className='flex flex-col gap-4 lg:flex-row lg:items-start'>
                    <div className='flex min-w-0 flex-1 flex-col gap-4'>
                        <AccountSection title={t('account.name.title')} showFlashes={'account:name'}>
                            <UpdateNameForm />
                        </AccountSection>

                        <AccountSection title={t('account.overview.email_title')} showFlashes={'account:email'}>
                            <UpdateEmailAddressForm />
                        </AccountSection>

                        <AccountSection title={t('panel.language')} description={t('account.language.description')}>
                            <LanguageSelector />
                        </AccountSection>

                        <AccountServerStats />
                    </div>

                    <div className='flex min-w-0 flex-1 flex-col gap-4'>
                        <AccountSection title={t('account.overview.password_title')} showFlashes={'account:password'}>
                            <UpdatePasswordForm />
                        </AccountSection>

                        <AccountSection title={t('account.overview.two_factor_title')}>
                            <ConfigureTwoFactorForm />
                        </AccountSection>

                        <AccountSection
                            title={t('account.overview.version_title')}
                            description={t('account.overview.version_description')}
                        >
                            <div className='flex flex-col gap-2'>
                                <Code>
                                    {t('account.overview.version_label')} {import.meta.env.VITE_HYDRODACTYL_VERSION} -{' '}
                                    {import.meta.env.VITE_BRANCH_NAME}
                                </Code>
                                <Code>
                                    {t('account.overview.commit_label')} {import.meta.env.VITE_COMMIT_HASH.slice(0, 7)}
                                </Code>
                            </div>
                        </AccountSection>
                    </div>
                </div>

                <AppearanceSettings />
            </div>
        </PageContentBlock>
    );
};

export default AccountOverviewContainer;
