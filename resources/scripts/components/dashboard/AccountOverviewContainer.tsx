import { useLocation } from 'react-router-dom';
import AccountSection from '@/components/dashboard/AccountSection';
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
                <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start'>
                    <AccountSection
                        title={t('account.name.title')}
                        showFlashes={'account:name'}
                        className='lg:col-start-1 lg:row-start-1'
                    >
                        <UpdateNameForm />
                    </AccountSection>

                    <AccountSection
                        title={t('account.overview.email_title')}
                        showFlashes={'account:email'}
                        className='lg:col-start-1 lg:row-start-2'
                    >
                        <UpdateEmailAddressForm />
                    </AccountSection>

                    <AccountSection
                        title={t('panel.language')}
                        description={t('account.language.description')}
                        className='lg:col-start-1 lg:row-start-3'
                    >
                        <LanguageSelector />
                    </AccountSection>

                    <AccountSection
                        title={t('account.overview.password_title')}
                        showFlashes={'account:password'}
                        className='lg:col-start-2 lg:row-start-1'
                    >
                        <UpdatePasswordForm />
                    </AccountSection>

                    <AccountSection
                        title={t('account.overview.two_factor_title')}
                        className='lg:col-start-2 lg:row-start-2'
                    >
                        <ConfigureTwoFactorForm />
                    </AccountSection>

                    <AccountSection
                        title={t('account.overview.version_title')}
                        description={t('account.overview.version_description')}
                        className='lg:col-start-2 lg:row-start-3'
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

                <AppearanceSettings />
            </div>
        </PageContentBlock>
    );
};

export default AccountOverviewContainer;
