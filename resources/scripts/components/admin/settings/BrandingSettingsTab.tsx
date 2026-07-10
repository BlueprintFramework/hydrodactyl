import { useEffect, useRef, useState } from 'react';

import Spinner from '@/components/elements/Spinner';
import { getBrandingSettings, type BrandingSettings, updateBrandingSettings } from '@/api/admin/settings';
import { httpErrorToHuman } from '@/api/http';

const BrandingSettingsTab = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<BrandingSettings | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [urlPreview, setUrlPreview] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getBrandingSettings()
            .then(setSettings)
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setLoading(false));
    }, []);

    const handleFileSelect = (file: File) => {
        if (!file.type.match('image.*')) return;
        setSelectedFile(file);
        setLogoUrl('');
        setUrlPreview(null);

        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleUrlPreview = () => {
        if (!logoUrl.trim()) return;
        setUrlPreview(logoUrl.trim());
        setSelectedFile(null);
        setFilePreview(null);
    };

    const handleSave = (remove?: boolean, rewindIndex?: number) => {
        setError(null);
        setSuccess(false);
        setSaving(true);

        const formData = new FormData();
        if (remove) {
            formData.append('remove', '1');
        } else if (rewindIndex !== undefined) {
            formData.append('rewind', String(rewindIndex));
        } else if (selectedFile) {
            formData.append('logo_file', selectedFile);
        } else if (logoUrl.trim()) {
            formData.append('logo_url', logoUrl.trim());
        } else {
            setError('Please select a logo file or enter a URL.');
            setSaving(false);
            return;
        }

        updateBrandingSettings(formData)
            .then(() => {
                setSuccess(true);
                setFilePreview(null);
                setUrlPreview(null);
                setSelectedFile(null);
                setLogoUrl('');
                return getBrandingSettings();
            })
            .then(setSettings)
            .catch((e) => setError(httpErrorToHuman(e)))
            .finally(() => setSaving(false));
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center py-16'>
                <Spinner />
            </div>
        );
    }

    const history = settings?.history || [];
    const currentLogoUrl = settings?.logoUrl;

    return (
        <div className='mt-6 space-y-6'>
            {error && (
                <div className='bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400 text-sm'>
                    {error}
                </div>
            )}
            {success && (
                <div className='bg-green-900/20 border border-green-800 rounded-lg p-4 text-green-400 text-sm'>
                    Logo settings updated successfully.
                </div>
            )}

            <div className='bg-amber-900/20 border border-amber-800 rounded-lg p-4 text-amber-400 text-sm flex items-start gap-2'>
                <svg className='w-5 h-5 shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' />
                </svg>
                <span><strong>Experimental:</strong> Logo customization is a new, experimental feature. Some aspects may change in future updates.</span>
            </div>

            <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden'>
                <div className='px-5 py-4 border-b border-gray-800'>
                    <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>Current Logo</h3>
                </div>
                <div className='p-5'>
                    <div className='flex items-center justify-center'>
                        <div className='flex items-center justify-center min-h-[120px]'>
                            {currentLogoUrl ? (
                                <img src={currentLogoUrl} alt='Current Logo' className='max-w-full max-h-[200px] rounded' />
                            ) : (
                                <svg width='80' height='80' viewBox='0 0 100 92' fill='none' xmlns='http://www.w3.org/2000/svg'>
                                    <path d='M35.1293 92L39.2242 59.3897L44.8276 60.4695L14.2241 81.2019L0 57.0141L32.7586 45.3521V47.7277L0 33.4742L14.2241 8.85446L45.6896 33.2582L39.2242 34.1221L34.4828 0H65.5172L61.4225 33.9061L56.681 32.8263L85.7759 8.85446L100 33.4742L66.1638 47.7277V45.5681L99.569 57.0141L85.3448 81.2019L57.5431 59.3897H61.638L66.1638 92H35.1293Z' fill='#52A9FF' />
                                </svg>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden'>
                <div className='px-5 py-4 border-b border-gray-800'>
                    <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>Upload New Logo</h3>
                </div>
                <div className='p-5'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-2'>Upload Logo</label>
                            <div
                                className='border-2 border-dashed border-gray-700 rounded-lg p-10 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-900/10'
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
                                onDragLeave={(e) => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.background = 'transparent'; }}
                                onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.background = 'transparent'; if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                            >
                                <svg className='w-12 h-12 text-gray-600 mx-auto mb-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                                </svg>
                                <p className='text-gray-500 text-sm'><strong className='text-gray-400'>Click to choose</strong> or drag and drop</p>
                                <p className='text-gray-600 text-xs mt-1'>PNG, JPG, GIF, WEBP or SVG (max 2MB)</p>
                                <input
                                    ref={fileInputRef}
                                    type='file'
                                    accept='image/png,image/jpeg,image/gif,image/webp,image/svg+xml'
                                    className='hidden'
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                />
                            </div>
                            {filePreview && (
                                <div className='mt-3 text-center'>
                                    <img src={filePreview} alt='Preview' className='max-w-full max-h-[150px] rounded mx-auto border border-gray-700 p-1' />
                                    <p className='text-gray-500 text-xs mt-1'>Preview</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-400 mb-2'>Or use a URL</label>
                            <div className='flex gap-1'>
                                <input
                                    type='url'
                                    className='flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500'
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    placeholder='https://example.com/logo.png'
                                />
                                <button
                                    type='button'
                                    onClick={handleUrlPreview}
                                    className='px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded font-medium transition-colors'
                                >
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                    </svg>
                                </button>
                            </div>
                            <p className='text-xs text-gray-600 mt-1'>Enter a direct link to an image hosted elsewhere.</p>
                            {urlPreview && (
                                <div className='mt-3 text-center'>
                                    <img src={urlPreview} alt='URL Preview' className='max-w-full max-h-[150px] rounded mx-auto border border-gray-700 p-1' />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className='px-5 py-4 border-t border-gray-800 flex items-center justify-end gap-2'>
                    {currentLogoUrl && (
                        <button
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className='px-4 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-red-200 text-sm rounded font-medium transition-colors flex items-center gap-1.5'
                        >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                            Remove Logo
                        </button>
                    )}
                    <button
                        onClick={() => handleSave()}
                        disabled={saving || (!selectedFile && !logoUrl.trim())}
                        className='px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded font-medium transition-colors flex items-center gap-1.5'
                    >
                        {saving && (
                            <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                                <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
                            </svg>
                        )}
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' />
                        </svg>
                        Save Logo
                    </button>
                </div>
            </div>

            {history.length > 0 && (
                <div className='bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden'>
                    <div className='px-5 py-4 border-b border-gray-800'>
                        <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wider'>Logo History <span className='text-gray-600 font-normal normal-case'>(Last 10 logos)</span></h3>
                    </div>
                    <div className='p-5'>
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                            {history.map((entry, index) => {
                                const isCurrent = settings?.logoType && settings?.logoValue && entry.type === settings.logoType && entry.value === settings.logoValue;
                                const imgSrc = entry.type === 'upload' ? `/storage/${entry.value}` : entry.value;
                                return (
                                    <div
                                        key={index}
                                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all text-center ${isCurrent ? 'border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'border-gray-700 hover:border-gray-600'}`}
                                        onClick={() => { if (!isCurrent && confirm('Switch to this logo version?')) handleSave(false, index); }}
                                    >
                                        <img src={imgSrc} alt={`Logo ${index + 1}`} className='max-w-full max-h-[80px] mx-auto rounded' onError={(e) => { (e.target as HTMLElement).closest('[class*="border"]')?.classList.add('hidden'); }} />
                                        <p className={`text-xs mt-1 font-medium ${isCurrent ? 'text-blue-400' : 'text-gray-500'}`}>
                                            {isCurrent ? 'Current' : `#${index + 1}`}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandingSettingsTab;
