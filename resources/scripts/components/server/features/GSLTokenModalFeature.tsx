import { Form, Formik } from 'formik';
import { useEffect, useState } from 'react';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import Field from '@/components/elements/Field';
import Modal from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/I18nProvider';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';

interface Values {
    gslToken: string;
}

const GSLTokenModalFeature = () => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);

    useEffect(() => {
        if (!connected || !instance || status === 'running') return;

        const errors = ['(gsl token expired)', '(account not found)'];

        const listener = (line: string) => {
            if (errors.some((p) => line.toLowerCase().includes(p))) {
                setVisible(true);
            }
        };

        instance.addListener(SocketEvent.CONSOLE_OUTPUT, listener);

        return () => {
            instance.removeListener(SocketEvent.CONSOLE_OUTPUT, listener);
        };
    }, [connected, instance, status]);

    const updateGSLToken = (values: Values) => {
        setLoading(true);
        clearFlashes('feature:gslToken');

        updateStartupVariable(uuid, 'STEAM_ACC', values.gslToken)
            .then(() => {
                if (instance) {
                    instance.send(SocketRequest.SET_STATE, 'restart');
                }

                setLoading(false);
                setVisible(false);
            })
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: 'feature:gslToken', error });
            })
            .then(() => setLoading(false));
    };

    useEffect(() => {
        clearFlashes('feature:gslToken');
    }, [clearFlashes]);

    return (
        <Formik onSubmit={updateGSLToken} initialValues={{ gslToken: '' }}>
            <Modal
                visible={visible}
                onDismissed={() => setVisible(false)}
                closeOnBackground={false}
                showSpinnerOverlay={loading}
                title={t('server.features.gsl_token.title')}
            >
                <FlashMessageRender key={'feature:gslToken'} />
                <Form>
                    <p>{t('server.features.gsl_token.description')}</p>
                    <p className={`mt-3`}>{t('server.features.gsl_token.instructions')}</p>
                    <div className={`sm:flex items-center mt-6`}>
                        <Field
                            name={'gslToken'}
                            label={t('server.features.gsl_token.token_label')}
                            description={t('server.features.gsl_token.token_description')}
                            autoFocus
                        />
                    </div>
                    <div className={`my-6 sm:flex items-center justify-end`}>
                        <Button variant='attention' type={'submit'}>
                            {t('server.features.gsl_token.update')}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </Formik>
    );
};

export default GSLTokenModalFeature;
