import {
    Globe02Icon,
    InformationCircleIcon,
    Mail02Icon,
    PaintBrush02Icon,
    Settings02Icon,
    Shield01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import AdvancedSettingsTab from '@/components/admin/settings/AdvancedSettingsTab';
import BrandingSettingsTab from '@/components/admin/settings/BrandingSettingsTab';
import CaptchaSettingsTab from '@/components/admin/settings/CaptchaSettingsTab';
import DomainsSettingsTab from '@/components/admin/settings/DomainsSettingsTab';
import GeneralSettingsTab from '@/components/admin/settings/GeneralSettingsTab';
import MailSettingsTab from '@/components/admin/settings/MailSettingsTab';
import { MainPageHeader } from '@/components/elements/MainPageHeader';

const tabs = [
    { to: '/admin/settings', label: 'General', end: true, icon: InformationCircleIcon },
    { to: '/admin/settings/mail', label: 'Mail', end: false, icon: Mail02Icon },
    { to: '/admin/settings/captcha', label: 'Captcha', end: false, icon: Shield01Icon },
    { to: '/admin/settings/domains', label: 'Domains', end: false, icon: Globe02Icon },
    { to: '/admin/settings/branding', label: 'Branding', end: false, icon: PaintBrush02Icon },
    { to: '/admin/settings/advanced', label: 'Advanced', end: false, icon: Settings02Icon },
];

const AdminSettingsContainer = () => {
    const location = useLocation();

    const isActive = (tab: (typeof tabs)[0]) => {
        if (tab.end) return location.pathname === tab.to;
        return location.pathname.startsWith(tab.to);
    };

    return (
        <div>
            <MainPageHeader title='Settings' />

            <div className='flex items-center gap-2 p-1 bg-mocha-500/50 border border-mocha-400/50 rounded-xl w-fit mt-4'>
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.end}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            isActive(tab)
                                ? 'bg-mocha-400 text-cream-400 shadow-sm'
                                : 'text-mocha-200 hover:text-cream-400 hover:bg-mocha-400/30'
                        }`}
                    >
                        <HugeiconsIcon icon={tab.icon} className='w-4 h-4' />
                        {tab.label}
                    </NavLink>
                ))}
            </div>

            <div className='mt-4'>
                <Routes>
                    <Route path='' element={<GeneralSettingsTab />} />
                    <Route path='mail' element={<MailSettingsTab />} />
                    <Route path='captcha' element={<CaptchaSettingsTab />} />
                    <Route path='domains/*' element={<DomainsSettingsTab />} />
                    <Route path='branding' element={<BrandingSettingsTab />} />
                    <Route path='advanced' element={<AdvancedSettingsTab />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminSettingsContainer;
