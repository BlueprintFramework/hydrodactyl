import { Model, UUID } from '@/api/definitions';

import { SubuserPermission } from '@/state/server/subusers';

interface User extends Model {
    uuid: string;
    username: string;
    email: string;
    image: string;
    twoFactorEnabled: boolean;
    createdAt: Date;
    permissions: SubuserPermission[];
    can(permission: SubuserPermission): boolean;
}

export interface SSHKey extends Model {
    name: string;
    publicKey: string;
    fingerprint: string;
    createdAt: Date;
}

export interface ActivityLogDescriptionPart {
    type: 'text' | 'value';
    content: string;
}

export interface ActivityLog extends Model<'actor'> {
    id: string;
    batch: UUID | null;
    event: string;
    ip: string | null;
    isApi: boolean;
    description: string | null;
    descriptionParts: ActivityLogDescriptionPart[] | null;
    properties: Record<string, string | unknown>;
    hasAdditionalMetadata: boolean;
    timestamp: Date;
    relationships: {
        actor: User | null;
    };
}
