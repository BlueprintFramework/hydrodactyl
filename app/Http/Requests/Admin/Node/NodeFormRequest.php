<?php

namespace Pterodactyl\Http\Requests\Admin\Node;

use Pterodactyl\Rules\Fqdn;
use Pterodactyl\Models\Node;
use Illuminate\Validation\Rule;
use Pterodactyl\Enums\Daemon\DaemonType;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class NodeFormRequest extends AdminFormRequest
{
    /**
     * Get rules to apply to data in this request.
     */
    public function rules(): array
    {
        $daemonType = ['required', 'string', Rule::in(DaemonType::values())];

        if ($this->method() === 'PATCH') {
            $rules = Node::getRulesForUpdate($this->route()->parameter('node'));
            $rules['internal_fqdn'] = ['nullable', 'string', Fqdn::make('scheme')];
            $rules['daemonType'] = $daemonType;

            return $rules;
        }

        $data = Node::getRules();
        $data['fqdn'][] = Fqdn::make('scheme');
        $data['internal_fqdn'] = ['nullable', 'string', Fqdn::make('scheme')];
        $data['daemonType'] = $daemonType;

        return $data;
    }
}
