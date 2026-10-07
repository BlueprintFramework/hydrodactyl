import { useState } from 'react';
import type { NodeOptions, NodeValues } from '@/api/admin/nodes';
import { Field } from '@/components/admin/Field';
import Dropdown from '@/components/elements/Dropdown';
import { Input } from '@/components/elements/inputs';
import { Button } from '@/components/ui/button';

export const emptyNodeValues: NodeValues = {
    name: '',
    description: '',
    location_id: '',
    daemonType: '',
    public: true,
    trust_alias: false,
    fqdn: '',
    internal_fqdn: '',
    scheme: 'https',
    behind_proxy: false,
    maintenance_mode: false,
    memory: '0',
    memory_overallocate: '0',
    disk: '0',
    disk_overallocate: '0',
    upload_size: '100',
    daemonListen: '8080',
    daemonSFTP: '2022',
    backupDisk: '',
    bucket: '',
};

const boolOptions = (yes: string, no: string) => [
    { value: 'true', label: yes },
    { value: 'false', label: no },
];

interface Props {
    options: NodeOptions;
    initialValues: NodeValues;
    submitLabel: string;
    submitting: boolean;
    errors: Record<string, string>;
    onSubmit: (values: NodeValues) => void;
    onCancel: () => void;
    showResetSecret?: boolean;
    resetSecret?: boolean;
    onResetSecretChange?: (value: boolean) => void;
}

