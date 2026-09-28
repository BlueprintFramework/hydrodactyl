import type { Translate } from '@/i18n/types';

interface EggVariable {
    id: number;
    name: string;
    description: string;
    env_variable: string;
    default_value: string;
    user_viewable: boolean;
    user_editable: boolean;
    rules: string;
}

interface Egg {
    object: string;
    attributes: {
        id: number;
        uuid: string;
        name: string;
        description: string;
    };
}

interface Nest {
    object: string;
    attributes: {
        id: number;
        uuid: string;
        author: string;
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        relationships: {
            eggs: {
                object: string;
                data: Egg[];
            };
        };
    };
}

const MAX_DESCRIPTION_LENGTH = 150;
const hidden_nest_prefix = '!';
const blank_egg_prefix = '@';

type FlowStep = 'overview' | 'select-game' | 'select-software' | 'configure' | 'review';

const validateEnvironmentVariables = (
    variables: EggVariable[],
    pendingVariables: Record<string, string>,
    t: Translate,
): string[] => {
    const errors: string[] = [];

    variables.forEach((variable) => {
        if (!variable.user_editable) return;

        const value = pendingVariables[variable.env_variable] || '';
        const rules = variable.rules || '';
        const ruleArray = rules
            .split('|')
            .map((rule) => rule.trim())
            .filter((rule) => rule.length > 0);

        const isRequired = ruleArray.includes('required');
        const isNullable = ruleArray.includes('nullable') || !isRequired;

        if (isRequired && (!value || value.trim() === '')) {
            errors.push(t('server.software.validation.required', { name: variable.name }));
            return;
        }

        if (isNullable && (!value || value.trim() === '')) {
            return;
        }

        ruleArray.forEach((rule) => {
            const [ruleName, ruleValue] = rule.split(':');

            switch (ruleName) {
                case 'string':
                    if (typeof value !== 'string') {
                        errors.push(t('server.software.validation.string', { name: variable.name }));
                    }
                    break;

                case 'integer':
                case 'numeric':
                    if (value && Number.isNaN(Number(value))) {
                        errors.push(t('server.software.validation.number', { name: variable.name }));
                    }
                    break;

                case 'boolean': {
                    const boolValues = ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'];
                    if (value && !boolValues.includes(value.toLowerCase())) {
                        errors.push(t('server.software.validation.boolean', { name: variable.name }));
                    }
                    break;
                }

                case 'min': {
                    if (ruleValue && value) {
                        const minValue = parseInt(ruleValue, 10);
                        if (value.length < minValue) {
                            errors.push(t('server.software.validation.min', { name: variable.name, min: minValue }));
                        }
                    }
                    break;
                }

                case 'max': {
                    if (ruleValue && value) {
                        const maxValue = parseInt(ruleValue, 10);
                        if (value.length > maxValue) {
                            errors.push(t('server.software.validation.max', { name: variable.name, max: maxValue }));
                        }
                    }
                    break;
                }

                case 'between': {
                    if (ruleValue && value) {
                        const [min, max] = ruleValue.split(',').map((v) => parseInt(v.trim(), 10));
                        if (value.length < min || value.length > max) {
                            errors.push(t('server.software.validation.between', { name: variable.name, min, max }));
                        }
                    }
                    break;
                }

                case 'in': {
                    if (ruleValue && value) {
                        const allowedValues = ruleValue.split(',').map((v) => v.trim());
                        if (!allowedValues.includes(value)) {
                            errors.push(
                                t('server.software.validation.one_of', {
                                    name: variable.name,
                                    values: allowedValues.join(', '),
                                }),
                            );
                        }
                    }
                    break;
                }

                case 'regex': {
                    if (ruleValue && value) {
                        try {
                            const regexMatch = ruleValue.match(/^\/(.+)\/([gimuy]*)$/);
                            if (regexMatch) {
                                const regex = new RegExp(regexMatch[1], regexMatch[2]);
                                if (!regex.test(value)) {
                                    errors.push(
                                        t('server.software.validation.format_invalid', { name: variable.name }),
                                    );
                                }
                            }
                        } catch {
                            // Invalid regex - skip validation
                        }
                    }
                    break;
                }

                case 'alpha':
                    if (value && !/^[a-zA-Z]+$/.test(value)) {
                        errors.push(t('server.software.validation.only_alpha', { name: variable.name }));
                    }
                    break;

                case 'alpha_num':
                    if (value && !/^[a-zA-Z0-9]+$/.test(value)) {
                        errors.push(t('server.software.validation.only_alpha_num', { name: variable.name }));
                    }
                    break;

                case 'alpha_dash':
                    if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
                        errors.push(t('server.software.validation.only_alpha_dash', { name: variable.name }));
                    }
                    break;

                case 'url':
                    if (value) {
                        try {
                            new URL(value);
                        } catch {
                            errors.push(t('server.software.validation.url', { name: variable.name }));
                        }
                    }
                    break;

                case 'email':
                    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        errors.push(t('server.software.validation.email', { name: variable.name }));
                    }
                    break;

                case 'ip': {
                    if (value) {
                        const ipRegex =
                            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                        if (!ipRegex.test(value)) {
                            errors.push(t('server.software.validation.ip', { name: variable.name }));
                        }
                    }
                    break;
                }

                case 'required':
                case 'nullable':
                case 'sometimes':
                    break;

                default:
                    if (
                        process.env.NODE_ENV === 'development' &&
                        !['string', 'array', 'file', 'image'].includes(ruleName)
                    ) {
                        console.warn(`Unknown validation rule: ${ruleName} for variable ${variable.name}`);
                    }
                    break;
            }
        });
    });

    return errors;
};

export type { Egg, EggVariable, FlowStep, Nest };
export { blank_egg_prefix, hidden_nest_prefix, MAX_DESCRIPTION_LENGTH, validateEnvironmentVariables };
