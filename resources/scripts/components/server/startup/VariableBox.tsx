import { Lock } from '@gravity-ui/icons';
import debounce from 'debounce';
import { useStoreState } from 'easy-peasy';
import { memo, useState } from 'react';
import isEqual from 'react-fast-compare';
import type { ServerEggVariable } from '@/api/server/types';
import updateStartupVariable from '@/api/server/updateStartupVariable';
import getServerStartup from '@/api/swr/getServerStartup';
import Dropdown from '@/components/elements/Dropdown';
import InputSpinner from '@/components/elements/InputSpinner';
import { Switch } from '@/components/elements/SwitchV2';
import { Input } from '@/components/elements/TextInput';
import useFlash from '@/plugins/useFlash';
import { usePermissions } from '@/plugins/usePermissions';
import { ServerContext } from '@/state/server';

interface Props {
    variable: ServerEggVariable;
}

const VariableBox = ({ variable }: Props) => {
    const FLASH_KEY = `server:startup:${variable.envVariable}`;

    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const [loading, setLoading] = useState(false);
    const [canEdit] = usePermissions(['startup.update']);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const error = useStoreState((state) => state.flashes.items.find((flash) => flash.key === FLASH_KEY)?.message ?? '');
    const { mutate } = getServerStartup(uuid);
    const setVariableValue = debounce((value: string) => {
        setLoading(true);
        clearFlashes(FLASH_KEY);

        updateStartupVariable(uuid, variable.envVariable, value)
            .then(([response, invocation]) =>
                mutate(
                    (data) => ({
                        ...(data ?? {}),
                        invocation,
                        variables: (data?.variables || []).map((v) =>
                            v.envVariable === response.envVariable ? response : v,
                        ),
                    }),
                    false,
                ),
            )
            .catch((error) => {
                console.error(error);
                clearAndAddHttpError({ key: FLASH_KEY, error });
            })
            .then(() => setLoading(false));
    }, 500);

    const useSwitch = variable.rules.some(
        (v) => v === 'boolean' || v === 'in:0,1' || v === 'in:1,0' || v === 'in:true,false' || v === 'in:false,true',
    );
    const isStringSwitch = variable.rules.some((v) => v === 'string');
    const selectValues = variable.rules.find((v) => v.startsWith('in:'))?.split(',') || [];

    return (
        <div className='flex flex-col gap-3 border-b border-[#ffffff10] py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8'>
            <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                    {!variable.isEditable && (
                        <Lock width={16} height={16} fill='currentColor' className='shrink-0 text-zinc-500' />
                    )}
                    <span className='text-sm text-zinc-100'>{variable.name}</span>
                </div>
                <p className='mt-0.5 font-mono text-xs text-zinc-500'>{variable.envVariable}</p>
                {variable.description && (
                    <p className='mt-2 text-sm leading-relaxed text-zinc-400'>{variable.description}</p>
                )}
            </div>
            <div className='relative w-full sm:w-[28rem] sm:shrink-0'>
                {error && (
                    <p className='absolute right-0 bottom-full mb-1 max-w-full truncate text-xs text-red-400'>
                        {error}
                    </p>
                )}
                <InputSpinner visible={loading}>
                    {useSwitch ? (
                        <div className='flex items-center justify-between gap-3'>
                            <span className='text-sm text-zinc-300'>
                                {isStringSwitch
                                    ? variable.serverValue === 'true'
                                        ? 'Enabled'
                                        : 'Disabled'
                                    : variable.serverValue === '1'
                                      ? 'On'
                                      : 'Off'}
                            </span>
                            <Switch
                                disabled={!canEdit || !variable.isEditable}
                                name={variable.envVariable}
                                defaultChecked={
                                    isStringSwitch ? variable.serverValue === 'true' : variable.serverValue === '1'
                                }
                                onCheckedChange={() => {
                                    if (canEdit && variable.isEditable) {
                                        if (isStringSwitch) {
                                            setVariableValue(variable.serverValue === 'true' ? 'false' : 'true');
                                        } else {
                                            setVariableValue(variable.serverValue === '1' ? '0' : '1');
                                        }
                                    }
                                }}
                            />
                        </div>
                    ) : selectValues.length > 0 && (variable.serverValue ?? variable.defaultValue) ? (
                        <Dropdown
                            value={variable.serverValue ?? ''}
                            onChange={setVariableValue}
                            disabled={!canEdit || !variable.isEditable}
                            triggerClassName='font-mono'
                            options={selectValues.map((selectValue) => {
                                const value = selectValue.replace('in:', '');
                                return { value, label: value };
                            })}
                        />
                    ) : (
                        <Input
                            className='w-full'
                            onKeyUp={(e) => {
                                if (canEdit && variable.isEditable) {
                                    setVariableValue(e.currentTarget.value);
                                }
                            }}
                            readOnly={!canEdit || !variable.isEditable}
                            name={variable.envVariable}
                            defaultValue={variable.serverValue ?? ''}
                            placeholder={variable.defaultValue || 'Enter value...'}
                            disabled={!canEdit || !variable.isEditable}
                        />
                    )}
                </InputSpinner>
            </div>
        </div>
    );
};

export default memo(VariableBox, isEqual);
