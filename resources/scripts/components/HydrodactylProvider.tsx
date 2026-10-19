import { AppearanceProvider } from '@/contexts/AppearanceContext';

// million-ignore
const HydrodactylProvider = ({ children }) => {
    return (
        <AppearanceProvider>
            <div
                data-hydrodactyl-hydrodactylprovider=''
                data-hydrodactyl-hydrodactyl-version={import.meta.env.VITE_HYDRODACTYL_VERSION}
                data-hydrodactyl-hydrodactyl-build={import.meta.env.VITE_HYDRODACTYL_BUILD_NUMBER}
                data-hydrodactyl-commit-hash={import.meta.env.VITE_COMMIT_HASH}
                style={{
                    display: 'contents',
                }}
            >
                {children}
            </div>
        </AppearanceProvider>
    );
};

export default HydrodactylProvider;