const NodeForm = ({
    options,
    initialValues,
    submitLabel,
    submitting,
    errors,
    onSubmit,
    onCancel,
    showResetSecret,
    resetSecret,
    onResetSecretChange,
}: Props) => {
    const [values, setValues] = useState<NodeValues>(initialValues);

    const set = <K extends keyof NodeValues>(key: K, value: NodeValues[K]) =>
        setValues((current) => ({ ...current, [key]: value }));

    const changeDaemon = (daemonType: string) => {
        const disks = options.backupDisks[daemonType] ?? [];

        setValues((current) => ({
            ...current,
            daemonType,
            backupDisk: disks.includes(current.backupDisk) ? current.backupDisk : (disks[0] ?? current.backupDisk),
        }));
    };

    const backupDisks = options.backupDisks[values.daemonType] ?? [];
    const needsBucket = options.s3Required.includes(values.backupDisk);

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit(values);
            }}
            className='space-y-4'
        >
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>General</h2>

                    <Field label='Name' error={errors.name}>
                        <Input.Text value={values.name} onChange={(e) => set('name', e.target.value)} />
                    </Field>

                    <Field label='Description' error={errors.description} hint='Optional description for this node.'>
                        <Input.Text value={values.description} onChange={(e) => set('description', e.target.value)} />
                    </Field>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field label='Location' error={errors.location_id}>
                            <Dropdown
                                value={values.location_id}
                                onChange={(value) => set('location_id', value)}
                                placeholder='Select a location…'
                                options={options.locations.map((location) => ({
                                    value: String(location.id),
                                    label: location.short,
                                    description: location.long ?? undefined,
                                }))}
                            />
                        </Field>
                        <Field
                            label='Daemon'
                            error={errors.daemonType}
                            hint='Select the daemon software this node will run.'
                        >
                            <Dropdown
                                value={values.daemonType}
                                onChange={changeDaemon}
                                placeholder='Select a daemon…'
                                options={options.daemonTypes.map((value) => ({
                                    value,
                                    label: value.charAt(0).toUpperCase() + value.slice(1),
                                }))}
                            />
                        </Field>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field label='Public' error={errors.public}>
                            <Dropdown
                                value={String(values.public)}
                                onChange={(value) => set('public', value === 'true')}
                                options={boolOptions('Yes', 'No')}
                            />
                        </Field>
                        <Field
                            label='Trust Alias'
                            error={errors.trust_alias}
                            hint='Allow clients to connect using allocation aliases.'
                        >
                            <Dropdown
                                value={String(values.trust_alias)}
                                onChange={(value) => set('trust_alias', value === 'true')}
                                options={boolOptions('Yes', 'No')}
                            />
                        </Field>
                    </div>

                    <Field label='FQDN' error={errors.fqdn} hint='The domain used to connect to this node.'>
                        <Input.Text
                            value={values.fqdn}
                            placeholder='node.example.com'
                            onChange={(e) => set('fqdn', e.target.value)}
                        />
                    </Field>

                    <Field
                        label='Internal FQDN'
                        error={errors.internal_fqdn}
                        hint='Optional. Used when the panel reaches the node over a private network.'
                    >
                        <Input.Text
                            value={values.internal_fqdn}
                            placeholder='Leave blank to use the FQDN above'
                            onChange={(e) => set('internal_fqdn', e.target.value)}
                        />
                    </Field>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                        <Field label='Scheme' error={errors.scheme}>
                            <Dropdown
                                value={values.scheme}
                                onChange={(value) => set('scheme', value)}
                                options={[
                                    { value: 'https', label: 'HTTPS' },
                                    { value: 'http', label: 'HTTP' },
                                ]}
                            />
                        </Field>
                        <Field label='Behind Proxy' error={errors.behind_proxy}>
                            <Dropdown
                                value={String(values.behind_proxy)}
                                onChange={(value) => set('behind_proxy', value === 'true')}
                                options={boolOptions('Yes', 'No')}
                            />
                        </Field>
                        <Field label='Maintenance Mode' error={errors.maintenance_mode}>
                            <Dropdown
                                value={String(values.maintenance_mode)}
                                onChange={(value) => set('maintenance_mode', value === 'true')}
                                options={boolOptions('Enabled', 'Disabled')}
                            />
                        </Field>
                    </div>
                </div>

                <div className='space-y-4 rounded-xl border border-mocha-400 bg-mocha-500 p-4'>
                    <h2 className='text-sm font-semibold text-cream-50'>Resources</h2>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field label='Memory' error={errors.memory} hint='Total memory in mebibytes.'>
                            <Input.Text
                                type='number'
                                value={values.memory}
                                onChange={(e) => set('memory', e.target.value)}
                            />
                        </Field>
                        <Field label='Memory Overallocate' error={errors.memory_overallocate} hint='Percentage.'>
                            <Input.Text
                                type='number'
                                value={values.memory_overallocate}
                                onChange={(e) => set('memory_overallocate', e.target.value)}
                            />
                        </Field>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Field label='Disk' error={errors.disk} hint='Total disk in mebibytes.'>
                            <Input.Text
                                type='number'
                                value={values.disk}
                                onChange={(e) => set('disk', e.target.value)}
                            />
                        </Field>
                        <Field label='Disk Overallocate' error={errors.disk_overallocate} hint='Percentage.'>
                            <Input.Text
                                type='number'
                                value={values.disk_overallocate}
                                onChange={(e) => set('disk_overallocate', e.target.value)}
                            />
                        </Field>
                    </div>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                        <Field label='Upload Size' error={errors.upload_size} hint='Megabytes.'>
                            <Input.Text
                                type='number'
                                value={values.upload_size}
                                onChange={(e) => set('upload_size', e.target.value)}
                            />
                        </Field>
                        <Field label='Daemon Port' error={errors.daemonListen}>
                            <Input.Text
                                type='number'
                                value={values.daemonListen}
                                onChange={(e) => set('daemonListen', e.target.value)}
                            />
                        </Field>
                        <Field label='SFTP Port' error={errors.daemonSFTP}>
                            <Input.Text
                                type='number'
                                value={values.daemonSFTP}
                                onChange={(e) => set('daemonSFTP', e.target.value)}
                            />
                        </Field>
                    </div>

                    <Field label='Backup Storage' error={errors.backupDisk}>
                        <Dropdown
                            value={values.backupDisk}
                            onChange={(value) => set('backupDisk', value)}
                            options={backupDisks.map((value) => ({ value, label: value.replace(/_/g, ' ') }))}
                        />
                    </Field>

                    {needsBucket && (
                        <Field label='S3 Bucket' error={errors.bucket}>
                            <Dropdown
                                value={values.bucket}
                                onChange={(value) => set('bucket', value)}
                                placeholder='Select a bucket…'
                                options={options.s3Buckets.map((bucket) => ({
                                    value: String(bucket.id),
                                    label: bucket.name,
                                    description: bucket.bucket_name,
                                }))}
                            />
                        </Field>
                    )}
                </div>
            </div>

            {showResetSecret && (
                <div className='rounded-xl border border-mocha-400 bg-mocha-500 p-4 md:w-1/2'>
                    <Field
                        label='Reset Daemon Token'
                        error={errors.reset_secret}
                        hint='Generates a new token for the daemon on this node. You will need to re-run the auto-deploy command.'
                    >
                        <Dropdown
                            value={String(resetSecret ?? false)}
                            onChange={(value) => onResetSecretChange?.(value === 'true')}
                            options={[
                                { value: 'false', label: 'No' },
                                { value: 'true', label: 'Yes' },
                            ]}
                        />
                    </Field>
                </div>
            )}

            <div className='flex justify-end gap-2'>
                <Button type='button' variant='secondary' onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button type='submit' disabled={submitting}>
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
};

export default NodeForm;
