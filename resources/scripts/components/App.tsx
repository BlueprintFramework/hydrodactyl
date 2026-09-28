// Because of how react-router, react lazy, and signals work with each other
// the only way to prevent mismatching and weird errors is to import the lib
// in the root first. The github issue for this is still open. Stupid.
// https://github.com/preactjs/signals/issues/414
import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import '@/assets/tailwind.css';
import '@preact/signals-react';
import { StoreProvider } from 'easy-peasy';
import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import AuthenticatedRoute from '@/components/elements/AuthenticatedRoute';
import { NotFound } from '@/components/elements/ScreenBlock';
import Spinner from '@/components/elements/Spinner';
import I18nProvider from '@/i18n/I18nProvider';

import { store } from '@/state';
import { hydrateStore } from '@/state/bootstrap';
import { ServerContext } from '@/state/server';

import HydrodactylProvider from './HydrodactylProvider';

// const DashboardRouter = lazy(() => import('@/routers/DashboardRouter'));
// const ServerRouter = lazy(() => import('@/routers/ServerRouter'));
const UnifiedRouter = lazy(() => import('@/routers/UnifiedRouter'));
const AuthenticationRouter = lazy(() => import('@/routers/AuthenticationRouter'));
const SetupRouter = lazy(() => import('@/routers/SetupRouter'));

const App = () => {
    hydrateStore();

    return (
        <>
            <GlobalStylesheet />
            <StoreProvider store={store}>
                <I18nProvider>
                    <HydrodactylProvider>
                        <div
                            data-hydrodactyl-routerwrap=''
                            className='relative w-full h-full flex flex-row p-2 overflow-hidden rounded-lg'
                        >
                            <Toaster
                                theme='dark'
                                toastOptions={{
                                    unstyled: true,
                                    classNames: {
                                        toast: 'p-4 bg-[#ffffff09] border border-[#ffffff12] rounded-2xl shadow-lg backdrop-blur-2xl flex items-center w-full gap-2',
                                    },
                                }}
                            />
                            <BrowserRouter>
                                <Routes>
                                    <Route
                                        path='/setup/*'
                                        element={
                                            <Spinner.Suspense>
                                                <SetupRouter />
                                            </Spinner.Suspense>
                                        }
                                    />
                                    <Route
                                        path='/auth/*'
                                        element={
                                            <Spinner.Suspense>
                                                <AuthenticationRouter />
                                            </Spinner.Suspense>
                                        }
                                    />

                                    <Route
                                        path='/*'
                                        element={
                                            <AuthenticatedRoute>
                                                <Spinner.Suspense>
                                                    <ServerContext.Provider>
                                                        <UnifiedRouter />
                                                    </ServerContext.Provider>
                                                </Spinner.Suspense>
                                            </AuthenticatedRoute>
                                        }
                                    />

                                    {/* <Route */}
                                    {/*     path='/*' */}
                                    {/*     element={ */}
                                    {/*         <AuthenticatedRoute> */}
                                    {/*             <Spinner.Suspense> */}
                                    {/*                 <DashboardRouter /> */}
                                    {/*             </Spinner.Suspense> */}
                                    {/*         </AuthenticatedRoute> */}
                                    {/*     } */}
                                    {/* /> */}

                                    <Route path='*' element={<NotFound />} />
                                </Routes>
                            </BrowserRouter>
                        </div>
                    </HydrodactylProvider>
                </I18nProvider>
            </StoreProvider>
        </>
    );
};

export default App;
