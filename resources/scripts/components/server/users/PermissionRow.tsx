import { useField } from 'formik';
import { useStoreState } from 'easy-peasy';

import { Checkbox } from '@/components/elements/CheckboxNew';

interface Props {
    permission: string;
    disabled: boolean;
}

const PermissionRow = ({ permission, disabled }: Props) => {
    const [key = '', pkey = ''] = permission.split('.', 2);
    const permissions = useStoreState((state) => state.permissions.data);
    const [{ value }, , { setValue }] = useField<string[]>('permissions');

    const checked = value?.includes(permission) ?? false;

    return (
        <label
            htmlFor={`permission_${permission}`}
            className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#ffffff06]'
            }`}
        >
            <Checkbox
                id={`permission_${permission}`}
                name='permissions'
                value={permission}
                checked={checked}
                onCheckedChange={() => {
                    if (checked) {
                        setValue(value.filter((p) => p !== permission));
                    } else {
                        setValue([...value, permission]);
                    }
                }}
                disabled={disabled}
                className='mt-0.5'
            />
            <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-zinc-200'>{pkey}</p>
                {(permissions[key]?.keys?.[pkey]?.length ?? 0) > 0 && (
                    <p className='text-xs text-zinc-400 mt-0.5'>{permissions[key]?.keys?.[pkey] ?? ''}</p>
                )}
            </div>
        </label>
    );
};

export default PermissionRow;
