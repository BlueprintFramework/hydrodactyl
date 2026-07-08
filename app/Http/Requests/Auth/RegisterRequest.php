<?php

namespace Pterodactyl\Http\Requests\Auth;

use Pterodactyl\Rules\Username;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorized(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email:rfc', 'between:1,191', 'unique:users,email'],
            'username' => ['required', 'string', 'between:1,191', 'unique:users,username', new Username()],
            'name_first' => ['required', 'string', 'between:1,191'],
            'name_last' => ['nullable', 'string', 'between:0,191'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
