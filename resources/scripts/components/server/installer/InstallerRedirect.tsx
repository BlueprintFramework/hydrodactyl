import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useNests } from '@/plugins/useNests';
import { ServerContext } from '@/state/server';
import { supportsType } from './eggFeatures';
import { mergeEggMarketplaceFeatures } from './hybridEggFeatures';

/**
 * Legacy `/server/:id/installer` lands here and forwards to the section the egg
 * supports: plugins first, then modpacks (mod-loader eggs), then mods.
 */
const InstallerRedirect = () => {
    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const eggId = ServerContext.useStoreState((state) => state.server.data?.egg);
    const rawEggFeatures = ServerContext.useStoreState((state) => state.server.data?.eggFeatures ?? []);
    const { data: nests } = useNests();
    const eggName = useMemo(
        () =>
            nests
                ?.find((nest) => nest.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === eggId))
                ?.attributes.relationships.eggs.data.find((egg) => egg.attributes.uuid === eggId)?.attributes.name,
        [nests, eggId],
    );
    const eggFeatures = useMemo(() => mergeEggMarketplaceFeatures(rawEggFeatures, eggName), [rawEggFeatures, eggName]);

    if (!id) {
        return null;
    }

    if (supportsType(eggFeatures, 'plugin')) {
        return <Navigate to={`/server/${id}/installer/plugins`} replace />;
    }

    if (supportsType(eggFeatures, 'modpack')) {
        return <Navigate to={`/server/${id}/installer/modpacks`} replace />;
    }

    if (supportsType(eggFeatures, 'mod')) {
        return <Navigate to={`/server/${id}/installer/mods`} replace />;
    }

    return <Navigate to={`/server/${id}`} replace />;
};

export default InstallerRedirect;
