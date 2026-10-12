<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Subusers;

use Illuminate\Validation\Rule;
use Pterodactyl\Models\Permission;
use Pterodactyl\Rules\Username;

class StoreSubuserRequest extends SubuserRequest
{
    public function permission(): string
    {
        return Permission::ACTION_USER_CREATE;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'between:1,191',
                Rule::when(
                    fn ($input) => !preg_match('/^.+@.+\..+$/', (string) $input->email),
                    [new Username()],
                ),
            ],
            'permissions' => 'required|array',
            'permissions.*' => 'string',
        ];
    }

    public function messages(): array
    {
        return [
            'email.regex' => 'Enter an existing username, or an email address to invite someone new.',
        ];
    }
}
