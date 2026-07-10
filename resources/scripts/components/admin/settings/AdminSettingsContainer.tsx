import { NavLink, Route, Routes } from 'react-router-dom';

import { MainPageHeader } from '@/components/elements/MainPageHeader';

import GeneralSettingsTab from '@/components/admin/settings/GeneralSettingsTab';
import MailSettingsTab from '@/components/admin/settings/MailSettingsTab';
import CaptchaSettingsTab from '@/components/admin/settings/CaptchaSettingsTab';
import DomainsSettingsTab from '@/components/admin/settings/DomainsSettingsTab';
import BrandingSettingsTab from '@/components/admin/settings/BrandingSettingsTab';
import AdvancedSettingsTab from '@/components/admin/settings/AdvancedSettingsTab';

const tabs = [
    { to: '/admin/settings', label: 'General', end: true },
    { to: '/admin/settings/mail', label: 'Mail', end: false },
    { to: '/admin/settings/captcha', label: 'Captcha', end: false },
    { to: '/admin/settings/domains', label: 'Domains', end: false },
    { to: '/admin/settings/branding', label: 'Branding', end: false },
    { to: '/admin/settings/advanced', label: 'Advanced', end: false },
];

const AdminSettingsContainer = () => {
    return (
        <div>
            <MainPageHeader title='Settings' />

            <div className='flex items-center space-x-1 border-b border-gray-800 overflow-x-auto'>
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.end}
                        className='whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                        style={({ isActive }) =>
                            isActive
                                ? { borderColor: '#3b82f6', color: '#60a5fa' }
                                : undefined
                        }
                    >
                        {tab.label}
                    </NavLink>
                ))}
            </div>

            <Routes>
                <Route path='' element={<GeneralSettingsTab />} />
                <Route path='mail' element={<MailSettingsTab />} />
                <Route path='captcha' element={<CaptchaSettingsTab />} />
                <Route path='domains/*' element={<DomainsSettingsTab />} />
                <Route path='branding' element={<BrandingSettingsTab />} />
                <Route path='advanced' element={<AdvancedSettingsTab />} />
            </Routes>
        </div>
    );
};

export default AdminSettingsContainer;
